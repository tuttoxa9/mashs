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
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: number;
}

const employeeFormSchema = insertUserSchema.extend({
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export default function EmployeeForm({ isOpen, onClose, employeeId }: EmployeeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!employeeId;
  
  // Fetch employee data if editing
  const { data: employeeData, isLoading: employeeLoading } = useQuery({
    queryKey: ['/api/users', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;
      const res = await fetch(`/api/users/${employeeId}`);
      if (!res.ok) throw new Error('Не удалось загрузить данные сотрудника');
      return res.json();
    },
    enabled: isOpen && isEditing,
  });
  
  // Create form
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      email: "",
      name: "",
      surname: "",
      role: "employee",
      password: "",
      confirmPassword: "",
      phone: "",
    }
  });
  
  // Fill form with employee data when editing
  useEffect(() => {
    if (employeeData) {
      form.reset({
        ...employeeData,
        password: "******", // Don't expose real password
        confirmPassword: "******",
      });
    }
  }, [employeeData, form]);
  
  // Create employee mutation
  const createEmployee = useMutation({
    mutationFn: async (data: Omit<EmployeeFormValues, "confirmPassword">) => {
      const { confirmPassword, ...employeeData } = data;
      return await apiRequest('POST', '/api/users', employeeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Сотрудник создан",
        description: "Сотрудник успешно добавлен в систему",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать сотрудника",
        variant: "destructive",
      });
    }
  });
  
  // Update employee mutation
  const updateEmployee = useMutation({
    mutationFn: async (data: Omit<EmployeeFormValues, "confirmPassword">) => {
      const { confirmPassword, ...employeeData } = data;
      
      // Don't update password if it's the placeholder
      if (employeeData.password === "******") {
        const { password, ...dataWithoutPassword } = employeeData;
        return await apiRequest('PUT', `/api/users/${employeeId}`, dataWithoutPassword);
      }
      
      return await apiRequest('PUT', `/api/users/${employeeId}`, employeeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Сотрудник обновлен",
        description: "Данные сотрудника успешно обновлены",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить данные сотрудника",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: EmployeeFormValues) => {
    const { confirmPassword, ...employeeData } = data;
    
    if (isEditing) {
      updateEmployee.mutate(employeeData);
    } else {
      createEmployee.mutate(employeeData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold text-lg">
            {isEditing ? "Редактировать сотрудника" : "Добавить сотрудника"}
          </DialogTitle>
        </DialogHeader>
        
        {(employeeLoading && isEditing) ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Загрузка данных...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input placeholder="Имя" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фамилия</FormLabel>
                      <FormControl>
                        <Input placeholder="Фамилия" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон</FormLabel>
                    <FormControl>
                      <Input placeholder="+7 (XXX) XXX-XX-XX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Роль</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите роль" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Администратор</SelectItem>
                        <SelectItem value="employee">Сотрудник</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Подтверждение пароля</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
                  disabled={createEmployee.isPending || updateEmployee.isPending}
                >
                  {(createEmployee.isPending || updateEmployee.isPending) ? (
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
