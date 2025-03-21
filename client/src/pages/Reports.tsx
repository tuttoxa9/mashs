import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyReport from "@/components/reports/DailyReport";
import WeeklyReport from "@/components/reports/WeeklyReport";
import MonthlyReport from "@/components/reports/MonthlyReport";
import EmployeeReport from "@/components/reports/EmployeeReport";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Reports() {
  const [selectedTab, setSelectedTab] = useState("daily");
  const [location, setLocation] = useLocation();
  
  // Parse URL query parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    if (params.get('type') === 'employees') {
      setSelectedTab('employee');
      // Clear the URL parameter after setting the tab
      setLocation('/reports', { replace: true });
    }
  }, [location, setLocation]);

  return (
    <AppLayout title="Отчеты">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Ежедневный</TabsTrigger>
          <TabsTrigger value="weekly">Недельный</TabsTrigger>
          <TabsTrigger value="monthly">Месячный</TabsTrigger>
          <TabsTrigger value="employee">По сотруднику</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <DailyReport />
        </TabsContent>
        
        <TabsContent value="weekly">
          <WeeklyReport />
        </TabsContent>
        
        <TabsContent value="monthly">
          <MonthlyReport />
        </TabsContent>
        
        <TabsContent value="employee">
          <EmployeeReport />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
