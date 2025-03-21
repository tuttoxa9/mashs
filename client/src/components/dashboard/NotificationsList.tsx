import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Notification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface NotificationsListProps {
  limit?: number;
}

export default function NotificationsList({ limit = 4 }: NotificationsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const userId = user?.uid || "1"; // Fallback to admin ID if user is not available
  
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['/api/notifications', userId],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      if (!response.ok) throw new Error('Не удалось загрузить уведомления');
      return response.json();
    }
  });
  
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('PUT', `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отметить уведомление как прочитанное",
        variant: "destructive",
      });
    }
  });
  
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PUT', `/api/notifications/read-all`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Готово",
        description: "Все уведомления отмечены как прочитанные",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отметить уведомления как прочитанные",
        variant: "destructive",
      });
    }
  });
  
  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };
  
  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true,
        locale: ru
      });
    } catch (error) {
      return "недавно";
    }
  };
  
  // Filter and limit notifications
  const displayNotifications = notifications 
    ? notifications.slice(0, limit) 
    : [];
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b border-gray-200 p-4 flex justify-between items-center">
          <CardTitle className="font-heading font-semibold text-lg">Уведомления</CardTitle>
          <Skeleton className="h-8 w-[220px]" />
        </CardHeader>
        <CardContent className="p-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-3 border-b border-gray-100">
              <div className="flex">
                <Skeleton className="h-2 w-2 rounded-full mt-2 mr-3" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg text-center">
          <Skeleton className="h-4 w-28 mx-auto" />
        </CardFooter>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader className="border-b border-gray-200 p-4">
          <CardTitle className="font-heading font-semibold text-lg">Уведомления</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Не удалось загрузить уведомления</h3>
          <p className="text-gray-500 mt-2">Пожалуйста, попробуйте позже</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-gray-200 p-4 flex justify-between items-center">
        <CardTitle className="font-heading font-semibold text-lg">Уведомления</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-sm text-primary h-auto py-1"
          onClick={handleMarkAllRead}
          disabled={markAllReadMutation.isPending}
        >
          Отметить все как прочитанные
        </Button>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto max-h-64">
        {displayNotifications.length > 0 ? (
          displayNotifications.map((notification: Notification) => (
            <div 
              key={notification.id} 
              className="p-3 border-b border-gray-100 hover:bg-gray-50"
              onClick={() => !notification.read && markAsReadMutation.mutate(notification.id)}
            >
              <div className="flex">
                <div 
                  className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 mr-3 ${
                    notification.read ? 'bg-gray-300' : 'bg-primary'
                  }`}
                ></div>
                <div>
                  <p className={`text-sm ${notification.read ? 'text-gray-600' : ''}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            Нет уведомлений
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg text-center">
        <Link href="/notifications" className="text-primary text-sm font-medium">
          Все уведомления
        </Link>
      </CardFooter>
    </Card>
  );
}
