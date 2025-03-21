import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Настраиваем персистентность для сохранения кеша между сессиями
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 часа
});

// Базовая функция для API запросов
export const apiRequest = async (
  endpoint: string,
  method: string = "GET",
  data?: any,
  options: RequestInit = {}
) => {
  const url = `/api${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const config: RequestInit = {
    method,
    headers,
    ...options,
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    // Проверяем успешность запроса
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
    }

    // Для HEAD или DELETE запросов может не быть тела ответа
    if (method === "HEAD" || (response.status === 204)) {
      return null;
    }

    // Пытаемся распарсить JSON ответ
    return await response.json();
  } catch (error) {
    console.error(`Ошибка запроса к ${url}:`, error);
    throw error;
  }
};

// Функция-хелпер для создания глобального состояния приложения
export const createGlobalState = <T>(initialState: T) => {
  let state = initialState;
  const listeners = new Set<(state: T) => void>();

  const getState = () => state;

  const setState = (newState: T) => {
    state = newState;
    listeners.forEach(listener => listener(state));
  };

  const subscribe = (listener: (state: T) => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { getState, setState, subscribe };
};