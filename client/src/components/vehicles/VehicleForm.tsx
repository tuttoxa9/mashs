import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertVehicleSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId?: number;
  clientId?: number;
}

const vehicleFormSchema = insertVehicleSchema.extend({
  make: z.string().min(1, "Введите марку автомобиля"),
  model: z.string().min(1, "Введите модель автомобиля"),
  licensePlate: z.string().min(1, "Введите номер автомобиля"),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export default function VehicleForm({ 
  isOpen, 
  onClose, 
  vehicleId,
  clientId
}: VehicleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!vehicleId;
  
  // Fetch clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Не удалось загрузить список клиентов');
      return res.json();
    },
    enabled: isOpen && !clientId,
  });
  
  // Fetch vehicle data if editing
  const { data: vehicleData, isLoading: vehicleLoading } = useQuery({
    queryKey: ['/api/vehicles', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      if (!res.ok) throw new Error('Не удалось загрузить данные автомобиля');
      return res.json();
    },
    enabled: isOpen && isEditing,
  });
  
  // Current year for year validation
  const currentYear = new Date().getFullYear();
  
  // Create form
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      clientId: clientId || 0,
      make: "",
      model: "",
      year: currentYear,
      color: "",
      licensePlate: "",
    }
  });
  
  // Fill form with vehicle data when editing
  useEffect(() => {
    if (vehicleData) {
      form.reset(vehicleData);
    }
  }, [vehicleData, form]);
  
  // Create vehicle mutation
  const createVehicle = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      return await apiRequest('POST', '/api/vehicles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'vehicles'] });
      }
      toast({
        title: "Автомобиль добавлен",
        description: "Автомобиль успешно добавлен в систему",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить автомобиль",
        variant: "destructive",
      });
    }
  });
  
  // Update vehicle mutation
  const updateVehicle = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      return await apiRequest('PUT', `/api/vehicles/${vehicleId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      if (clientId || (vehicleData && vehicleData.clientId)) {
        const cId = clientId || vehicleData.clientId;
        queryClient.invalidateQueries({ queryKey: ['/api/clients', cId, 'vehicles'] });
      }
      toast({
        title: "Автомобиль обновлен",
        description: "Данные автомобиля успешно обновлены",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить данные автомобиля",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: VehicleFormValues) => {
    if (isEditing) {
      updateVehicle.mutate(data);
    } else {
      createVehicle.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold text-lg">
            {isEditing ? "Редактировать автомобиль" : "Добавить автомобиль"}
          </DialogTitle>
        </DialogHeader>
        
        {(vehicleLoading && isEditing) ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Загрузка данных...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!clientId && (
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клиент</FormLabel>
                      <Select
                        onValueChange={(value) => form.setValue("clientId", parseInt(value))}
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
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Марка</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota, BMW, Audi..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Модель</FormLabel>
                      <FormControl>
                        <Input placeholder="Camry, X5, A6..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Год выпуска</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1900" 
                          max={currentYear}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цвет</FormLabel>
                      <FormControl>
                        <Input placeholder="Белый, Черный, Синий..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Гос. номер</FormLabel>
                    <FormControl>
                      <Input placeholder="А123БВ77" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                >
                  Отмена
                </Button>
                <Button 
                  type="submit"
                  disabled={createVehicle.isPending || updateVehicle.isPending}
                >
                  {(createVehicle.isPending || updateVehicle.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    "Сохранить"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
