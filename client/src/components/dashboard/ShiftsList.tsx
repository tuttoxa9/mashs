import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatTime, getInitials } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock } from "lucide-react";

interface ShiftsListProps {
  date?: string;
}

export default function ShiftsList({ date }: ShiftsListProps) {
  const today = new Date().toISOString().split("T")[0];
  const queryDate = date || today;

  const { data: shifts, isLoading: shiftsLoading, error: shiftsError } = useQuery({
    queryKey: ['/api/shifts', queryDate],
    queryFn: async () => {
      const res = await fetch(`/api/shifts?date=${queryDate}`);
      if (!res.ok) throw new Error('Не удалось загрузить смены');
      return res.json();
    }
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Не удалось загрузить данные сотрудников');
      return res.json();
    }
  });

  const { data: appointments } = useQuery({
    queryKey: ['/api/appointments', queryDate],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?date=${queryDate}`);
      if (!res.ok) throw new Error('Не удалось загрузить записи');
      return res.json();
    },
    enabled: !!shifts
  });

  // Get user data by ID
  const getUserById = (userId: number) => {
    if (!users) return null;
    return users.find((user: any) => user.id === userId);
  };

  // Get appointments count for user
  const getAppointmentCount = (userId: number) => {
    if (!appointments) return 0;
    return appointments.filter((appointment: any) => appointment.userId === userId).length;
  };

  if (shiftsLoading || usersLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 p-4">
          <h3 className="font-heading font-semibold text-lg">Текущие смены</h3>
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 p-2 border-b border-gray-100">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
              <Skeleton className="h-8 w-[80px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (shiftsError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Не удалось загрузить смены</h3>
        <p className="text-gray-500 mt-2">Пожалуйста, попробуйте позже</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md lg:col-span-1">
      <div className="border-b border-gray-200 p-4">
        <h3 className="font-heading font-semibold text-lg">Текущие смены</h3>
      </div>
      <div className="p-4 space-y-3">
        {shifts && shifts.length > 0 ? (
          shifts.map((shift: any) => {
            const user = getUserById(shift.userId);
            const appointmentCount = getAppointmentCount(shift.userId);
            
            if (!user) return null;
            
            return (
              <div key={shift.id} className="flex items-center p-2 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  <span className="font-heading text-sm">{getInitials(user.name, user.surname)}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium">{`${user.name} ${user.surname}`}</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{appointmentCount} записей</div>
                  <div className="text-sm text-success">{formatCurrency(shift.earnings)}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-gray-500">
            Нет активных смен на этот день
          </div>
        )}
      </div>
      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg text-center">
        <Link href="/shifts" className="text-primary text-sm font-medium">Управление сменами</Link>
      </div>
    </div>
  );
}
