import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth/AuthProvider";
import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <span className="material-icons text-primary text-3xl mr-2">local_car_wash</span>
            <h1 className="text-3xl font-heading font-bold text-primary-dark">АвтоМойка</h1>
          </div>
          <p className="text-gray-600">Система управления автомойкой</p>
        </div>
        
        <LoginForm />
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Система управления для автомойки</p>
          <p className="mt-1">© 2023. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}
