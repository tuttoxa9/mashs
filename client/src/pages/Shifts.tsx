import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getInitials, formatTime } from "@/lib/utils";
import ShiftForm from "@/components/employees/ShiftForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function Shifts() {
  const [selectedTab, setSelectedTab] = useState("today");
  const [date, setDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isShiftFormOpen, setIsShiftFormOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  
  // Format dates for API requests
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = date.toISOString().split('T')[0];
  
  // Get week start and end dates
  const getWeekDates = () => {
    const startDate = new Date(date);
    const day = startDate.getDay();
    // If Sunday, go to previous Monday
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };
  
  const weekDates = getWeekDates();
  
  // Fetch shifts based on selected tab
  const { data: shifts, isLoading, refetch } = useQuery({
    queryKey: ['/api/shifts', selectedTab, selectedDate, weekDates],
    queryFn: async () => {
      try {
        let url = '/api/shifts';
        
        if (selectedTab === 'today') {
          url = `/api/shifts?date=${today}`;
        } else if (selectedTab === 'date') {
          url = `/api/shifts?date=${selectedDate}`;
        } else if (selectedTab === 'week') {
          // In a real implementation, we would have an endpoint for fetching shifts by date range
          // For now, we'll just fetch all and filter client-side
          url = `/api/shifts`;
        }
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Не удалось загрузить смены');
        
        let data = await res.json();
        
        // Filter for week tab client-side (in a real app, the API would handle this)
        if (selectedTab === 'week') {
          data = data.filter((shift: any) => 
            shift.date >= weekDates.start && 
            shift.date <= weekDates.end
          );
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching shifts:', error);
        return [];
      }
    }
  });
  
  // Fetch employees for display
  const { data: employees } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Не удалось загрузить сотрудников');
        return res.json();
      } catch (error) {
        console.error('Error fetching employees:', error);
        return [];
      }
    }
  });
  
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setIsCalendarOpen(false);
      setSelectedTab('date'); // Switch to date tab
    }
  };
  
  const handleAddShift = () => {
    setSelectedShiftId(null);
    setIsShiftFormOpen(true);
  };
  
  const handleEditShift = (shiftId: number) => {
    setSelectedShiftId(shiftId);
    setIsShiftFormOpen(true);
  };
  
  const closeShiftForm = () => {
    setIsShiftFormOpen(false);
    setSelectedShiftId(null);
    refetch(); // Refresh shifts after changes
  };
  
  // Find employee by ID
  const getEmployeeName = (userId: number) => {
    if (!employees) return "...";
    const employee = employees.find((emp: any) => emp.id === userId);
    return employee ? `${employee.name} ${employee.surname}` : "Неизвестный сотрудник";
  };
  
  // Group shifts by date for week view
  const groupShiftsByDate = () => {
    if (!shifts) return {};
    
    const grouped: Record<string, any[]> = {};
    shifts.forEach((shift: any) => {
      if (!grouped[shift.date]) {
        grouped[shift.date] = [];
      }
      grouped[shift.date].push(shift);
    });
    
    return grouped;
  };
  
  const shiftsByDate = groupShiftsByDate();
  
  // Get day of week name
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEEE', { locale: ru });
  };
  
  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'd MMMM yyyy', { locale: ru });
  };
  
  return (
    <AppLayout title="Смены">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap justify-between items-center">
              <CardTitle>Управление сменами</CardTitle>
              <div className="flex items-center space-x-2">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP', { locale: ru }) : <span>Выберите дату</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button onClick={handleAddShift}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить смену
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="today">Сегодня</TabsTrigger>
                <TabsTrigger value="date">По дате</TabsTrigger>
                <TabsTrigger value="week">Неделя</TabsTrigger>
              </TabsList>
              
              <TabsContent value="today">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Смены на сегодня: {format(new Date(), 'd MMMM yyyy', { locale: ru })}</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Сотрудник</TableHead>
                            <TableHead>Время</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Заработок</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shifts && shifts.length > 0 ? (
                            shifts.map((shift: any) => (
                              <TableRow key={shift.id}>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                      {employees ? (
                                        <span className="font-heading text-xs">
                                          {getInitials(
                                            employees.find((e: any) => e.id === shift.userId)?.name || '',
                                            employees.find((e: any) => e.id === shift.userId)?.surname || ''
                                          )}
                                        </span>
                                      ) : (
                                        <span className="font-heading text-xs">...</span>
                                      )}
                                    </div>
                                    <span className="font-medium">{getEmployeeName(shift.userId)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                </TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    shift.status === 'scheduled' ? "bg-blue-100 text-blue-800" :
                                    shift.status === 'active' ? "bg-green-100 text-green-800" :
                                    "bg-gray-100 text-gray-800"
                                  )}>
                                    {shift.status === 'scheduled' ? 'Запланирована' :
                                     shift.status === 'active' ? 'Активна' : 'Завершена'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {new Intl.NumberFormat('ru-RU', {
                                    style: 'currency',
                                    currency: 'RUB',
                                    maximumFractionDigits: 0
                                  }).format(shift.earnings)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditShift(shift.id)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                                Нет смен на сегодня
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="date">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Смены на {formatDateDisplay(selectedDate)}
                    </h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Сотрудник</TableHead>
                            <TableHead>Время</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Заработок</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shifts && shifts.length > 0 ? (
                            shifts.map((shift: any) => (
                              <TableRow key={shift.id}>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                      {employees ? (
                                        <span className="font-heading text-xs">
                                          {getInitials(
                                            employees.find((e: any) => e.id === shift.userId)?.name || '',
                                            employees.find((e: any) => e.id === shift.userId)?.surname || ''
                                          )}
                                        </span>
                                      ) : (
                                        <span className="font-heading text-xs">...</span>
                                      )}
                                    </div>
                                    <span className="font-medium">{getEmployeeName(shift.userId)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                </TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    shift.status === 'scheduled' ? "bg-blue-100 text-blue-800" :
                                    shift.status === 'active' ? "bg-green-100 text-green-800" :
                                    "bg-gray-100 text-gray-800"
                                  )}>
                                    {shift.status === 'scheduled' ? 'Запланирована' :
                                     shift.status === 'active' ? 'Активна' : 'Завершена'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {new Intl.NumberFormat('ru-RU', {
                                    style: 'currency',
                                    currency: 'RUB',
                                    maximumFractionDigits: 0
                                  }).format(shift.earnings)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditShift(shift.id)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                                Нет смен на выбранную дату
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="week">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Смены на неделю: {formatDateDisplay(weekDates.start)} - {formatDateDisplay(weekDates.end)}
                    </h3>
                    
                    {Object.keys(shiftsByDate).length > 0 ? (
                      <div className="space-y-6">
                        {Object.entries(shiftsByDate)
                          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                          .map(([date, dayShifts]) => (
                            <div key={date} className="border rounded-md overflow-hidden">
                              <div className="bg-gray-50 px-4 py-2 border-b">
                                <h4 className="font-medium">{getDayOfWeek(date)}, {formatDateDisplay(date)}</h4>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Сотрудник</TableHead>
                                    <TableHead>Время</TableHead>
                                    <TableHead>Статус</TableHead>
                                    <TableHead>Заработок</TableHead>
                                    <TableHead className="text-right">Действия</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {dayShifts.map((shift: any) => (
                                    <TableRow key={shift.id}>
                                      <TableCell>
                                        <div className="flex items-center">
                                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                            {employees ? (
                                              <span className="font-heading text-xs">
                                                {getInitials(
                                                  employees.find((e: any) => e.id === shift.userId)?.name || '',
                                                  employees.find((e: any) => e.id === shift.userId)?.surname || ''
                                                )}
                                              </span>
                                            ) : (
                                              <span className="font-heading text-xs">...</span>
                                            )}
                                          </div>
                                          <span className="font-medium">{getEmployeeName(shift.userId)}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                      </TableCell>
                                      <TableCell>
                                        <span className={cn(
                                          "px-2 py-1 rounded-full text-xs font-medium",
                                          shift.status === 'scheduled' ? "bg-blue-100 text-blue-800" :
                                          shift.status === 'active' ? "bg-green-100 text-green-800" :
                                          "bg-gray-100 text-gray-800"
                                        )}>
                                          {shift.status === 'scheduled' ? 'Запланирована' :
                                          shift.status === 'active' ? 'Активна' : 'Завершена'}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        {new Intl.NumberFormat('ru-RU', {
                                          style: 'currency',
                                          currency: 'RUB',
                                          maximumFractionDigits: 0
                                        }).format(shift.earnings)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleEditShift(shift.id)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-gray-500 border rounded-md">
                        Нет смен на выбранную неделю
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Shift Form Modal */}
      {isShiftFormOpen && (
        <ShiftForm 
          isOpen={isShiftFormOpen} 
          onClose={closeShiftForm} 
          shiftId={selectedShiftId || undefined}
          defaultDate={selectedTab === 'date' ? selectedDate : undefined}
        />
      )}
    </AppLayout>
  );
}
