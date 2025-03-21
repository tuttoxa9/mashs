import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLoaderProps {
  /** Текст, отображаемый под лоадером */
  text?: string;
  /** Размер лоадера */
  size?: 'sm' | 'md' | 'lg';
  /** CSS классы для обертки */
  className?: string;
  /** CSS классы для самого лоадера */
  spinnerClassName?: string;
  /** CSS классы для текста */
  textClassName?: string;
  /** Полноэкранный режим */
  fullScreen?: boolean;
}

/**
 * Компонент для отображения индикатора загрузки
 */
export function AppLoader({
  text,
  size = 'md',
  className,
  spinnerClassName,
  textClassName,
  fullScreen = false,
}: AppLoaderProps) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const containerClasses = cn(
    'flex flex-col items-center justify-center',
    fullScreen && 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
    className
  );

  return (
    <div className={containerClasses}>
      <Loader2 
        className={cn(
          'animate-spin text-primary',
          sizeMap[size],
          spinnerClassName
        )} 
      />
      {text && (
        <p className={cn('mt-2 text-sm text-muted-foreground', textClassName)}>
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * Компонент-обертка для отображения содержимого с учетом состояния загрузки и ошибок
 */
interface DataStateWrapperProps {
  /** Флаг состояния загрузки */
  loading: boolean;
  /** Объект ошибки */
  error: Error | null;
  /** Данные для проверки */
  data: any;
  /** Компонент, отображаемый при загрузке */
  loadingComponent?: React.ReactNode;
  /** Компонент, отображаемый при ошибке */
  errorComponent?: React.ReactNode;
  /** Компонент, отображаемый при отсутствии данных */
  emptyComponent?: React.ReactNode;
  /** Дочерние элементы */
  children: React.ReactNode;
  /** Текст для лоадера */
  loadingText?: string;
}

export function DataStateWrapper({
  loading,
  error,
  data,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  loadingText = 'Загрузка данных...'
}: DataStateWrapperProps) {
  // Отображаем компонент загрузки
  if (loading) {
    return loadingComponent || <AppLoader text={loadingText} />;
  }

  // Отображаем компонент ошибки
  if (error) {
    return errorComponent || (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-red-100 p-3">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Произошла ошибка</h3>
        <p className="mt-1 text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  // Отображаем компонент отсутствия данных
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyComponent || (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-blue-100 p-3">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Нет данных</h3>
        <p className="mt-1 text-sm text-gray-500">Данных пока нет или они не были загружены.</p>
      </div>
    );
  }

  // Отображаем основное содержимое
  return <>{children}</>;
}