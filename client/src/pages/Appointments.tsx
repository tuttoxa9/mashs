import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import AppointmentCalendar from "@/components/appointments/AppointmentCalendar";
import AppointmentModal from "@/components/appointments/AppointmentModal";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Appointment } from "@shared/schema";

export default function Appointments() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  
  // Check URL parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('action') === 'new') {
      setSelectedAppointmentId(undefined);
      setIsAppointmentModalOpen(true);
      
      // Clear the URL parameter after opening the modal
      setLocation('/appointments', { replace: true });
    }
  }, [search, setLocation]);
  
  const handleDateSelect = (date: string) => {
    // You could load appointments for this date
    setSelectedDate(date);
    toast({
      title: "Дата выбрана",
      description: `Выбрана дата: ${date}`,
    });
  };
  
  const handleAppointmentClick = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setIsAppointmentModalOpen(true);
  };
  
  const handleAddAppointment = (date?: string, time?: string) => {
    setSelectedAppointmentId(undefined);
    setSelectedDate(date);
    setSelectedTime(time);
    setIsAppointmentModalOpen(true);
  };
  
  const closeAppointmentModal = () => {
    setIsAppointmentModalOpen(false);
    setSelectedAppointmentId(undefined);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
  };

  return (
    <AppLayout title="Календарь записей">
      <div className="space-y-6">
        <AppointmentCalendar 
          onDateSelect={handleDateSelect}
          onAppointmentClick={handleAppointmentClick}
          onAddClick={handleAddAppointment}
        />
        
        {/* Calendar Legend */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base font-medium">Обозначения</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 border-l-2 border-primary rounded mr-2"></div>
                <span className="text-sm">Ожидается</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 border-l-2 border-warning rounded mr-2"></div>
                <span className="text-sm">Подтверждено</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-indigo-100 border-l-2 border-indigo-600 rounded mr-2"></div>
                <span className="text-sm">В процессе</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 border-l-2 border-success rounded mr-2"></div>
                <span className="text-sm">Завершено</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 border-l-2 border-error rounded mr-2"></div>
                <span className="text-sm">Отменено</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={closeAppointmentModal}
        appointmentId={selectedAppointmentId}
        defaultDate={selectedDate}
        defaultTime={selectedTime}
      />
    </AppLayout>
  );
}
