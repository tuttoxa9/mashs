import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import StatCard from "@/components/dashboard/StatCard";
import AppointmentsList from "@/components/dashboard/AppointmentsList";
import ShiftsList from "@/components/dashboard/ShiftsList";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import QuickActions from "@/components/dashboard/QuickActions";
import NotificationsList from "@/components/dashboard/NotificationsList";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch dashboard stats
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['/api/reports/daily', today],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/reports/daily?date=${today}`);
        if (!res.ok) throw new Error('Не удалось загрузить статистику');
        return res.json();
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return null;
      }
    }
  });
  
  // Fetch active shifts
  const { data: shifts } = useQuery({
    queryKey: ['/api/shifts', today],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/shifts?date=${today}&status=active`);
        if (!res.ok) throw new Error('Не удалось загрузить смены');
        return res.json();
      } catch (error) {
        console.error('Error fetching shifts:', error);
        return [];
      }
    }
  });
  
  // Welcome toast on first load
  useEffect(() => {
    toast({
      title: "Добро пожаловать",
      description: "Вы вошли в систему управления автомойкой",
    });
  }, []);
  
  const totalAppointments = dashboardStats?.totalAppointments || 0;
  const totalRevenue = dashboardStats?.totalRevenue || 0;
  const totalEmployees = shifts?.length || 0;
  const totalServiced = dashboardStats?.totalCompletedAppointments || 0;

  return (
    <AppLayout title="Панель управления">
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="event"
            iconBgColor="bg-blue-100"
            iconColor="text-primary"
            title="Записей сегодня"
            value={totalAppointments}
          />
          
          <StatCard
            icon="people"
            iconBgColor="bg-green-100"
            iconColor="text-success"
            title="Сотрудников в смене"
            value={totalEmployees}
          />
          
          <StatCard
            icon="payments"
            iconBgColor="bg-amber-100"
            iconColor="text-warning"
            title="Выручка за день"
            value={formatCurrency(totalRevenue)}
          />
          
          <StatCard
            icon="directions_car"
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            title="Автомобилей обслужено"
            value={totalServiced}
          />
        </div>
        
        {/* Upcoming Appointments */}
        <AppointmentsList limit={5} date={today} />
        
        {/* Employee Shifts and Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ShiftsList date={today} />
          <PerformanceChart />
        </div>
        
        {/* Quick Actions and Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <QuickActions />
          <NotificationsList />
        </div>
      </div>
    </AppLayout>
  );
}
