
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  User, Client, Vehicle, Service, 
  Shift, Appointment, AppointmentService, Notification 
} from '@shared/schema';

// Тип статуса синхронизации
export type SyncStatus = "syncing" | "synced" | "error" | "offline";

// Интерфейс для глобального контекста данных
interface GlobalDataContextType {
  // Статус синхронизации и сетевого подключения
  syncStatus: SyncStatus;
  isOnline: boolean;
  lastSyncedAt: Date | null;
  
  // Функции для синхронизации
  syncAll: () => Promise<void>;
  
  // Флаги для управления интерфейсом
  isLoading: boolean;
  isError: boolean;
  
  // Ручная установка статуса синхронизации
  setSyncStatus: (status: SyncStatus) => void;
}

// Создание контекста
const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

// Свойства для провайдера глобальных данных
interface GlobalDataProviderProps {
  children: ReactNode;
  autoSyncInterval?: number; // Интервал автоматической синхронизации в мс
}

/**
 * Провайдер для управления глобальным состоянием данных в приложении
 */
export function GlobalDataProvider({
  children,
  autoSyncInterval = 5 * 60 * 1000 // По умолчанию 5 минут
}: GlobalDataProviderProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Инициализация данных при запуске
  useEffect(() => {
    const initialize = async () => {
      try {
        setSyncStatus("syncing");
        await syncAll();
        setIsInitialized(true);
      } catch (error) {
        console.error("Ошибка инициализации данных:", error);
        setSyncStatus("error");
        setIsInitialized(true);
      }
    };
    
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized]);
  
  // Отслеживание онлайн/офлайн статуса
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncAll();
      toast({
        title: "Подключение восстановлено",
        description: "Соединение с сервером восстановлено. Данные синхронизированы."
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
      toast({
        title: "Нет подключения к сети",
        description: "Вы работаете в офлайн-режиме. Данные будут синхронизированы при восстановлении соединения."
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);
  
  // Автоматическая синхронизация по интервалу
  useEffect(() => {
    if (!isOnline || !isInitialized) return;
    
    const intervalId = setInterval(() => {
      syncAll();
    }, autoSyncInterval);
    
    return () => clearInterval(intervalId);
  }, [isOnline, isInitialized, autoSyncInterval]);
  
  // Функция для полной синхронизации всех данных
  const syncAll = async () => {
    if (!isOnline) return;
    
    try {
      setSyncStatus("syncing");
      
      // Обновляем все основные данные
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [queryKeys.users] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.clients] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.vehicles] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.services] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.shifts] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.appointments] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.notifications] })
      ]);
      
      setSyncStatus("synced");
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error("Ошибка синхронизации данных:", error);
      setSyncStatus("error");
    }
  };
  
  // Значение контекста для провайдера
  const contextValue: GlobalDataContextType = {
    syncStatus,
    isOnline,
    lastSyncedAt,
    syncAll,
    isLoading: !isInitialized,
    isError: syncStatus === "error",
    setSyncStatus
  };
  
  return (
    <GlobalDataContext.Provider value={contextValue}>
      {children}
    </GlobalDataContext.Provider>
  );
}

/**
 * Хук для использования глобального контекста данных
 */
export function useGlobalData() {
  const context = useContext(GlobalDataContext);
  
  if (context === undefined) {
    throw new Error('useGlobalData должен использоваться внутри GlobalDataProvider');
  }
  
  return context;
}

/**
 * Хук для получения данных пользователей
 */
export function useUsers() {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: [queryKeys.users],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Ошибка при получении пользователей');
      }
      return response.json();
    },
    enabled: isOnline // Запросы активны только в онлайн-режиме
  });
}

/**
 * Хук для получения данных клиентов
 */
export function useClients() {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: [queryKeys.clients],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Ошибка при получении клиентов');
      }
      return response.json();
    },
    enabled: isOnline // Запросы активны только в онлайн-режиме
  });
}

/**
 * Хук для получения данных автомобилей
 */
export function useVehicles(clientId?: number) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: clientId ? queryKeys.vehiclesByClient(clientId) : [queryKeys.vehicles],
    queryFn: async () => {
      const url = clientId ? `/api/clients/${clientId}/vehicles` : '/api/vehicles';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Ошибка при получении автомобилей');
      }
      return response.json();
    },
    enabled: isOnline
  });
}

/**
 * Хук для получения данных услуг
 */
export function useServices() {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: [queryKeys.services],
    queryFn: async () => {
      const response = await fetch('/api/services');
      if (!response.ok) {
        throw new Error('Ошибка при получении услуг');
      }
      return response.json();
    },
    enabled: isOnline
  });
}

/**
 * Хук для получения данных смен
 */
export function useShifts(date?: string, userId?: number) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: date ? queryKeys.shiftsByDate(date) : 
             userId ? queryKeys.shiftsByUser(userId) : 
             [queryKeys.shifts],
    queryFn: async () => {
      let url = '/api/shifts';
      if (date) {
        url += `?date=${date}`;
      } else if (userId) {
        url += `?userId=${userId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Ошибка при получении смен');
      }
      return response.json();
    },
    enabled: isOnline
  });
}

/**
 * Хук для получения данных записей
 */
export function useAppointments(date?: string, clientId?: number, userId?: number) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: date ? queryKeys.appointmentsByDate(date) :
              clientId ? queryKeys.appointmentsByClient(clientId) :
              userId ? queryKeys.appointmentsByUser(userId) :
              [queryKeys.appointments],
    queryFn: async () => {
      let url = '/api/appointments';
      if (date) {
        url += `?date=${date}`;
      } else if (clientId) {
        url += `?clientId=${clientId}`;
      } else if (userId) {
        url += `?userId=${userId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Ошибка при получении записей');
      }
      return response.json();
    },
    enabled: isOnline
  });
}

/**
 * Хук для получения услуг для конкретной записи
 */
export function useAppointmentServices(appointmentId: number) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: queryKeys.appointmentServices(appointmentId),
    queryFn: async () => {
      const response = await fetch(`/api/appointments/${appointmentId}/services`);
      if (!response.ok) {
        throw new Error('Ошибка при получении услуг записи');
      }
      return response.json();
    },
    enabled: isOnline && !!appointmentId
  });
}

/**
 * Хук для получения уведомлений
 */
export function useNotifications(userId?: number) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: userId ? queryKeys.notificationsByUser(userId) : [queryKeys.notifications],
    queryFn: async () => {
      let url = '/api/notifications';
      if (userId) {
        url += `?userId=${userId}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Ошибка при получении уведомлений');
      }
      return response.json();
    },
    enabled: isOnline
  });
}

/**
 * Хук для получения ежедневного отчета
 */
export function useDailyReport(date: string) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: queryKeys.dailyReport(date),
    queryFn: async () => {
      const response = await fetch(`/api/reports/daily?date=${date}`);
      if (!response.ok) {
        throw new Error('Ошибка при получении ежедневного отчета');
      }
      return response.json();
    },
    enabled: isOnline && !!date
  });
}

/**
 * Хук для получения еженедельного отчета
 */
export function useWeeklyReport(startDate: string) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: queryKeys.weeklyReport(startDate),
    queryFn: async () => {
      const response = await fetch(`/api/reports/weekly?startDate=${startDate}`);
      if (!response.ok) {
        throw new Error('Ошибка при получении еженедельного отчета');
      }
      return response.json();
    },
    enabled: isOnline && !!startDate
  });
}

/**
 * Хук для получения ежемесячного отчета
 */
export function useMonthlyReport(month: number, year: number) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: queryKeys.monthlyReport(month, year),
    queryFn: async () => {
      const response = await fetch(`/api/reports/monthly?month=${month}&year=${year}`);
      if (!response.ok) {
        throw new Error('Ошибка при получении ежемесячного отчета');
      }
      return response.json();
    },
    enabled: isOnline && !!month && !!year
  });
}

/**
 * Хук для получения отчета по сотруднику
 */
export function useEmployeeReport(userId: number, startDate: string, endDate: string) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: queryKeys.employeeReport(userId, startDate, endDate),
    queryFn: async () => {
      const response = await fetch(`/api/reports/employee/${userId}?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error('Ошибка при получении отчета по сотруднику');
      }
      return response.json();
    },
    enabled: isOnline && !!userId && !!startDate && !!endDate
  });
}
