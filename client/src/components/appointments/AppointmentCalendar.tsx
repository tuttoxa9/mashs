import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDaysOfWeek, getMonthName, generateMonthDays, formatTime, getStatusColorClass } from "@/lib/utils";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Appointment } from "@shared/schema";

interface AppointmentCalendarProps {
  onDateSelect?: (date: string) => void;
  onAppointmentClick?: (appointmentId: number) => void;
  onAddClick?: (date: string) => void;
}

export default function AppointmentCalendar({ 
  onDateSelect, 
  onAppointmentClick,
  onAddClick
}: AppointmentCalendarProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  
  // Update year and month when currentDate changes
  useEffect(() => {
    setYear(currentDate.getFullYear());
    setMonth(currentDate.getMonth());
  }, [currentDate]);
  
  // Generate calendar days
  const calendarDays = generateMonthDays(year, month);
  
  // Fetch appointments for current month
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
  
  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['/api/appointments/month', startDate, endDate],
    queryFn: async () => {
      // In a real implementation, you would have an API endpoint that returns appointments for a date range
      // For now, we'll simulate by fetching all appointments and filtering client-side
      const res = await fetch('/api/appointments');
      if (!res.ok) throw new Error('Не удалось загрузить записи');
      const data = await res.json();
      
      // Filter appointments for current month
      return data.filter((appointment: Appointment) => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= new Date(startDate) && appointmentDate <= new Date(endDate);
      });
    }
  });
  
  // Group appointments by date
  const appointmentsByDate: Record<string, Appointment[]> = {};
  
  if (appointments) {
    appointments.forEach((appointment: Appointment) => {
      if (!appointmentsByDate[appointment.date]) {
        appointmentsByDate[appointment.date] = [];
      }
      appointmentsByDate[appointment.date].push(appointment);
    });
  }
  
  // Navigation functions
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(today);
  };
  
  // Get day's appointments
  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointmentsByDate[dateStr] || [];
  };
  
  // Handle day click
  const handleDayClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (onDateSelect) {
      onDateSelect(dateStr);
    }
  };
  
  // Handle "+" button click
  const handleAddClick = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    const dateStr = date.toISOString().split('T')[0];
    if (onAddClick) {
      onAddClick(dateStr);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-4">
          <div className="flex flex-wrap justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-64" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {getDaysOfWeek().map((day, index) => (
              <div key={index} className="p-2 text-center text-gray-600 font-medium text-sm">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr">
            {Array.from({ length: 42 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="p-4">
          <CardTitle>Календарь записей</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Не удалось загрузить данные календаря</h3>
          <p className="text-gray-500 mt-2">Пожалуйста, попробуйте позже</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center mb-2 sm:mb-0">
            <CardTitle className="text-xl font-heading font-semibold">Календарь записей</CardTitle>
            <div className="ml-4">
              <Button 
                onClick={() => onAddClick && onAddClick(new Date().toISOString().split('T')[0])}
                className="px-3 py-1 bg-primary text-white rounded-md text-sm shadow-sm hover:bg-primary-dark transition-colors"
              >
                <span className="flex items-center">
                  <span className="material-icons text-sm mr-1">add</span>
                  Новая запись
                </span>
              </Button>
            </div>
          </div>
          
          <div className="flex space-x-2 items-center mt-2 sm:mt-0">
            <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-lg font-medium mx-2">
              {getMonthName(month)} {year}
            </h3>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToToday}
              className="ml-4"
            >
              Сегодня
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Days of week */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {getDaysOfWeek().map((day, index) => (
            <div key={index} className="p-2 text-center text-gray-600 font-medium text-sm">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDay(day.date);
            const isToday = day.isToday;
            
            return (
              <div 
                key={index} 
                className={cn(
                  "border p-1 calendar-day relative min-h-[6rem]",
                  !day.isCurrentMonth && "bg-gray-50",
                  isToday && "bg-blue-50"
                )}
                onClick={() => handleDayClick(day.date)}
              >
                <div className={cn(
                  "text-sm p-1 flex justify-between",
                  !day.isCurrentMonth ? "text-gray-400" : "text-gray-700",
                  isToday && "text-primary font-medium"
                )}>
                  <span>{day.date.getDate()}</span>
                  {day.isCurrentMonth && (
                    <button
                      className="text-xs bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-primary-dark"
                      onClick={(e) => handleAddClick(day.date, e)}
                    >
                      +
                    </button>
                  )}
                </div>
                
                {/* Appointments */}
                <div className="overflow-y-auto max-h-20">
                  {dayAppointments.slice(0, 3).map((appointment) => {
                    const statusClasses = getStatusColorClass(appointment.status);
                    
                    return (
                      <div 
                        key={appointment.id} 
                        className={cn(
                          "rounded p-1 mb-1 text-xs border-l-2 text-gray-700 cursor-pointer",
                          statusClasses.bg,
                          `border-l-${statusClasses.text.replace('text-', '')}`
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick && onAppointmentClick(appointment.id);
                        }}
                      >
                        {formatTime(appointment.startTime)} - {appointment.vehicleId}
                      </div>
                    );
                  })}
                  
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 p-1">
                      + ещё {dayAppointments.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
