import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg">Загрузка...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
