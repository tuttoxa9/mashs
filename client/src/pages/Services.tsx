import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ServicesList from "@/components/services/ServicesList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function Services() {
  // Fetch services for statistics
  const { data: services } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/services');
        if (!res.ok) throw new Error('Не удалось загрузить услуги');
        return res.json();
      } catch (error) {
        console.error('Error fetching services:', error);
        return [];
      }
    }
  });
  
  // Fetch appointments to calculate service popularity
  const { data: appointments } = useQuery({
    queryKey: ['/api/appointments'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/appointments');
        if (!res.ok) throw new Error('Не удалось загрузить записи');
        return res.json();
      } catch (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }
    }
  });
  
  // Fetch appointment services to determine service usage
  const { data: appointmentServices } = useQuery({
    queryKey: ['/api/appointment-services'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/appointment-services');
        if (!res.ok) throw new Error('Не удалось загрузить услуги в записях');
        return res.json();
      } catch (error) {
        console.error('Error fetching appointment services:', error);
        return [];
      }
    },
    enabled: !!appointments && appointments.length > 0
  });
  
  // Prepare data for service popularity chart
  const getServiceUsageData = () => {
    if (!services || !appointmentServices) return [];
    
    // Count service usage
    const serviceCounts = new Map();
    appointmentServices.forEach((appService: any) => {
      const count = serviceCounts.get(appService.serviceId) || 0;
      serviceCounts.set(appService.serviceId, count + 1);
    });
    
    // Create chart data
    return services
      .filter((service: any) => serviceCounts.has(service.id))
      .map((service: any) => ({
        name: service.name,
        value: serviceCounts.get(service.id) || 0
      }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5); // Only top 5 services
  };
  
  const chartData = getServiceUsageData();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];

  return (
    <AppLayout title="Услуги">
      <div className="space-y-6">
        {/* Services Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Всего услуг</CardTitle>
              <CardDescription>Активных и неактивных</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services ? services.length : '—'}
              </div>
              <div className="text-xs text-muted-foreground">
                Активных: {services ? services.filter((s: any) => s.active).length : '—'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Средняя цена</CardTitle>
              <CardDescription>По всем услугам</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services ? formatCurrency(
                  services.reduce((sum: number, s: any) => sum + s.price, 0) / services.length
                ) : '—'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Популярность услуг</CardTitle>
              <CardDescription>Топ-5 используемых услуг</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData && chartData.length > 0 ? (
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} заказов`, 'Количество']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 p-4">
                  Нет данных о популярности услуг
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Services List */}
        <ServicesList />
      </div>
    </AppLayout>
  );
}
