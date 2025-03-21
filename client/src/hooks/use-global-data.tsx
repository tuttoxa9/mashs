import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { syncServices, queryKeys } from '@/lib/queryClient';
import { SyncStatus } from '@/components/ui/sync-indicator';
import { useToast } from '@/hooks/use-toast';
import { 
  User, Client, Vehicle, Service, 
  Shift, Appointment, AppointmentService, Notification 
} from '@shared/schema';

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
  
  // Инициализация кэша при запуске
  useEffect(() => {
    const initialize = async () => {
      try {
        setSyncStatus("syncing");
        const success = await syncServices.initializeCache();
        
        if (success) {
          setSyncStatus("synced");
          setLastSyncedAt(new Date());
        } else {
          setSyncStatus("error");
        }
      } catch (error) {
        console.error("Ошибка инициализации данных:", error);
        setSyncStatus("error");
      } finally {
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
      await syncServices.syncAll();
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
 * Хук для получения данных пользователей с синхронизацией
 */
export function useUsers() {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: [queryKeys.users],
    queryFn: async () => {
      if (!isOnline) {
        // Возвращаем данные из кэша, если нет подключения
        return JSON.parse(localStorage.getItem('cache_users') || '[]');
      }
      
      // Здесь получаем данные из Firebase или API
      const response = await fetch('/api/users');
      const data = await response.json();
      
      // Кэшируем данные для оффлайн-режима
      localStorage.setItem('cache_users', JSON.stringify(data));
      return data;
    },
    enabled: isOnline, // Запросы активны только в онлайн-режиме
    staleTime: 5 * 60 * 1000 // 5 минут до устаревания данных
  }) as any;
}

/**
 * Хук для получения данных клиентов с синхронизацией
 */
export function useClients() {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: [queryKeys.clients],
    queryFn: async () => {
      if (!isOnline) {
        // Возвращаем данные из кэша, если нет подключения
        return JSON.parse(localStorage.getItem('cache_clients') || '[]');
      }
      
      // Здесь получаем данные из Firebase или API
      const response = await fetch('/api/clients');
      const data = await response.json();
      
      // Кэшируем данные для оффлайн-режима
      localStorage.setItem('cache_clients', JSON.stringify(data));
      return data;
    },
    enabled: isOnline // Запросы активны только в онлайн-режиме
  }) as any;
}

/**
 * Хук для получения данных автомобилей с синхронизацией
 */
export function useVehicles(clientId?: number) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: clientId ? queryKeys.vehiclesByClient(clientId) : [queryKeys.vehicles],
    queryFn: async () => {
      const cacheKey = clientId ? `cache_vehicles_client_${clientId}` : 'cache_vehicles';
      
      if (!isOnline) {
        // Возвращаем данные из кэша, если нет подключения
        return JSON.parse(localStorage.getItem(cacheKey) || '[]');
      }
      
      // Здесь получаем данные из Firebase или API
      const url = clientId ? `/api/vehicles?clientId=${clientId}` : '/api/vehicles';
      const response = await fetch(url);
      const data = await response.json();
      
      // Кэшируем данные для оффлайн-режима
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    },
    enabled: isOnline // Запросы активны только в онлайн-режиме
  }) as any;
}

/**
 * Хук для получения данных услуг с синхронизацией
 */
export function useServices() {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: [queryKeys.services],
    queryFn: async () => {
      if (!isOnline) {
        // Возвращаем данные из кэша, если нет подключения
        return JSON.parse(localStorage.getItem('cache_services') || '[]');
      }
      
      // Здесь получаем данные из Firebase или API
      const response = await fetch('/api/services');
      const data = await response.json();
      
      // Кэшируем данные для оффлайн-режима
      localStorage.setItem('cache_services', JSON.stringify(data));
      return data;
    },
    enabled: isOnline // Запросы активны только в онлайн-режиме
  }) as any;
}

/**
 * Хук для получения данных смен с синхронизацией
 */
export function useShifts(date?: string, userId?: number) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: date 
      ? queryKeys.shiftsByDate(date) 
      : userId 
        ? queryKeys.shiftsByUser(userId) 
        : [queryKeys.shifts],
    queryFn: async () => {
      const cacheKey = date 
        ? `cache_shifts_date_${date}` 
        : userId 
          ? `cache_shifts_user_${userId}` 
          : 'cache_shifts';
          
      if (!isOnline) {
        // Возвращаем данные из кэша, если нет подключения
        return JSON.parse(localStorage.getItem(cacheKey) || '[]');
      }
      
      // Здесь получаем данные из Firebase или API
      let url = '/api/shifts';
      if (date) url += `?date=${date}`;
      else if (userId) url += `?userId=${userId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Кэшируем данные для оффлайн-режима
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    },
    enabled: isOnline // Запросы активны только в онлайн-режиме
  }) as any;
}

/**
 * Хук для получения данных записей с синхронизацией
 */
export function useAppointments(date?: string, clientId?: number) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: date 
      ? queryKeys.appointmentsByDate(date) 
      : clientId 
        ? queryKeys.appointmentsByClient(clientId) 
        : [queryKeys.appointments],
    queryFn: async () => {
      const cacheKey = date 
        ? `cache_appointments_date_${date}` 
        : clientId 
          ? `cache_appointments_client_${clientId}` 
          : 'cache_appointments';
          
      if (!isOnline) {
        // Возвращаем данные из кэша, если нет подключения
        return JSON.parse(localStorage.getItem(cacheKey) || '[]');
      }
      
      // Здесь получаем данные из Firebase или API
      let url = '/api/appointments';
      if (date) url += `?date=${date}`;
      else if (clientId) url += `?clientId=${clientId}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Кэшируем данные для оффлайн-режима
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    },
    enabled: isOnline // Запросы активны только в онлайн-режиме
  }) as any;
}

/**
 * Хук для получения данных уведомлений с синхронизацией
 */
export function useNotifications(userId?: number) {
  const { isOnline } = useGlobalData();
  
  return useQuery({
    queryKey: userId ? queryKeys.notificationsByUser(userId) : [queryKeys.notifications],
    queryFn: async () => {
      const cacheKey = userId ? `cache_notifications_user_${userId}` : 'cache_notifications';
      
      if (!isOnline) {
        // Возвращаем данные из кэша, если нет подключения
        return JSON.parse(localStorage.getItem(cacheKey) || '[]');
      }
      
      // Здесь получаем данные из Firebase или API
      const url = userId ? `/api/notifications?userId=${userId}` : '/api/notifications';
      const response = await fetch(url);
      const data = await response.json();
      
      // Кэшируем данные для оффлайн-режима
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    },
    enabled: isOnline // Запросы активны только в онлайн-режиме
  }) as any;
}