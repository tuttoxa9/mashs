import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertCircle, FileDown, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { User } from "@shared/schema";

export default function EmployeeReport() {
  const today = new Date().toISOString().split('T')[0];
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  // Fetch employees
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Не удалось загрузить список сотрудников');
        return res.json();
      } catch (error) {
        console.error('Error fetching employees:', error);
        return [];
      }
    }
  });
  
  // Fetch employee report data
  const { data: reportData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/reports/employee', employeeId, startDate, endDate],
    queryFn: async () => {
      if (!employeeId) return null;
      try {
        const res = await fetch(`/api/reports/employee/${employeeId}?startDate=${startDate}&endDate=${endDate}`);
        if (!res.ok) throw new Error('Не удалось загрузить данные отчета');
        return res.json();
      } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
      }
    },
    enabled: !!employeeId && !!startDate && !!endDate
  });
  
  const handleEmployeeChange = (value: string) => {
    setEmployeeId(value);
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };
  
  const handleGenerateReport = () => {
    refetch();
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleExport = () => {
    // Generate CSV
    if (!reportData) return;
    
    const headers = "ID сотрудника,Имя,Email,Роль,Период,Всего записей,Завершенных записей,Выручка,Заработок\n";
    const row = `${reportData.employee.id},${reportData.employee.name},${reportData.employee.email},${reportData.employee.role},${reportData.startDate}-${reportData.endDate},${reportData.totalAppointments},${reportData.totalCompletedAppointments},${reportData.totalRevenue},${reportData.totalEarnings}\n`;
    
    const dailyHeaders = "Дата,Записи,Завершенные,Выручка,Заработок\n";
    const dailyRows = reportData.dailyData.map((day: any) => 
      `${day.date},${day.appointments},${day.completedAppointments},${day.revenue},${day.earnings}`
    ).join("\n");
    
    const csvContent = headers + row + "\n" + dailyHeaders + dailyRows;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `employee-report-${reportData.employee.id}-${startDate}-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Prepare data for chart
  const chartData = reportData?.dailyData 
    ? reportData.dailyData.map((day: any) => {
        return {
          name: formatDate(day.date),
          Заработок: day.earnings / 1000, // Convert to thousands
          Выручка: day.revenue / 1000,
        };
      })
    : [];
  
  if (employeesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Отчет по сотруднику</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading && employeeId) {
    return (
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">Отчет по сотруднику</CardTitle>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
          
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error && employeeId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Отчет по сотруднику</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Не удалось загрузить данные отчета</h3>
          <p className="text-gray-500 mt-2">Пожалуйста, проверьте выбранного сотрудника и даты и попробуйте снова</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-heading">Отчет по сотруднику</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={employeeId || undefined} onValueChange={handleEmployeeChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Выберите сотрудника" />
            </SelectTrigger>
            <SelectContent>
              {employees?.filter((e: User) => e.role === 'employee').map((employee: User) => (
                <SelectItem key={employee.id} value={employee.id.toString()}>
                  {employee.name} {employee.surname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap">Период:</span>
            <Input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="w-40"
            />
            <span>—</span>
            <Input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="w-40"
            />
          </div>
          
          <Button onClick={handleGenerateReport} disabled={!employeeId}>Сформировать</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reportData ? (
          <>
            <div className="bg-white rounded-lg border p-4 mb-4">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-primary-light text-white flex items-center justify-center text-xl mr-4">
                  {reportData.employee.name.charAt(0)}{reportData.employee.name.split(' ')[1]?.charAt(0) || ''}
                </div>
                <div>
                  <h3 className="text-xl font-heading font-semibold">{reportData.employee.name}</h3>
                  <p className="text-gray-500">{reportData.employee.role === 'admin' ? 'Администратор' : 'Сотрудник'}</p>
                  <p className="text-sm text-gray-600">{reportData.employee.email}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border p-4">
                <div className="text-sm text-gray-500">Период</div>
                <div className="text-lg font-heading font-semibold">
                  {formatDate(reportData.startDate)} - {formatDate(reportData.endDate)}
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-4">
                <div className="text-sm text-gray-500">Всего записей</div>
                <div className="text-lg font-heading font-semibold">
                  {reportData.totalAppointments}
                  <span className="text-sm text-gray-500 ml-2">
                    (завершено: {reportData.totalCompletedAppointments})
                  </span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-4">
                <div className="text-sm text-gray-500">Общая выручка</div>
                <div className="text-lg font-heading font-semibold">
                  {formatCurrency(reportData.totalRevenue)}
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-4">
                <div className="text-sm text-gray-500">Общий заработок</div>
                <div className="text-lg font-heading font-semibold text-success">
                  {formatCurrency(reportData.totalEarnings)}
                </div>
              </div>
            </div>
            
            {/* Employee Performance Chart */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-4">Динамика заработка и выручки</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name"
                      label={{ value: 'Дата', position: 'insideBottomRight', offset: 0 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${value}K`}
                      label={{ value: 'Тыс. ₽', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}K ₽`]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Выручка" 
                      stroke="hsl(var(--chart-1))" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Заработок" 
                      stroke="hsl(var(--chart-2))" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Daily Data */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-4">Детализация по дням</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Записи</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Завершено</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Выручка</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Заработок</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.dailyData.map((day: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{formatDate(day.date)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">{day.appointments}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">{day.completedAppointments}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">{formatCurrency(day.revenue)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">{formatCurrency(day.earnings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Печать
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <FileDown className="h-4 w-4 mr-2" />
                Экспорт CSV
              </Button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-gray-500">
            {employeeId 
              ? "Выберите период и нажмите 'Сформировать' для просмотра отчета" 
              : "Выберите сотрудника для формирования отчета"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
