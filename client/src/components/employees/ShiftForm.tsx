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
import { insertShiftSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ShiftFormProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId?: number;
  employeeId?: number;
  defaultDate?: string;
}

const shiftFormSchema = insertShiftSchema.extend({
  date: z.string().min(1, "Выберите дату"),
  startTime: z.string().min(1, "Выберите время начала"),
  endTime: z.string().min(1, "Выберите время окончания"),
});

type ShiftFormValues = z.infer<typeof shiftFormSchema>;

export default function ShiftForm({ 
  isOpen, 
  onClose, 
  shiftId, 
  employeeId,
  defaultDate
}: ShiftFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!shiftId;
  
  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Не удалось загрузить список сотрудников');
      return res.json();
    },
    enabled: isOpen,
  });
  
  // Fetch shift data if editing
  const { data: shiftData, isLoading: shiftLoading } = useQuery({
    queryKey: ['/api/shifts', shiftId],
    queryFn: async () => {
      if (!shiftId) return null;
      const res = await fetch(`/api/shifts/${shiftId}`);
      if (!res.ok) throw new Error('Не удалось загрузить данные смены');
      return res.json();
    },
    enabled: isOpen && isEditing,
  });
  
  // Create form
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      userId: employeeId || 0,
      date: defaultDate || new Date().toISOString().split('T')[0],
      startTime: "08:00:00",
      endTime: "20:00:00",
      status: "scheduled",
      earnings: 0,
    }
  });
  
  // Fill form with shift data when editing
  useEffect(() => {
    if (shiftData) {
      form.reset(shiftData);
    }
  }, [shiftData, form]);
  
  // Create shift mutation
  const createShift = useMutation({
    mutationFn: async (data: ShiftFormValues) => {
      return await apiRequest('POST', '/api/shifts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Смена создана",
        description: "Смена успешно добавлена в расписание",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать смену",
        variant: "destructive",
      });
    }
  });
  
  // Update shift mutation
  const updateShift = useMutation({
    mutationFn: async (data: ShiftFormValues) => {
      return await apiRequest('PUT', `/api/shifts/${shiftId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Смена обновлена",
        description: "Данные смены успешно обновлены",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить данные смены",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: ShiftFormValues) => {
    if (isEditing) {
      updateShift.mutate(data);
    } else {
      createShift.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold text-lg">
            {isEditing ? "Редактировать смену" : "Добавить смену"}
          </DialogTitle>
        </DialogHeader>
        
        {(shiftLoading && isEditing) ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Загрузка данных...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сотрудник</FormLabel>
                    <Select
                      onValueChange={(value) => form.setValue("userId", parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : undefined}
                      disabled={!!employeeId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите сотрудника" />
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Начало смены</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Конец смены</FormLabel>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Запланирована</SelectItem>
                        <SelectItem value="active">Активна</SelectItem>
                        <SelectItem value="completed">Завершена</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isEditing && (
                <FormField
                  control={form.control}
                  name="earnings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Заработок</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
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
                  disabled={createShift.isPending || updateShift.isPending}
                >
                  {(createShift.isPending || updateShift.isPending) ? (
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
