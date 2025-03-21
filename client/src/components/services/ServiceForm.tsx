import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertServiceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId?: number;
}

const serviceFormSchema = insertServiceSchema.extend({
  price: z.coerce.number().min(0, "Цена не может быть отрицательной"),
  durationMinutes: z.coerce.number().min(5, "Минимальная длительность 5 минут"),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export default function ServiceForm({ isOpen, onClose, serviceId }: ServiceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!serviceId;
  
  // Fetch service data if editing
  const { data: serviceData, isLoading: serviceLoading } = useQuery({
    queryKey: ['/api/services', serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const res = await fetch(`/api/services/${serviceId}`);
      if (!res.ok) throw new Error('Не удалось загрузить данные услуги');
      return res.json();
    },
    enabled: isOpen && isEditing,
  });
  
  // Create form
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      durationMinutes: 30,
      active: true,
    }
  });
  
  // Fill form with service data when editing
  useEffect(() => {
    if (serviceData) {
      form.reset(serviceData);
    }
  }, [serviceData, form]);
  
  // Create service mutation
  const createService = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      return await apiRequest('POST', '/api/services', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: "Услуга создана",
        description: "Услуга успешно добавлена в систему",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать услугу",
        variant: "destructive",
      });
    }
  });
  
  // Update service mutation
  const updateService = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      return await apiRequest('PUT', `/api/services/${serviceId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: "Услуга обновлена",
        description: "Данные услуги успешно обновлены",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить данные услуги",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: ServiceFormValues) => {
    if (isEditing) {
      updateService.mutate(data);
    } else {
      createService.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold text-lg">
            {isEditing ? "Редактировать услугу" : "Добавить услугу"}
          </DialogTitle>
        </DialogHeader>
        
        {(serviceLoading && isEditing) ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Загрузка данных...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название услуги</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: Комплексная мойка" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Описание услуги" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цена (руб.)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="10" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Длительность (мин.)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="5"
                          step="5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Активна</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Услуга доступна для выбора при создании записи
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
                  disabled={createService.isPending || updateService.isPending}
                >
                  {(createService.isPending || updateService.isPending) ? (
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
