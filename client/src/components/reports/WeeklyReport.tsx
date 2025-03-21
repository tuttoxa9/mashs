import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, FileDown, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

export default function WeeklyReport() {
  // Get the current week's Monday
  const getMonday = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(date.setDate(diff)).toISOString().split('T')[0];
  };
  
  const today = new Date();
  const [startDate, setStartDate] = useState(getMonday(today));
  
  // Calculate end date (Sunday of the selected week)
  const getEndDate = (start: string) => {
    const date = new Date(start);
    date.setDate(date.getDate() + 6);
    return date.toISOString().split('T')[0];
  };
  
  // Fetch weekly report data
  const { data: reportData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/reports/weekly', startDate],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/reports/weekly?startDate=${startDate}`);
        if (!res.ok) throw new Error('Не удалось загрузить данные отчета');
        return res.json();
      } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
      }
    }
  });
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
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
    
    const headers = "Начальная дата,Конечная дата,Общее количество записей,Общая выручка\n";
    const row = `${reportData.startDate},${reportData.endDate},${reportData.totalAppointments},${reportData.totalRevenue}\n`;
    
    const employeeHeaders = "ID сотрудника,Имя,Всего записей,Завершенных записей,Заработок\n";
    const employeeRows = reportData.employees.map((employee: any) => 
      `${employee.userId},${employee.name},${employee.totalAppointments},${employee.completedAppointments},${employee.earnings}`
    ).join("\n");
    
    const csvContent = headers + row + "\n" + employeeHeaders + employeeRows;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `weekly-report-${startDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Prepare data for chart
  const chartData = reportData?.dailyReports 
    ? reportData.dailyReports.map((day: any) => {
        const date = new Date(day.date);
        const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        
        return {
          name: dayNames[date.getDay()],
          Записи: day.totalAppointments,
          Выручка: day.totalRevenue / 1000, // Convert to thousands
        };
      })
    : [];
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">Недельный отчет</CardTitle>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
          
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Недельный отчет</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Не удалось загрузить данные отчета</h3>
          <p className="text-gray-500 mt-2">Пожалуйста, проверьте выбранную дату и попробуйте снова</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-heading">Недельный отчет</CardTitle>
        <div className="flex items-center space-x-2">
          <Input
            type="date"
            value={startDate}
            onChange={handleDateChange}
            className="w-40"
          />
          <Button onClick={handleGenerateReport}>Сформировать</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reportData ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border p-4">
                <div className="text-sm text-gray-500">Период</div>
                <div className="text-xl font-heading font-semibold">
                  {reportData.startDate} - {reportData.endDate}
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-4">
                <div className="text-sm text-gray-500">Всего записей</div>
                <div className="text-xl font-heading font-semibold">{reportData.totalAppointments}</div>
              </div>
              
              <div className="bg-white rounded-lg border p-4">
                <div className="text-sm text-gray-500">Общая выручка</div>
                <div className="text-xl font-heading font-semibold text-success">
                  {formatCurrency(reportData.totalRevenue)}
                </div>
              </div>
            </div>
            
            {/* Weekly Chart */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-4">Статистика по дням недели</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      stroke="#F59E0B"
                      tickFormatter={(value) => `${value}K`}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Выручка') return [`${value}K ₽`, name];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left" 
                      dataKey="Записи" 
                      fill="hsl(var(--chart-1))" 
                      radius={[4, 4, 0, 0]} 
                      barSize={30}
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="Выручка" 
                      fill="hsl(var(--chart-2))" 
                      radius={[4, 4, 0, 0]} 
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Employee Performance */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-4">Статистика по сотрудникам</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Всего записей</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Завершенных</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Заработок</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.employees && reportData.employees.length > 0 ? (
                      reportData.employees.map((employee: any) => (
                        <tr key={employee.userId}>
                          <td className="px-4 py-3 whitespace-nowrap font-medium">{employee.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">{employee.totalAppointments}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">{employee.completedAppointments}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">{formatCurrency(employee.earnings)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          Нет данных о сотрудниках за выбранный период
                        </td>
                      </tr>
                    )}
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
            Выберите начальную дату недели и нажмите "Сформировать" для просмотра отчета
          </div>
        )}
      </CardContent>
    </Card>
  );
}
