import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  /** Заголовок */
  title: string;
  /** Описание */
  description?: string;
  /** Иконка (из библиотеки Lucide) */
  icon?: LucideIcon;
  /** Функция действия кнопки */
  action?: () => void;
  /** Текст кнопки */
  actionText?: string;
  /** Вариант кнопки */
  actionVariant?: "default" | "outline" | "secondary" | "ghost" | "link";
  /** CSS классы для контейнера */
  className?: string;
  /** Высота пустого состояния */
  height?: "auto" | "full";
}

/**
 * Компонент для отображения пустого состояния (отсутствия данных)
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  actionText = "Создать",
  actionVariant = "default",
  className,
  height = "auto",
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
        height === "full" ? "h-full" : "h-auto",
        className
      )}
    >
      {Icon && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      )}
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && actionText && (
        <Button 
          onClick={action} 
          variant={actionVariant} 
          className="mt-4"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}

interface EmptySearchProps {
  /** Поисковый запрос */
  query: string;
  /** CSS классы для контейнера */
  className?: string;
  /** Действие при очистке */
  onClear?: () => void;
}

/**
 * Компонент для отображения пустого состояния после поиска
 */
export function EmptySearch({
  query,
  className,
  onClear,
}: EmptySearchProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center",
        className
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <svg
          className="h-6 w-6 text-muted-foreground"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-medium">Ничего не найдено</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Не удалось найти результаты для "{query}"
      </p>
      {onClear && (
        <Button onClick={onClear} variant="outline" className="mt-4">
          Очистить поиск
        </Button>
      )}
    </div>
  );
}