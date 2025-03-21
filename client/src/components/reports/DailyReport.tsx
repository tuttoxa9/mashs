import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, FileDown, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DailyReport() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  
  // Fetch daily report data
  const { data: reportData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/reports/daily', selectedDate],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/reports/daily?date=${selectedDate}`);
        if (!res.ok) throw new Error('Не удалось загрузить данные отчета');
        return res.json();
      } catch (error) {
        console.error('Error fetching report data:', error);
        throw error;
      }
    }
  });
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
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
    
    const headers = "Дата,Общее количество записей,Общая выручка\n";
    const row = `${reportData.date},${reportData.totalAppointments},${reportData.totalRevenue}\n`;
    
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
    link.setAttribute('download', `daily-report-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">Ежедневный отчет</CardTitle>
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
          
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ежедневный отчет</CardTitle>
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
        <CardTitle className="text-xl font-heading">Ежедневный отчет</CardTitle>
        <div className="flex items-center space-x-2">
          <Input
            type="date"
            value={selectedDate}
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
                <div className="text-sm text-gray-500">Дата</div>
                <div className="text-xl font-heading font-semibold">{reportData.date}</div>
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
            
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-medium">Статистика по сотрудникам</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Сотрудник</TableHead>
                      <TableHead className="text-center">Всего записей</TableHead>
                      <TableHead className="text-center">Завершенных</TableHead>
                      <TableHead className="text-right">Заработок</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.employees && reportData.employees.length > 0 ? (
                      reportData.employees.map((employee: any) => (
                        <TableRow key={employee.userId}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell className="text-center">{employee.totalAppointments}</TableCell>
                          <TableCell className="text-center">{employee.completedAppointments}</TableCell>
                          <TableCell className="text-right">{formatCurrency(employee.earnings)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                          Нет данных о сотрудниках за выбранную дату
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
            Выберите дату и нажмите "Сформировать" для просмотра отчета
          </div>
        )}
      </CardContent>
    </Card>
  );
}
