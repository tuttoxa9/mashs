import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import EmployeesList from "@/components/employees/EmployeesList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShiftForm from "@/components/employees/ShiftForm";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function Employees() {
  const [selectedTab, setSelectedTab] = useState("employees");
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [isShiftFormOpen, setIsShiftFormOpen] = useState(false);
  
  // Fetch employee stats
  const { data: employeeStats } = useQuery({
    queryKey: ['/api/reports/employees/stats'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/reports/monthly?month=5&year=2023'); // Example of using the monthly report
        if (!res.ok) throw new Error('Не удалось загрузить статистику по сотрудникам');
        return res.json();
      } catch (error) {
        console.error('Error fetching employee stats:', error);
        return { employees: [] };
      }
    },
    enabled: selectedTab === "stats"
  });
  
  const handleEmployeeSelect = (employee: User) => {
    setSelectedEmployee(employee);
    setSelectedTab("stats");
  };
  
  const handleAddShift = () => {
    setIsShiftFormOpen(true);
  };
  
  const closeShiftForm = () => {
    setIsShiftFormOpen(false);
  };
  
  // Prepare data for the pie chart
  const pieChartData = employeeStats?.employees 
    ? employeeStats.employees.map((employee: any) => ({
        name: employee.name,
        value: employee.earnings
      }))
    : [];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2'];

  return (
    <AppLayout title="Сотрудники">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees">Список сотрудников</TabsTrigger>
          <TabsTrigger value="stats">Статистика</TabsTrigger>
        </TabsList>
        
        <TabsContent value="employees">
          <EmployeesList onEmployeeSelect={handleEmployeeSelect} />
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Информация о сотруднике</CardTitle>
                <CardDescription>
                  {selectedEmployee 
                    ? `${selectedEmployee.name} ${selectedEmployee.surname}` 
                    : "Выберите сотрудника из списка"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedEmployee ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-primary-light text-white flex items-center justify-center text-xl">
                        {selectedEmployee.name.charAt(0)}{selectedEmployee.surname.charAt(0)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Должность:</span>
                        <span>{selectedEmployee.role === 'admin' ? 'Администратор' : 'Сотрудник'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span>{selectedEmployee.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Телефон:</span>
                        <span>{selectedEmployee.phone || "-"}</span>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={handleAddShift}
                        className="w-full"
                      >
                        Назначить смену
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    Для просмотра статистики выберите сотрудника из списка
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Сравнение сотрудников</CardTitle>
                <CardDescription>
                  Заработок сотрудников за текущий месяц
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(value)}
                        labelFormatter={() => "Заработок"}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Employee's recent activity would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Недавняя активность</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEmployee ? (
                <div className="text-gray-500">
                  Здесь будет отображаться недавняя активность сотрудника
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  Выберите сотрудника для просмотра его активности
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Shift Form Modal */}
      {isShiftFormOpen && (
        <ShiftForm 
          isOpen={isShiftFormOpen} 
          onClose={closeShiftForm} 
          employeeId={selectedEmployee?.id}
        />
      )}
    </AppLayout>
  );
}
