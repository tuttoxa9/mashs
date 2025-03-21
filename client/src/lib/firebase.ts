import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  User as FirebaseUser
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { User } from "@shared/schema";

// Firebase конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyD5LShret_8DCnzobxj1FtR4KWsl5uQoF4",
  authDomain: "wash-33cd8.firebaseapp.com",
  projectId: "wash-33cd8",
  storageBucket: "wash-33cd8.firebasestorage.app",
  messagingSenderId: "583285802651",
  appId: "1:583285802651:web:cf20935cad4e76b9d0283e",
  measurementId: "G-N6X46N10PC"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Аутентификация с email и паролем
export const loginWithEmailPassword = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // В реальном приложении здесь нужно запросить данные пользователя из Firestore
    // Для демонстрации просто преобразуем Firebase пользователя в объект User из нашей схемы
    return {
      id: parseInt(firebaseUser.uid.substring(0, 8), 16), // Преобразуем часть UID в число
      email: firebaseUser.email || "",
      name: firebaseUser.displayName?.split(' ')[0] || "Пользователь",
      surname: firebaseUser.displayName?.split(' ')[1] || "",
      role: "admin", // Роль должна определяться по данным из базы
      createdAt: new Date(),
      phone: firebaseUser.phoneNumber || "",
      password: "", // Обязательное поле
      avatarUrl: null,
      firebaseUid: firebaseUser.uid
    };
  } catch (error: any) {
    console.error("Error signing in with email and password", error);
    throw new Error(
      error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
        ? 'Неверный email или пароль'
        : 'Не удалось войти. Пожалуйста, попробуйте позже.'
    );
  }
};

// Аутентификация с Google
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    // В реальном приложении здесь нужно запросить данные пользователя из Firestore
    return {
      id: parseInt(firebaseUser.uid.substring(0, 8), 16),
      email: firebaseUser.email || "",
      name: firebaseUser.displayName?.split(' ')[0] || "Пользователь",
      surname: firebaseUser.displayName?.split(' ')[1] || "",
      role: "admin", // Роль должна определяться по данным из базы
      createdAt: new Date().toISOString(),
      phone: firebaseUser.phoneNumber || ""
    };
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    throw new Error(
      'Не удалось войти через Google. Пожалуйста, попробуйте позже.'
    );
  }
};

// Выход из аккаунта
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw new Error('Не удалось выйти из системы. Пожалуйста, попробуйте позже.');
  }
};

// Получение текущего пользователя Firebase
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Обработка результата редиректа (для возврата после Google auth)
export const handleAuthRedirect = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const firebaseUser = result.user;
      return {
        id: parseInt(firebaseUser.uid.substring(0, 8), 16),
        email: firebaseUser.email || "",
        name: firebaseUser.displayName?.split(' ')[0] || "Пользователь",
        surname: firebaseUser.displayName?.split(' ')[1] || "",
        role: "admin",
        createdAt: new Date().toISOString(),
        phone: firebaseUser.phoneNumber || ""
      };
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect result", error);
    return null;
  }
};

export { auth, db };