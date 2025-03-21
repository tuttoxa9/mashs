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
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
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

export default function MonthlyReport() {
  const currentDate = new Date();
  const [month, setMonth] = useState(String(currentDate.getMonth() + 1)); // 1-12
  const [year, setYear] = useState(String(currentDate.getFullYear()));
  
  // Fetch monthly report data
  const { data: reportData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/reports/monthly', month, year],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/reports/monthly?month=${month}&year=${year}`);
        if (!res.ok) throw new Error('Не удалось загрузить данные отчета');
        return res.json();
      } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
      }
    }
  });
  
  const handleMonthChange = (value: string) => {
    setMonth(value);
  };
  
  const handleYearChange = (value: string) => {
    setYear(value);
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
    
    const headers = "Месяц,Год,Общее количество записей,Общая выручка\n";
    const row = `${reportData.month},${reportData.year},${reportData.totalAppointments},${reportData.totalRevenue}\n`;
    
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
    link.setAttribute('download', `monthly-report-${month}-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Prepare data for chart
  const chartData = reportData?.dailyReports 
    ? reportData.dailyReports.map((day: any) => {
        return {
          name: new Date(day.date).getDate(),
          Выручка: day.totalRevenue / 1000, // Convert to thousands
          Записи: day.totalAppointments,
        };
      })
    : [];
  
  // Range of months
  const months = [
    { value: "1", label: "Январь" },
    { value: "2", label: "Февраль" },
    { value: "3", label: "Март" },
    { value: "4", label: "Апрель" },
    { value: "5", label: "Май" },
    { value: "6", label: "Июнь" },
    { value: "7", label: "Июль" },
    { value: "8", label: "Август" },
    { value: "9", label: "Сентябрь" },
    { value: "10", label: "Октябрь" },
    { value: "11", label: "Ноябрь" },
    { value: "12", label: "Декабрь" },
  ];
  
  // Range of years (last 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">Месячный отчет</CardTitle>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
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
          <CardTitle>Месячный отчет</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Не удалось загрузить данные отчета</h3>
          <p className="text-gray-500 mt-2">Пожалуйста, проверьте выбранный месяц и год и попробуйте снова</p>
        </CardContent>
      </Card>
    );
  }
  
  const getMonthName = (monthNum: number) => {
    return months.find(m => m.value === String(monthNum))?.label || '';
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-heading">Месячный отчет</CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={month} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Месяц" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Год" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
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
                  {getMonthName(reportData.month)} {reportData.year}
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
            
            {/* Monthly Chart */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-medium mb-4">Динамика по дням месяца</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name"
                      label={{ value: 'День месяца', position: 'insideBottomRight', offset: 0 }}
                    />
                    <YAxis 
                      yAxisId="left" 
                      orientation="left"
                      label={{ value: 'Количество записей', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tickFormatter={(value) => `${value}K`}
                      label={{ value: 'Выручка (тыс. ₽)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Выручка') return [`${value}K ₽`, name];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="Записи" 
                      stroke="hsl(var(--chart-1))" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="Выручка" 
                      stroke="hsl(var(--chart-2))" 
                    />
                  </LineChart>
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
            Выберите месяц и год и нажмите "Сформировать" для просмотра отчета
          </div>
        )}
      </CardContent>
    </Card>
  );
}
