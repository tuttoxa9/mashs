import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { getInitials } from "@/lib/utils";

interface SidebarProps {
  open?: boolean;
}

export default function Sidebar({ open = false }: SidebarProps) {
  const [location] = useLocation();
  const { userData, logout } = useAuth();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const navItems = [
    { path: "/", icon: "dashboard", label: "Панель управления" },
    { path: "/appointments", icon: "calendar_today", label: "Календарь записей" },
    { path: "/employees", icon: "people", label: "Сотрудники" },
    { path: "/clients", icon: "person", label: "Клиенты" },
    { path: "/vehicles", icon: "directions_car", label: "Автомобили" },
    { path: "/shifts", icon: "schedule", label: "Смены" },
    { path: "/reports", icon: "summarize", label: "Отчеты" },
    { path: "/services", icon: "cleaning_services", label: "Услуги" },
    { path: "/settings", icon: "settings", label: "Настройки" },
  ];
  
  const handleLogout = async () => {
    await logout();
  };
  
  const userName = userData ? `${userData.name} ${userData.surname}` : "Пользователь";
  const userRole = userData ? (userData.role === "admin" ? "Администратор" : "Сотрудник") : "";
  const userInitials = userData ? getInitials(userData.name || "", userData.surname || "") : "АД";

  return (
    <aside 
      className={cn(
        "sidebar bg-white w-64 h-full shadow-lg flex-shrink-0 fixed lg:relative z-20",
        "lg:transform-none transition-transform duration-300",
        open ? "transform-none" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo and brand */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <span className="material-icons text-primary mr-2">local_car_wash</span>
            <h1 className="text-xl font-heading font-bold text-primary-dark">АвтоМойка</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">Система управления</p>
        </div>
        
        {/* User info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-light text-white flex items-center justify-center">
              <span className="font-heading font-medium">{userInitials}</span>
            </div>
            <div className="ml-3">
              <p className="font-heading font-medium">{userRole}</p>
              <p className="text-xs text-gray-500">{userName}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-grow overflow-y-auto p-2">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <a 
                    className={cn(
                      "sidebar-item flex items-center p-3 rounded-md",
                      isActive(item.path) && "active"
                    )}
                  >
                    <span className={cn(
                      "material-icons mr-3",
                      isActive(item.path) ? "text-primary" : "text-gray-600"
                    )}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button 
            className="flex items-center text-gray-700 hover:text-primary transition-colors"
            onClick={handleLogout}
          >
            <span className="material-icons mr-2">logout</span>
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
