/**
 * Рекомендуемые правила безопасности для Firebase Firestore
 * Эти правила необходимо скопировать и вставить в раздел "Rules" в консоли Firebase
 */

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Разрешаем чтение для аутентифицированных пользователей
    match /{document=**} {
      allow read: if request.auth != null;
    }
    
    // Правила для коллекции пользователей
    match /users/{userId} {
      // Пользователи могут читать и обновлять только свои данные
      allow write: if request.auth != null && 
                   (request.auth.uid == resource.data.firebaseUid || 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Правила для клиентов
    match /clients/{clientId} {
      allow write: if request.auth != null;
    }
    
    // Правила для автомобилей
    match /vehicles/{vehicleId} {
      allow write: if request.auth != null;
    }
    
    // Правила для услуг
    match /services/{serviceId} {
      // Только админы могут изменять услуги
      allow write: if request.auth != null && 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Правила для смен
    match /shifts/{shiftId} {
      // Сотрудники могут создавать только свои смены, админы могут создавать любые
      allow write: if request.auth != null && 
                   (resource.data.userId == request.auth.uid || 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Правила для записей
    match /appointments/{appointmentId} {
      allow write: if request.auth != null;
    }
    
    // Правила для услуг в записях
    match /appointment_services/{appointmentServiceId} {
      allow write: if request.auth != null;
    }
    
    // Правила для уведомлений
    match /notifications/{notificationId} {
      // Пользователи могут видеть только свои уведомления
      allow read: if request.auth != null && 
                  (resource.data.userId == request.auth.uid || 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null;
    }
  }
}
*/

import { db } from './firebase';
import { collection, getDocs, getDoc, doc, query, limit, setDoc } from 'firebase/firestore';

/**
 * Проверяет доступ к Firestore и настраивает тестовые коллекции при необходимости
 * @returns {Promise<boolean>} Результат проверки доступа
 */
export const checkFirestoreAccess = async (): Promise<boolean> => {
  try {
    // Пытаемся получить данные из коллекции users
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(1));
    await getDocs(q);
    
    return true;
  } catch (error: any) {
    console.error('Ошибка при проверке доступа к Firestore:', error);
    
    if (error.code === 'permission-denied') {
      console.warn('Ошибка доступа: у вас недостаточно прав для доступа к Firestore.');
      console.warn('Пожалуйста, проверьте правила безопасности Firestore в консоли Firebase.');
      console.warn('Скопируйте и вставьте рекомендуемые правила из комментария в верхней части этого файла.');
    }
    
    return false;
  }
};

/**
 * Отображает инструкции по настройке правил безопасности Firebase
 */
export const getFirestoreRulesInstructions = (): string => {
  return `
Для настройки правил безопасности Firebase Firestore:

1. Перейдите в консоль Firebase: https://console.firebase.google.com
2. Выберите ваш проект: 'wash-33cd8'
3. В левом меню выберите 'Firestore Database'
4. Перейдите на вкладку 'Rules'
5. Замените существующие правила на следующие:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Для тестирования разрешаем полный доступ
    // ВНИМАНИЕ: Это временное решение только для разработки!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

6. Нажмите кнопку 'Publish'

ВАЖНО: Эти правила разрешают полный доступ и предназначены ТОЛЬКО для разработки.
Для продакшена необходимо настроить более строгие правила безопасности.
  `;
};

/**
 * Пытается инициализировать начальную структуру базы данных
 */
export const initializeFirestoreStructure = async (): Promise<boolean> => {
  try {
    // Проверяем, существует ли системный документ с метаданными
    const metaDocRef = doc(db, '_system', 'metadata');
    const metaDoc = await getDoc(metaDocRef);
    
    if (!metaDoc.exists()) {
      // Создаем метаданные
      await setDoc(metaDocRef, {
        initialized: true,
        version: '1.0.0',
        createdAt: new Date().toISOString()
      });
      console.log('Инициализирована базовая структура Firestore');
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации структуры Firestore:', error);
    return false;
  }
};