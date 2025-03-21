import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

type ChartRange = "thisWeek" | "lastWeek" | "thisMonth";

export default function PerformanceChart() {
  const [range, setRange] = useState<ChartRange>("thisWeek");
  
  // Get the start date based on selected range
  const getStartDate = () => {
    const now = new Date();
    if (range === "thisWeek") {
      const firstDay = new Date(now);
      // Set to Monday of this week
      const day = now.getDay() || 7;
      firstDay.setHours(0, 0, 0, 0);
      firstDay.setDate(now.getDate() - day + 1);
      return firstDay.toISOString().split('T')[0];
    } else if (range === "lastWeek") {
      const firstDay = new Date(now);
      // Set to Monday of last week
      const day = now.getDay() || 7;
      firstDay.setHours(0, 0, 0, 0);
      firstDay.setDate(now.getDate() - day - 6);
      return firstDay.toISOString().split('T')[0];
    } else {
      // This month
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return firstDay.toISOString().split('T')[0];
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/reports/weekly', getStartDate()],
    queryFn: async () => {
      const res = await fetch(`/api/reports/weekly?startDate=${getStartDate()}`);
      if (!res.ok) throw new Error('Не удалось загрузить данные');
      return res.json();
    }
  });

  // Format data for chart
  const formatChartData = () => {
    if (!data || !data.dailyReports) return [];
    
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    return data.dailyReports.map((report: any, index: number) => {
      const date = new Date(report.date);
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert to 0 = Monday
      
      return {
        name: dayNames[dayIndex],
        Записи: report.totalAppointments,
        Выручка: report.totalRevenue / 1000, // Convert to thousands
      };
    });
  };

  const handleRangeChange = (value: string) => {
    setRange(value as ChartRange);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b border-gray-200 p-4 flex justify-between items-center">
          <CardTitle className="font-heading font-semibold text-lg">Статистика по дням недели</CardTitle>
          <Skeleton className="h-9 w-36" />
        </CardHeader>
        <CardContent className="p-4 h-64 flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="border-b border-gray-200 p-4">
          <CardTitle className="font-heading font-semibold text-lg">Статистика по дням недели</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Не удалось загрузить данные</h3>
          <p className="text-gray-500 mt-2">Пожалуйста, попробуйте позже</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = formatChartData();

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 p-4 flex justify-between items-center">
        <CardTitle className="font-heading font-semibold text-lg">Статистика по дням недели</CardTitle>
        <Select defaultValue={range} onValueChange={handleRangeChange}>
          <SelectTrigger className="w-[180px] h-9 text-sm border border-gray-300 rounded">
            <SelectValue placeholder="Выберите период" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisWeek">Эта неделя</SelectItem>
            <SelectItem value="lastWeek">Прошлая неделя</SelectItem>
            <SelectItem value="thisMonth">Этот месяц</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-4 h-64">
        {chartData.length > 0 ? (
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
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <span className="material-icons text-6xl">bar_chart</span>
              <p className="mt-2">Нет данных для отображения</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
