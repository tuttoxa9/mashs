import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentDate } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";

interface TopNavBarProps {
  title: string;
  toggleSidebar: () => void;
}

export default function TopNavBar({ title, toggleSidebar }: TopNavBarProps) {
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  
  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/notifications?userId=${user.uid}`);
      if (!response.ok) {
        throw new Error('Ошибка при загрузке уведомлений');
      }
      return await response.json();
    },
    enabled: !!user,
  });
  
  const unreadNotifications = notifications.filter((notification: any) => !notification.read);
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <button 
            className="lg:hidden mr-2 text-gray-600"
            id="toggleSidebar"
            onClick={toggleSidebar}
          >
            <span className="material-icons">menu</span>
          </button>
          <h2 className="text-lg font-heading font-semibold">{title}</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative p-2 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100">
                  <Bell size={20} />
                  {unreadNotifications.length > 0 && (
                    <Badge className="absolute top-1 right-1 w-2 h-2 p-0 bg-primary" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="border-b border-gray-200 p-3 flex justify-between items-center">
                  <h3 className="font-heading font-semibold">Уведомления</h3>
                  <Button variant="ghost" size="sm" className="text-sm text-primary h-auto py-1">
                    Отметить все как прочитанные
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification: any) => (
                      <div 
                        key={notification.id} 
                        className="p-3 border-b border-gray-100 hover:bg-gray-50"
                      >
                        <div className="flex">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 mr-3 ${!notification.read ? 'bg-primary' : 'bg-gray-300'}`}></div>
                          <div>
                            <p className={`text-sm ${!notification.read ? '' : 'text-gray-600'}`}>{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">15 минут назад</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Нет уведомлений
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                  <a href="#notifications" className="text-primary text-sm font-medium">
                    Все уведомления
                  </a>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="relative">
            <Popover open={helpOpen} onOpenChange={setHelpOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="p-2 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100">
                  <HelpCircle size={20} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium">Помощь</h4>
                  <p className="text-sm text-muted-foreground">
                    Для получения справки по использованию системы, обратитесь к администратору или позвоните по номеру технической поддержки.
                  </p>
                  <p className="text-sm font-medium">Тел: +7 (XXX) XXX-XX-XX</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="text-sm text-right ml-4">
            <div className="font-medium">Сегодня</div>
            <div className="text-gray-500">{getCurrentDate()}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
