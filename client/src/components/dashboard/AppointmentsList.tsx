import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Appointment } from "@shared/schema";
import { formatTime, getStatusColorClass, getStatusText } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Eye, Edit, AlertCircle } from "lucide-react";

interface AppointmentsListProps {
  date?: string;
  limit?: number;
}

export default function AppointmentsList({ date, limit }: AppointmentsListProps) {
  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['/api/appointments', date],
    queryFn: async () => {
      const url = date ? `/api/appointments?date=${date}` : '/api/appointments';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Не удалось загрузить записи');
      }
      return res.json();
    }
  });

  // Additional queries to get related data
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      if (!res.ok) {
        throw new Error('Не удалось загрузить данные клиентов');
      }
      return res.json();
    },
    enabled: !!appointments,
  });

  const { data: vehicles } = useQuery({
    queryKey: ['/api/vehicles'],
    queryFn: async () => {
      const res = await fetch('/api/vehicles');
      if (!res.ok) {
        throw new Error('Не удалось загрузить данные автомобилей');
      }
      return res.json();
    },
    enabled: !!appointments,
  });

  const { data: services } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const res = await fetch('/api/services');
      if (!res.ok) {
        throw new Error('Не удалось загрузить данные услуг');
      }
      return res.json();
    },
    enabled: !!appointments,
  });

  // Filter and sort appointments
  const filteredAppointments = appointments
    ? appointments
        .slice(0, limit || appointments.length)
        .sort((a: Appointment, b: Appointment) => {
          // Sort by date and then by time
          if (a.date !== b.date) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          }
          return a.startTime.localeCompare(b.startTime);
        })
    : [];

  // Helper function to get client name by ID
  const getClientName = (clientId: number) => {
    if (!clients) return "...";
    const client = clients.find((client: any) => client.id === clientId);
    return client ? `${client.name} ${client.surname}` : "Неизвестный клиент";
  };

  // Helper function to get vehicle info by ID
  const getVehicleInfo = (vehicleId: number) => {
    if (!vehicles) return "...";
    const vehicle = vehicles.find((vehicle: any) => vehicle.id === vehicleId);
    return vehicle
      ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`
      : "Неизвестный автомобиль";
  };

  // Helper function to get service names for an appointment
  const getServiceInfo = (appointmentId: number) => {
    if (!services) return "...";
    // In a real implementation, you would need to fetch appointment services
    // For now, just return a placeholder
    return "Комплексная мойка";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <h3 className="font-heading font-semibold text-lg">Ближайшие записи</h3>
          <Link href="/appointments" className="text-primary text-sm flex items-center">
            Все записи
            <span className="material-icons text-sm ml-1">arrow_forward</span>
          </Link>
        </div>
        
        <div className="p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Не удалось загрузить записи</h3>
        <p className="text-gray-500 mt-2">Пожалуйста, попробуйте позже</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="border-b border-gray-200 p-4 flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Ближайшие записи</h3>
        <Link href="/appointments" className="text-primary text-sm flex items-center">
          Все записи
          <span className="material-icons text-sm ml-1">arrow_forward</span>
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Время</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Автомобиль</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Услуга</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment: Appointment) => {
                const statusClasses = getStatusColorClass(appointment.status);
                
                return (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {formatTime(appointment.startTime)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {getClientName(appointment.clientId)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {getVehicleInfo(appointment.vehicleId)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {getServiceInfo(appointment.id)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses.bg} ${statusClasses.text}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <button className="text-primary hover:text-primary-dark">
                        <Eye size={16} />
                      </button>
                      <button className="text-primary hover:text-primary-dark ml-2">
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                  Нет записей на ближайшее время
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
