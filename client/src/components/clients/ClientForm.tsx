import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertClientSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: number;
}

const clientFormSchema = insertClientSchema.extend({
  phone: z.string().min(1, "Введите номер телефона"),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function ClientForm({ isOpen, onClose, clientId }: ClientFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!clientId;
  
  // Fetch client data if editing
  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ['/api/clients', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await fetch(`/api/clients/${clientId}`);
      if (!res.ok) throw new Error('Не удалось загрузить данные клиента');
      return res.json();
    },
    enabled: isOpen && isEditing,
  });
  
  // Create form
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      surname: "",
      phone: "",
      email: "",
    }
  });
  
  // Fill form with client data when editing
  useEffect(() => {
    if (clientData) {
      form.reset(clientData);
    }
  }, [clientData, form]);
  
  // Create client mutation
  const createClient = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      return await apiRequest('POST', '/api/clients', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Клиент создан",
        description: "Клиент успешно добавлен в систему",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать клиента",
        variant: "destructive",
      });
    }
  });
  
  // Update client mutation
  const updateClient = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      return await apiRequest('PUT', `/api/clients/${clientId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Клиент обновлен",
        description: "Данные клиента успешно обновлены",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить данные клиента",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: ClientFormValues) => {
    if (isEditing) {
      updateClient.mutate(data);
    } else {
      createClient.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading font-semibold text-lg">
            {isEditing ? "Редактировать клиента" : "Добавить клиента"}
          </DialogTitle>
        </DialogHeader>
        
        {(clientLoading && isEditing) ? (
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон *</FormLabel>
                    <FormControl>
                      <Input placeholder="+7 (XXX) XXX-XX-XX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
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
                  disabled={createClient.isPending || updateClient.isPending}
                >
                  {(createClient.isPending || updateClient.isPending) ? (
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
