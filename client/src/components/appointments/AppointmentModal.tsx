import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertAppointmentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId?: number;
  defaultDate?: string;
  defaultTime?: string;
}

const appointmentFormSchema = insertAppointmentSchema.extend({
  date: z.string().min(1, "Выберите дату"),
  startTime: z.string().min(1, "Выберите время"),
  selectedServices: z.array(z.number()).min(1, "Выберите хотя бы одну услугу"),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export default function AppointmentModal({ 
  isOpen, 
  onClose, 
  appointmentId,
  defaultDate,
  defaultTime
}: AppointmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Define whether we're editing or creating
  const isEditing = !!appointmentId;
  
  // Fetch clients for select dropdown
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Не удалось загрузить клиентов');
      return res.json();
    },
    enabled: isOpen,
  });
  
  // Fetch services
  const { data: services } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Не удалось загрузить услуги');
      return res.json();
    },
    enabled: isOpen,
  });
  
  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Не удалось загрузить сотрудников');
      return res.json();
    },
    enabled: isOpen,
  });
  
  // Fetch appointment for editing
  const { data: appointmentData, isLoading: appointmentLoading } = useQuery({
    queryKey: ['/api/appointments', appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      const res = await fetch(`/api/appointments/${appointmentId}`);
      if (!res.ok) throw new Error('Не удалось загрузить данные записи');
      return res.json();
    },
    enabled: isOpen && isEditing,
  });
  
  // Fetch selected services for this appointment
  const { data: appointmentServices } = useQuery({
    queryKey: ['/api/appointments', appointmentId, 'services'],
    queryFn: async () => {
      if (!appointmentId) return [];
      const res = await fetch(`/api/appointments/${appointmentId}/services`);
      if (!res.ok) throw new Error('Не удалось загрузить услуги записи');
      return res.json();
    },
    enabled: isOpen && isEditing,
  });
  
  // Create form
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      clientId: 0,
      vehicleId: 0,
      userId: 0,
      date: defaultDate || new Date().toISOString().split('T')[0],
      startTime: defaultTime || "10:00:00",
      status: "scheduled",
      totalPrice: 0,
      notes: "",
      selectedServices: []
    }
  });
  
  // Client selection state
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  
  // Fetch vehicles for selected client
  const { data: vehicles } = useQuery({
    queryKey: ['/api/clients', selectedClientId, 'vehicles'],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const res = await fetch(`/api/clients/${selectedClientId}/vehicles`);
      if (!res.ok) throw new Error('Не удалось загрузить автомобили клиента');
      return res.json();
    },
    enabled: isOpen && !!selectedClientId,
  });
  
  // Fill form with appointment data when editing
  useEffect(() => {
    if (appointmentData && appointmentServices) {
      setSelectedClientId(appointmentData.clientId);
      
      form.reset({
        ...appointmentData,
        selectedServices: appointmentServices.map((service: any) => service.serviceId)
      });
      
      // Calculate total price
      const total = appointmentServices.reduce((sum: number, service: any) => sum + service.price, 0);
      setTotalPrice(total);
    }
  }, [appointmentData, appointmentServices, form]);
  
  // Create appointment mutation
  const createAppointment = useMutation({
    mutationFn: async (data: any) => {
      const { selectedServices, ...appointmentData } = data;
      
      // Create appointment
      const appointmentRes = await apiRequest('POST', '/api/appointments', {
        ...appointmentData, 
        totalPrice
      });
      
      if (!appointmentRes.ok) {
        throw new Error("Не удалось создать запись");
      }
      
      const newAppointment = await appointmentRes.json();
      
      // Create appointment services
      for (const serviceId of selectedServices) {
        const serviceObj = services.find((s: any) => s.id === serviceId);
        if (serviceObj) {
          await apiRequest('POST', '/api/appointment-services', {
            appointmentId: newAppointment.id,
            serviceId: serviceId,
            price: serviceObj.price
          });
        }
      }
      
      return newAppointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Запись создана",
        description: "Запись успешно создана",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать запись",
        variant: "destructive",
      });
    }
  });
  
  // Update appointment mutation
  const updateAppointment = useMutation({
    mutationFn: async (data: any) => {
      const { selectedServices, ...appointmentData } = data;
      
      // Update appointment
      const appointmentRes = await apiRequest('PUT', `/api/appointments/${appointmentId}`, {
        ...appointmentData, 
        totalPrice
      });
      
      if (!appointmentRes.ok) {
        throw new Error("Не удалось обновить запись");
      }
      
      const updatedAppointment = await appointmentRes.json();
      
      // Delete existing appointment services
      if (appointmentServices && appointmentServices.length > 0) {
        for (const service of appointmentServices) {
          await apiRequest('DELETE', `/api/appointment-services/${service.id}`, {});
        }
      }
      
      // Create new appointment services
      for (const serviceId of selectedServices) {
        const serviceObj = services.find((s: any) => s.id === serviceId);
        if (serviceObj) {
          await apiRequest('POST', '/api/appointment-services', {
            appointmentId: updatedAppointment.id,
            serviceId: serviceId,
            price: serviceObj.price
          });
        }
      }
      
      return updatedAppointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Запись обновлена",
        description: "Запись успешно обновлена",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить запись",
        variant: "destructive",
      });
    }
  });
  
  // Update total price when services are selected
  useEffect(() => {
    if (services) {
      const selectedServiceIds = form.watch("selectedServices");
      const total = selectedServiceIds.reduce((sum, serviceId) => {
        const service = services.find((s: any) => s.id === serviceId);
        return sum + (service ? service.price : 0);
      }, 0);
      setTotalPrice(total);
    }
  }, [form.watch("selectedServices"), services]);
  
  const onSubmit = (data: AppointmentFormValues) => {
    if (isEditing) {
      updateAppointment.mutate(data);
    } else {
      createAppointment.mutate(data);
    }
  };
  
  const handleClientChange = (value: string) => {
    const clientId = parseInt(value);
    setSelectedClientId(clientId);
    form.setValue("clientId", clientId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold text-lg">
            {isEditing ? "Редактировать запись" : "Новая запись"}
          </DialogTitle>
        </DialogHeader>
        
        {(appointmentLoading && isEditing) ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Загрузка данных...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Время</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Клиент</FormLabel>
                    <Select
                      onValueChange={handleClientChange}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите клиента" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {`${client.name} ${client.surname}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Автомобиль</FormLabel>
                    <Select
                      onValueChange={(value) => form.setValue("vehicleId", parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : undefined}
                      disabled={!selectedClientId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            selectedClientId ? "Выберите автомобиль" : "Сначала выберите клиента"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles?.map((vehicle: any) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {`${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="selectedServices"
                render={() => (
                  <FormItem>
                    <FormLabel>Услуги</FormLabel>
                    <div className="space-y-2">
                      {services?.map((service: any) => (
                        <div key={service.id} className="flex items-center">
                          <FormField
                            control={form.control}
                            name="selectedServices"
                            render={({ field }) => {
                              return (
                                <FormItem className="flex items-center space-x-2 space-y-0 flex-1">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(service.id)}
                                      onCheckedChange={(checked) => {
                                        const current = [...field.value];
                                        if (checked) {
                                          field.onChange([...current, service.id]);
                                        } else {
                                          field.onChange(current.filter(id => id !== service.id));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{service.name}</FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                          <div className="ml-auto text-sm text-gray-500">
                            {formatCurrency(service.price)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Мойщик</FormLabel>
                    <Select
                      onValueChange={(value) => form.setValue("userId", parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выбрать мойщика" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.filter((e: any) => e.role === 'employee').map((employee: any) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {`${employee.name} ${employee.surname}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Комментарий</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Дополнительная информация" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex justify-between items-center pt-2">
                <div>
                  <div className="text-sm font-medium">
                    Итого: <span className="text-lg font-semibold">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createAppointment.isPending || updateAppointment.isPending}
                  >
                    {(createAppointment.isPending || updateAppointment.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      "Сохранить"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
