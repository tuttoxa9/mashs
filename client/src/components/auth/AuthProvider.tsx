import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { 
  auth, 
  loginWithEmailPassword, 
  logoutUser, 
  loginWithGoogle,
  handleAuthRedirect,
  getCurrentFirebaseUser
} from "@/lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  login: async () => {},
  loginGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Проверка редиректа после входа через Google Auth
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const redirectUser = await handleAuthRedirect();
        if (redirectUser) {
          setUserData(redirectUser);
          
          toast({
            title: "Успешный вход",
            description: "Вы вошли в систему с помощью Google",
          });
        }
      } catch (error) {
        console.error("Ошибка при обработке редиректа:", error);
      }
    };
    
    checkRedirect();
  }, [toast]);

  // Отслеживание состояния аутентификации Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Здесь можно запросить дополнительные данные о пользователе из Firestore
          // В реальном приложении нужно создать отдельную функцию для этого
          const userProfileData: User = {
            id: parseInt(firebaseUser.uid.substring(0, 8), 16),
            email: firebaseUser.email || "",
            name: firebaseUser.displayName?.split(' ')[0] || "Пользователь",
            surname: firebaseUser.displayName?.split(' ')[1] || "",
            role: "admin", // По умолчанию, в реальном приложении должно быть из базы данных
            createdAt: new Date(),
            phone: firebaseUser.phoneNumber || "",
            password: "", // Обязательное поле
            avatarUrl: null,
            firebaseUid: firebaseUser.uid
          };
          
          setUserData(userProfileData);
        } catch (error) {
          console.error("Ошибка при получении данных пользователя:", error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const user = await loginWithEmailPassword(email, password);
      setUserData(user);
      
      toast({
        title: "Успешный вход",
        description: "Вы успешно вошли в систему",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка входа",
        description: error.message || "Произошла ошибка при попытке входа",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const loginGoogle = async () => {
    try {
      setLoading(true);
      
      const user = await loginWithGoogle();
      setUserData(user);
      
      toast({
        title: "Успешный вход",
        description: "Вы успешно вошли в систему через Google",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка входа",
        description: error.message || "Произошла ошибка при попытке входа через Google",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      
      // Очистка состояния
      setUserData(null);
      queryClient.clear();
      
      toast({
        title: "Выход из системы",
        description: "Вы успешно вышли из системы",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка выхода",
        description: error.message || "Произошла ошибка при попытке выхода",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      login, 
      loginGoogle,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}
