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
  // Создаем фиктивного пользователя для разработки
  const mockUser = {} as FirebaseUser;
  const mockUserData: User = {
    id: 1,
    email: "admin@example.com",
    name: "Администратор",
    surname: "Системы",
    role: "admin",
    createdAt: new Date(),
    phone: "+7 (999) 123-45-67",
    password: "",
    avatarUrl: null,
    firebaseUid: "mock-user-id"
  };

  const [user, setUser] = useState<FirebaseUser | null>(mockUser);
  const [userData, setUserData] = useState<User | null>(mockUserData);
  const [loading, setLoading] = useState(false); // Сразу отключаем загрузку
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Временно отключаем Firebase аутентификацию
  useEffect(() => {
    console.log("Firebase аутентификация временно отключена для разработки");
    // Никаких запросов к Firebase не делаем
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
