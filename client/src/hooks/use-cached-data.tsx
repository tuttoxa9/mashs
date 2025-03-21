import { useEffect, useState } from 'react';
import { cacheService } from '@/lib/cacheService';

/**
 * Хук для получения и кэширования данных
 * Автоматически подписывается на обновления данных в кэше
 * 
 * @param collectionName Имя коллекции в Firestore
 * @param cacheKey Необязательный ключ для кэширования (по умолчанию - имя коллекции)
 * @param syncWithFirestore Флаг для включения синхронизации с Firestore в реальном времени (по умолчанию - false)
 */
export function useCachedData<T>(
  collectionName: string, 
  cacheKey?: string, 
  syncWithFirestore: boolean = false
): {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const key = cacheKey || collectionName;
  const [data, setData] = useState<T[] | null>(cacheService.get<T[]>(key) || null);
  const [loading, setLoading] = useState<boolean>(!cacheService.has(key));
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Инициализируем сервис кэширования при первом запросе
      await cacheService.initialize();
      
      // Получаем данные из Firestore и сохраняем в кэш
      const result = await cacheService.fetchCollection(collectionName, key);
      setData(result as T[]);
    } catch (err) {
      console.error(`Ошибка при получении данных для ${collectionName}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при монтировании компонента, если их нет в кэше
  useEffect(() => {
    // Если данных нет в кэше, загружаем их
    if (!cacheService.has(key)) {
      fetchData();
    }

    // Подписываемся на обновления в кэше
    const onCacheUpdate = (newData: T[]) => {
      setData(newData);
    };
    
    cacheService.subscribe(key, onCacheUpdate);

    // Если нужна синхронизация с Firebase, включаем её
    let unsubscribe = () => {};
    if (syncWithFirestore) {
      unsubscribe = cacheService.syncWithFirestore(collectionName, key);
    }

    // Отписываемся при размонтировании компонента
    return () => {
      cacheService.unsubscribe(key, onCacheUpdate);
      if (syncWithFirestore) {
        unsubscribe();
      }
    };
  }, [collectionName, key, syncWithFirestore]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * Хук для получения и кэширования одного документа
 * 
 * @param collectionName Имя коллекции в Firestore
 * @param documentId ID документа
 * @param cacheKey Необязательный ключ для кэширования (по умолчанию - collectionName/documentId)
 */
export function useCachedDocument<T>(
  collectionName: string,
  documentId: string | number,
  cacheKey?: string
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const docId = documentId.toString();
  const key = cacheKey || `${collectionName}/${docId}`;
  const [data, setData] = useState<T | null>(cacheService.get<T>(key) || null);
  const [loading, setLoading] = useState<boolean>(!cacheService.has(key));
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Инициализируем сервис кэширования при первом запросе
      await cacheService.initialize();
      
      // Получаем документ из Firestore и сохраняем в кэш
      const result = await cacheService.fetchDocument(collectionName, docId, key);
      setData(result as T);
    } catch (err) {
      console.error(`Ошибка при получении документа ${collectionName}/${docId}:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при монтировании компонента, если их нет в кэше
  useEffect(() => {
    // Если данных нет в кэше, загружаем их
    if (!cacheService.has(key)) {
      fetchData();
    }

    // Подписываемся на обновления в кэше
    const onCacheUpdate = (newData: T) => {
      setData(newData);
    };
    
    cacheService.subscribe(key, onCacheUpdate);

    // Отписываемся при размонтировании компонента
    return () => {
      cacheService.unsubscribe(key, onCacheUpdate);
    };
  }, [collectionName, docId, key]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}