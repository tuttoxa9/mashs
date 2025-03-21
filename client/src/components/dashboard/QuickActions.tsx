import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  path?: string;
  action?: () => void;
}

export default function QuickActions() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const navigateTo = (path: string) => {
    setLocation(path);
  };

  const generateDailyReport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await queryClient.fetchQuery({
        queryKey: ['/api/reports/daily', today],
        queryFn: async () => {
          const response = await fetch(`/api/reports/daily?date=${today}`);
          if (!response.ok) throw new Error('Не удалось сгенерировать отчёт');
          return response.json();
        }
      });
      
      toast({
        title: "Отчёт создан",
        description: "Ежедневный отчёт успешно сгенерирован",
      });
      
      setLocation('/reports');
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать отчёт",
        variant: "destructive",
      });
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: "newAppointment",
      icon: "add_circle",
      label: "Новая запись",
      path: "/appointments?action=new"
    },
    {
      id: "newClient",
      icon: "person_add",
      label: "Новый клиент",
      path: "/clients?action=new"
    },
    {
      id: "newCar",
      icon: "directions_car",
      label: "Новый автомобиль",
      path: "/vehicles?action=new"
    },
    {
      id: "manageShifts",
      icon: "schedule",
      label: "Управление сменами",
      path: "/shifts"
    },
    {
      id: "dailyReport",
      icon: "summarize",
      label: "Отчёт за день",
      action: generateDailyReport
    },
    {
      id: "employeeStats",
      icon: "people",
      label: "Статистика сотрудников",
      path: "/reports?type=employees"
    }
  ];

  const handleClick = (action: QuickAction) => {
    if (action.action) {
      action.action();
    } else if (action.path) {
      navigateTo(action.path);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 p-4">
        <CardTitle className="font-heading font-semibold text-lg">Быстрые действия</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition-colors"
              onClick={() => handleClick(action)}
            >
              <span className="material-icons text-primary mb-2">{action.icon}</span>
              <span className="text-sm text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
