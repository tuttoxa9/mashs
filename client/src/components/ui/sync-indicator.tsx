import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, CloudOff, RefreshCw, Wifi, WifiOff } from "lucide-react";

export type SyncStatus = "synced" | "syncing" | "error" | "offline";

interface SyncIndicatorProps {
  /** Статус синхронизации */
  status?: SyncStatus;
  /** Текст состояния синхронизации */
  text?: {
    synced?: string;
    syncing?: string;
    error?: string;
    offline?: string;
  };
  /** Дополнительные CSS классы */
  className?: string;
  /** Тип отображения */
  variant?: "minimal" | "badge" | "pill";
  /** Автоматическое скрытие в статусе synced */
  autoHide?: boolean;
  /** Интервал автоматического скрытия в мс */
  autoHideDelay?: number;
}

/**
 * Компонент для отображения статуса синхронизации с сервером
 */
export function SyncIndicator({
  status = "synced",
  text = {
    synced: "Синхронизировано",
    syncing: "Синхронизация...",
    error: "Ошибка синхронизации",
    offline: "Офлайн"
  },
  className,
  variant = "badge",
  autoHide = true,
  autoHideDelay = 3000
}: SyncIndicatorProps) {
  const [visible, setVisible] = useState(true);
  const { toast } = useToast();

  // Автоматическое скрытие индикатора
  useEffect(() => {
    if (status === "synced" && autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [status, autoHide, autoHideDelay]);

  // Если статус ошибки или оффлайн, показываем тост
  useEffect(() => {
    if (status === "error") {
      toast({
        variant: "destructive",
        title: "Ошибка синхронизации",
        description: "Не удалось синхронизировать данные с сервером"
      });
    } else if (status === "offline") {
      toast({
        variant: "default",
        title: "Офлайн режим",
        description: "Работа в режиме без подключения к сети"
      });
    }
  }, [status, toast]);

  if (!visible) return null;

  // Иконка в зависимости от статуса
  const getIcon = () => {
    switch (status) {
      case "synced":
        return <CheckCircle2 className="h-4 w-4" />;
      case "syncing":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "error":
        return <CloudOff className="h-4 w-4" />;
      case "offline":
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Wifi className="h-4 w-4" />;
    }
  };

  // Цвета в зависимости от статуса
  const getColors = () => {
    switch (status) {
      case "synced":
        return "bg-green-50 text-green-600 border-green-200";
      case "syncing":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "error":
        return "bg-red-50 text-red-600 border-red-200";
      case "offline":
        return "bg-amber-50 text-amber-600 border-amber-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  // Текст для отображения
  const displayText = text[status] || "";

  // Минимальный вариант (только иконка)
  if (variant === "minimal") {
    return (
      <div 
        className={cn(
          "flex items-center justify-center",
          className
        )}
      >
        {getIcon()}
      </div>
    );
  }

  // Вариант в виде значка
  if (variant === "badge") {
    return (
      <div 
        className={cn(
          "inline-flex items-center border rounded-md px-2 py-1 text-xs font-medium",
          getColors(),
          className
        )}
      >
        {getIcon()}
        <span className="ml-1">{displayText}</span>
      </div>
    );
  }

  // Вариант в виде таблетки
  return (
    <div 
      className={cn(
        "inline-flex items-center border rounded-full px-3 py-1 text-xs font-medium",
        getColors(),
        className
      )}
    >
      {getIcon()}
      <span className="ml-1">{displayText}</span>
    </div>
  );
}