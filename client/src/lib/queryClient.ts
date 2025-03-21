import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { cacheService } from './cacheService';
import { 
  userService, clientService, vehicleService, 
  serviceService, shiftService, appointmentService,
  appointmentServiceService, notificationService
} from './firestore';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Ключи запросов для всех коллекций в приложении
export const queryKeys = {
  users: 'users',
  clients: 'clients',
  vehicles: 'vehicles',
  services: 'services',
  shifts: 'shifts',
  appointments: 'appointments',
  appointmentServices: 'appointment_services',
  notifications: 'notifications',
  
  // Конкретные элементы коллекций по ID
  user: (id: number) => ['users', id],
  client: (id: number) => ['clients', id],
  vehicle: (id: number) => ['vehicles', id],
  service: (id: number) => ['services', id],
  shift: (id: number) => ['shifts', id],
  appointment: (id: number) => ['appointments', id],
  
  // Запросы для фильтрации
  vehiclesByClient: (clientId: number) => ['vehicles', 'client', clientId],
  appointmentsByClient: (clientId: number) => ['appointments', 'client', clientId],
  appointmentsByDate: (date: string) => ['appointments', 'date', date],
  appointmentsByDateRange: (startDate: string, endDate: string) => ['appointments', 'dateRange', startDate, endDate],
  shiftsByDate: (date: string) => ['shifts', 'date', date],
  shiftsByUser: (userId: number) => ['shifts', 'user', userId],
  notificationsByUser: (userId: number) => ['notifications', 'user', userId],
  
  // Отчеты
  dailyReport: (date: string) => ['reports', 'daily', date],
  weeklyReport: (startDate: string) => ['reports', 'weekly', startDate],
  monthlyReport: (month: number, year: number) => ['reports', 'monthly', month, year],
  employeeReport: (userId: number, startDate: string, endDate: string) => 
    ['reports', 'employee', userId, startDate, endDate]
};

// Функции для синхронизации данных
export const syncServices = {
  // Синхронизация всех данных
  async syncAll() {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [queryKeys.users] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.clients] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.vehicles] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.services] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.shifts] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.appointments] }),
        queryClient.invalidateQueries({ queryKey: [queryKeys.notifications] })
      ]);
      return true;
    } catch (error) {
      console.error('Ошибка синхронизации данных:', error);
      return false;
    }
  }');
    queryClient.invalidateQueries({ queryKey: [queryKeys.services] });
  },
  
  async syncShifts() {
    await cacheService.fetchCollection('shifts');
    queryClient.invalidateQueries({ queryKey: [queryKeys.shifts] });
  },
  
  async syncAppointments() {
    await cacheService.fetchCollection('appointments');
    queryClient.invalidateQueries({ queryKey: [queryKeys.appointments] });
  },
  
  async syncNotifications() {
    await cacheService.fetchCollection('notifications');
    queryClient.invalidateQueries({ queryKey: [queryKeys.notifications] });
  },
  
  // Функция для синхронизации всех данных
  async syncAll() {
    const collections = [
      'users', 'clients', 'vehicles', 'services', 
      'shifts', 'appointments', 'appointment_services', 'notifications'
    ];
    
    for (const collection of collections) {
      await cacheService.fetchCollection(collection);
    }
    
    // Инвалидируем все кэши запросов
    queryClient.invalidateQueries();
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Обновление при возврате на страницу
      staleTime: 5 * 60 * 1000, // 5 минут до устаревания данных
      retry: 1, // Одна попытка повторного запроса при ошибке
      networkMode: 'online', // Не выполнять запросы в офлайн режиме
    },
    mutations: {
      retry: 1, // Одна попытка повторного запроса при ошибке
    },
  },
});
