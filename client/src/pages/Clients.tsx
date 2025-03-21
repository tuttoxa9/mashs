import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ClientsList from "@/components/clients/ClientsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VehiclesList from "@/components/vehicles/VehiclesList";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Client } from "@shared/schema";
import AppointmentModal from "@/components/appointments/AppointmentModal";
import { formatDate } from "@/lib/utils";

export default function Clients() {
  const [selectedTab, setSelectedTab] = useState("clients");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  // Fetch client appointments if a client is selected
  const { data: clientAppointments } = useQuery({
    queryKey: ['/api/appointments/client', selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      try {
        const res = await fetch(`/api/appointments?clientId=${selectedClient.id}`);
        if (!res.ok) throw new Error('Не удалось загрузить записи клиента');
        return res.json();
      } catch (error) {
        console.error('Error fetching client appointments:', error);
        return [];
      }
    },
    enabled: !!selectedClient
  });
  
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSelectedTab("details");
  };
  
  const handleCreateAppointment = () => {
    setIsAppointmentModalOpen(true);
  };
  
  const closeAppointmentModal = () => {
    setIsAppointmentModalOpen(false);
  };

  return (
    <AppLayout title="Клиенты">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients">Список клиентов</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedClient}>Информация о клиенте</TabsTrigger>
          <TabsTrigger value="vehicles" disabled={!selectedClient}>Автомобили клиента</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients">
          <ClientsList onClientSelect={handleClientSelect} />
        </TabsContent>
        
        <TabsContent value="details">
          {selectedClient && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Информация о клиенте</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-primary-light text-white flex items-center justify-center text-xl">
                        {selectedClient.name.charAt(0)}{selectedClient.surname.charAt(0)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">ФИО:</span>
                        <span>{selectedClient.name} {selectedClient.surname}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Телефон:</span>
                        <span>{selectedClient.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span>{selectedClient.email || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Дата регистрации:</span>
                        <span>{formatDate(selectedClient.createdAt)}</span>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={handleCreateAppointment}
                        className="w-full"
                      >
                        Создать запись
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>История записей</CardTitle>
                </CardHeader>
                <CardContent>
                  {clientAppointments && clientAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {clientAppointments.map((appointment: any) => (
                        <div key={appointment.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50">
                          <div>
                            <div className="font-medium">{formatDate(appointment.date)}, {appointment.startTime.substring(0, 5)}</div>
                            <div className="text-sm text-gray-500">
                              Стоимость: {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(appointment.totalPrice)}
                            </div>
                          </div>
                          <div>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                              ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                                appointment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                'bg-yellow-100 text-yellow-800'}`
                            }>
                              {appointment.status === 'completed' ? 'Завершена' : 
                               appointment.status === 'cancelled' ? 'Отменена' : 
                               appointment.status === 'in_progress' ? 'В процессе' : 
                               'Запланирована'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      У клиента пока нет записей
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="vehicles">
          {selectedClient && (
            <VehiclesList clientId={selectedClient.id} />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Appointment Modal */}
      {selectedClient && (
        <AppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={closeAppointmentModal}
          defaultDate={new Date().toISOString().split('T')[0]}
        />
      )}
    </AppLayout>
  );
}
