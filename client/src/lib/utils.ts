import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('be-BY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('be-BY', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Форматирование телефона по белорусскому формату
export function formatBelarusPhone(phone: string): string {
  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, '');
  
  // Если телефон начинается с 8 или +375, форматируем его соответствующим образом
  if (digits.startsWith('375') || digits.length === 12) {
    // +375 XX XXX-XX-XX
    return `+375 ${digits.slice(3, 5)} ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  } else if (digits.startsWith('80') || digits.length === 11) {
    // 8 0XX XXX-XX-XX
    return `8 0${digits.slice(2, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  } else {
    // Если формат не определен, возвращаем как есть
    return phone;
  }
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusColorClass(status: string): {bg: string, text: string} {
  switch (status) {
    case 'scheduled':
      return { bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'confirmed':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    case 'in_progress':
      return { bg: 'bg-indigo-100', text: 'text-indigo-800' };
    case 'completed':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'cancelled':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'Ожидается';
    case 'confirmed':
      return 'Подтверждено';
    case 'in_progress':
      return 'В процессе';
    case 'completed':
      return 'Завершено';
    case 'cancelled':
      return 'Отменено';
    default:
      return status;
  }
}

export function getCurrentDate(): string {
  return formatDate(new Date());
}

export function generateMonthDays(year: number, month: number): Array<{
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}> {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Получаем день недели первого дня месяца (0 - воскресенье)
  let firstDayOfWeek = firstDay.getDay();
  // Преобразуем в формат, где понедельник - начало недели (0 - понедельник)
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  const daysInMonth = lastDay.getDate();
  const result = [];
  
  // Добавляем дни предыдущего месяца
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();
  
  for (let i = 0; i < firstDayOfWeek; i++) {
    const date = new Date(year, month - 1, daysInPrevMonth - firstDayOfWeek + i + 1);
    result.push({
      date,
      isCurrentMonth: false,
      isToday: date.toDateString() === today.toDateString()
    });
  }
  
  // Дни текущего месяца
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    result.push({
      date,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString()
    });
  }
  
  // Дни следующего месяца для заполнения сетки
  const nextMonthDays = 42 - result.length; // 6 недель по 7 дней
  for (let i = 1; i <= nextMonthDays; i++) {
    const date = new Date(year, month + 1, i);
    result.push({
      date,
      isCurrentMonth: false,
      isToday: date.toDateString() === today.toDateString()
    });
  }
  
  return result;
}

export function getDaysOfWeek(): string[] {
  return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
}

export function getMonthName(month: number): string {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return months[month];
}
