import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import VehiclesList from "@/components/vehicles/VehiclesList";
import { Vehicle } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

export default function Vehicles() {
  const [selectedTab, setSelectedTab] = useState("vehicles");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  // Fetch vehicle details if a vehicle is selected
  const { data: vehicleDetails } = useQuery({
    queryKey: ['/api/vehicles', selectedVehicle?.id, 'details'],
    queryFn: async () => {
      if (!selectedVehicle) return null;
      try {
        // In a real app, you might have a dedicated endpoint for this
        // For now, we just return basic info about the vehicle
        return selectedVehicle;
      } catch (error) {
        console.error('Error fetching vehicle details:', error);
        return null;
      }
    },
    enabled: !!selectedVehicle
  });
  
  // Fetch vehicle appointments
  const { data: vehicleAppointments } = useQuery({
    queryKey: ['/api/appointments/vehicle', selectedVehicle?.id],
    queryFn: async () => {
      if (!selectedVehicle) return [];
      try {
        // In a real app, you would have an endpoint for this
        // For now, we'll just fetch all appointments and filter them
        const res = await fetch('/api/appointments');
        if (!res.ok) throw new Error('Не удалось загрузить записи для автомобиля');
        const allAppointments = await res.json();
        return allAppointments.filter((appointment: any) => 
          appointment.vehicleId === selectedVehicle.id
        );
      } catch (error) {
        console.error('Error fetching vehicle appointments:', error);
        return [];
      }
    },
    enabled: !!selectedVehicle
  });
  
  // Fetch vehicle client
  const { data: vehicleClient } = useQuery({
    queryKey: ['/api/clients', selectedVehicle?.clientId],
    queryFn: async () => {
      if (!selectedVehicle) return null;
      try {
        const res = await fetch(`/api/clients/${selectedVehicle.clientId}`);
        if (!res.ok) throw new Error('Не удалось загрузить данные о владельце');
        return res.json();
      } catch (error) {
        console.error('Error fetching vehicle client:', error);
        return null;
      }
    },
    enabled: !!selectedVehicle
  });
  
  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedTab("details");
  };

  return (
    <AppLayout title="Автомобили">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vehicles">Список автомобилей</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedVehicle}>Детали автомобиля</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vehicles">
          <VehiclesList onVehicleSelect={handleVehicleSelect} />
        </TabsContent>
        
        <TabsContent value="details">
          {selectedVehicle && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Информация об автомобиле</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-3xl">
                        <span className="material-icons">directions_car</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Марка:</span>
                        <span>{selectedVehicle.make}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Модель:</span>
                        <span>{selectedVehicle.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Год выпуска:</span>
                        <span>{selectedVehicle.year || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Гос. номер:</span>
                        <span>{selectedVehicle.licensePlate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Цвет:</span>
                        <span>{selectedVehicle.color || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Дата регистрации:</span>
                        <span>{formatDate(selectedVehicle.createdAt)}</span>
                      </div>
                    </div>
                    
                    {vehicleClient && (
                      <div className="pt-4 border-t mt-4">
                        <h4 className="font-medium mb-2">Владелец</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">ФИО:</span>
                            <span>{vehicleClient.name} {vehicleClient.surname}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Телефон:</span>
                            <span>{vehicleClient.phone}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>История обслуживания</CardTitle>
                  <CardDescription>
                    Записи и услуги для этого автомобиля
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vehicleAppointments && vehicleAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {vehicleAppointments.map((appointment: any) => (
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
                      У автомобиля пока нет записей на обслуживание
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
