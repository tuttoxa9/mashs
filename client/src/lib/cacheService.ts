/**
 * Сервис кэширования и синхронизации данных с Firebase
 */
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, onSnapshot, Unsubscribe, query, where } from 'firebase/firestore';
import { initializeFirestoreStructure } from './firestoreRules';

// Типы для функции кэширования данных
type CacheKey = string;
type CacheValue = any;
type SyncListener = (data: any) => void;

/**
 * Сервис для кэширования и синхронизации данных между Firebase и локальным хранилищем
 */
class CacheService {
  private cache: Map<CacheKey, CacheValue> = new Map();
  private syncListeners: Map<CacheKey, Array<SyncListener>> = new Map();
  private unsubscribers: Map<CacheKey, Unsubscribe> = new Map();
  private initialized: boolean = false;

  /**
   * Инициализация сервиса кэширования
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Инициализируем структуру базы данных в Firebase если нужно
      await initializeFirestoreStructure();
      this.initialized = true;
      console.log('Сервис кэширования успешно инициализирован');
      return true;
    } catch (error) {
      console.error('Ошибка при инициализации сервиса кэширования:', error);
      return false;
    }
  }

  /**
   * Получить данные из кэша
   * @param key Ключ для получения данных
   */
  get<T>(key: CacheKey): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  /**
   * Сохранить данные в кэш
   * @param key Ключ для сохранения данных
   * @param value Данные для сохранения
   */
  set<T>(key: CacheKey, value: T): void {
    this.cache.set(key, value);
    this.notifyListeners(key, value);
  }

  /**
   * Проверить наличие данных в кэше
   * @param key Ключ для проверки
   */
  has(key: CacheKey): boolean {
    return this.cache.has(key);
  }

  /**
   * Удалить данные из кэша
   * @param key Ключ для удаления данных
   */
  delete(key: CacheKey): boolean {
    const result = this.cache.delete(key);
    this.unsubscribeFromSync(key);
    return result;
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.cache.clear();
    this.unsubscribeFromAllSync();
  }

  /**
   * Получить данные из Firestore коллекции и сохранить в кэш
   * @param collectionName Имя коллекции Firestore
   * @param key Ключ для сохранения данных в кэш (по умолчанию - имя коллекции)
   */
  async fetchCollection(collectionName: string, key?: CacheKey): Promise<any[]> {
    try {
      const keyToUse = key || collectionName;
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.set(keyToUse, data);
      return data;
    } catch (error) {
      console.error(`Ошибка при получении коллекции ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Получить данные из Firestore документа и сохранить в кэш
   * @param collectionName Имя коллекции Firestore
   * @param documentId ID документа
   * @param key Ключ для сохранения данных в кэш (по умолчанию - collectionName/documentId)
   */
  async fetchDocument(collectionName: string, documentId: string, key?: CacheKey): Promise<any | null> {
    try {
      const keyToUse = key || `${collectionName}/${documentId}`;
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDocs(query(collection(db, collectionName), where('id', '==', parseInt(documentId))));
      
      if (docSnap.empty) {
        this.set(keyToUse, null);
        return null;
      }
      
      const data = { id: docSnap.docs[0].id, ...docSnap.docs[0].data() };
      this.set(keyToUse, data);
      return data;
    } catch (error) {
      console.error(`Ошибка при получении документа ${collectionName}/${documentId}:`, error);
      return null;
    }
  }

  /**
   * Сохранить данные в Firestore и в кэш
   * @param collectionName Имя коллекции Firestore
   * @param data Данные для сохранения
   * @param key Ключ для сохранения данных в кэш (по умолчанию - имя коллекции)
   */
  async saveToFirestore(collectionName: string, data: any, key?: CacheKey): Promise<boolean> {
    try {
      const keyToUse = key || collectionName;
      const id = data.id.toString();
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, data);
      this.set(keyToUse, data);
      return true;
    } catch (error) {
      console.error(`Ошибка при сохранении в Firestore ${collectionName}:`, error);
      return false;
    }
  }

  /**
   * Синхронизировать данные с Firestore (real-time)
   * @param collectionName Имя коллекции Firestore
   * @param key Ключ для сохранения данных в кэш (по умолчанию - имя коллекции)
   */
  syncWithFirestore(collectionName: string, key?: CacheKey): Unsubscribe {
    const keyToUse = key || collectionName;
    
    // Отписываемся от предыдущей синхронизации, если она была
    this.unsubscribeFromSync(keyToUse);
    
    const collectionRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.set(keyToUse, data);
    }, (error) => {
      console.error(`Ошибка синхронизации с Firestore ${collectionName}:`, error);
    });
    
    this.unsubscribers.set(keyToUse, unsubscribe);
    return unsubscribe;
  }

  /**
   * Добавить слушателя изменений кэша
   * @param key Ключ для слушателя
   * @param listener Функция-слушатель
   */
  subscribe(key: CacheKey, listener: SyncListener): void {
    if (!this.syncListeners.has(key)) {
      this.syncListeners.set(key, []);
    }
    const listeners = this.syncListeners.get(key);
    listeners!.push(listener);
  }

  /**
   * Удалить слушателя изменений кэша
   * @param key Ключ для слушателя
   * @param listener Функция-слушатель
   */
  unsubscribe(key: CacheKey, listener: SyncListener): void {
    if (!this.syncListeners.has(key)) return;
    
    const listeners = this.syncListeners.get(key);
    const index = listeners!.indexOf(listener);
    if (index !== -1) {
      listeners!.splice(index, 1);
    }
  }

  /**
   * Уведомить всех слушателей о изменении данных
   * @param key Ключ измененных данных
   * @param data Новые данные
   */
  private notifyListeners(key: CacheKey, data: any): void {
    if (!this.syncListeners.has(key)) return;
    
    const listeners = this.syncListeners.get(key);
    listeners!.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Ошибка при вызове слушателя для ${key}:`, error);
      }
    });
  }

  /**
   * Отписаться от синхронизации с Firestore
   * @param key Ключ для отписки
   */
  private unsubscribeFromSync(key: CacheKey): void {
    if (this.unsubscribers.has(key)) {
      const unsubscribe = this.unsubscribers.get(key);
      unsubscribe!();
      this.unsubscribers.delete(key);
    }
  }

  /**
   * Отписаться от всех синхронизаций с Firestore
   */
  private unsubscribeFromAllSync(): void {
    for (const [key, unsubscribe] of this.unsubscribers.entries()) {
      unsubscribe();
      this.unsubscribers.delete(key);
    }
  }
}

// Создаем и экспортируем синглтон сервиса кэширования
export const cacheService = new CacheService();