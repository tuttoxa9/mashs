import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopNavBar from "./TopNavBar";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector(".sidebar");
      const toggleButton = document.getElementById("toggleSidebar");
      
      if (sidebar && 
          !sidebar.contains(event.target as Node) && 
          toggleButton && 
          !toggleButton.contains(event.target as Node) && 
          window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Close sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavBar title={title} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
