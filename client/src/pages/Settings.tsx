import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const profileFormSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  surname: z.string().min(2, "Фамилия должна содержать минимум 2 символа"),
  email: z.string().email("Введите корректный email"),
  phone: z.string().optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль"),
  newPassword: z.string().min(6, "Новый пароль должен содержать минимум 6 символов"),
  confirmPassword: z.string().min(6, "Подтверждение пароля должно содержать минимум 6 символов"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

const notificationsSchema = z.object({
  appointmentCreated: z.boolean().default(true),
  appointmentUpdated: z.boolean().default(true),
  appointmentCancelled: z.boolean().default(true),
  daily: z.boolean().default(false),
  email: z.boolean().default(false),
  browser: z.boolean().default(true),
});

export default function Settings() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("profile");
  
  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userData?.name || "",
      surname: userData?.surname || "",
      email: userData?.email || user?.email || "",
      phone: userData?.phone || "",
    },
  });
  
  // Security form
  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Notifications form
  const notificationsForm = useForm<z.infer<typeof notificationsSchema>>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      appointmentCreated: true,
      appointmentUpdated: true,
      appointmentCancelled: true,
      daily: false,
      email: false,
      browser: true,
    },
  });
  
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    // In a real app, call API to update profile
    toast({
      title: "Профиль обновлен",
      description: "Ваши данные успешно обновлены",
    });
  };
  
  const onSecuritySubmit = (data: z.infer<typeof securityFormSchema>) => {
    // In a real app, call API to update password
    toast({
      title: "Пароль изменен",
      description: "Ваш пароль успешно изменен",
    });
    securityForm.reset();
  };
  
  const onNotificationsSubmit = (data: z.infer<typeof notificationsSchema>) => {
    // In a real app, call API to update notification preferences
    toast({
      title: "Настройки уведомлений обновлены",
      description: "Ваши предпочтения уведомлений сохранены",
    });
  };

  return (
    <AppLayout title="Настройки">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
          <TabsTrigger value="system">Система</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Профиль</CardTitle>
              <CardDescription>
                Управляйте информацией вашего профиля
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имя</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="surname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Фамилия</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit">Сохранить изменения</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Безопасность</CardTitle>
              <CardDescription>
                Управляйте настройками безопасности вашего аккаунта
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Текущий пароль</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={securityForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Новый пароль</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={securityForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Подтвердите пароль</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit">Изменить пароль</Button>
                </form>
              </Form>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Сеансы</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Текущий сеанс</p>
                        <p className="text-sm text-gray-500">Последний вход: сегодня, {new Date().toLocaleTimeString('ru-RU')}</p>
                      </div>
                      <div className="text-green-600 text-sm font-medium">Активен</div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">Завершить все другие сеансы</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Уведомления</CardTitle>
              <CardDescription>
                Настройте параметры уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Типы уведомлений</h3>
                    
                    <FormField
                      control={notificationsForm.control}
                      name="appointmentCreated"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Создание записи</FormLabel>
                            <FormDescription>
                              Уведомления о новых записях
                            </FormDescription>
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
                    
                    <FormField
                      control={notificationsForm.control}
                      name="appointmentUpdated"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Изменение записи</FormLabel>
                            <FormDescription>
                              Уведомления об изменениях в существующих записях
                            </FormDescription>
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
                    
                    <FormField
                      control={notificationsForm.control}
                      name="appointmentCancelled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Отмена записи</FormLabel>
                            <FormDescription>
                              Уведомления об отмене записей
                            </FormDescription>
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
                    
                    <FormField
                      control={notificationsForm.control}
                      name="daily"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Ежедневный отчет</FormLabel>
                            <FormDescription>
                              Получать ежедневный сводный отчет
                            </FormDescription>
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
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Способы уведомлений</h3>
                    
                    <FormField
                      control={notificationsForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email</FormLabel>
                            <FormDescription>
                              Получать уведомления по электронной почте
                            </FormDescription>
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
                    
                    <FormField
                      control={notificationsForm.control}
                      name="browser"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">В браузере</FormLabel>
                            <FormDescription>
                              Показывать уведомления в приложении
                            </FormDescription>
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
                  </div>
                  
                  <Button type="submit">Сохранить настройки</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Системные настройки</CardTitle>
              <CardDescription>
                Общие настройки системы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">О системе</h3>
                <p className="text-sm text-gray-500">
                  Автомойка - Система управления v1.0.0
                </p>
                <p className="text-sm text-gray-500">
                  &copy; 2023 Все права защищены
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Firebase интеграция</h3>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md">
                  <p className="text-sm">
                    Для полноценной работы системы необходимо настроить проект Firebase.
                    Пожалуйста, убедитесь, что все необходимые переменные окружения указаны в настройках проекта.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Сброс системы</h3>
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md">
                  <p className="text-sm">
                    Эта операция сбросит все настройки системы и удалит все данные. Данное действие необратимо.
                  </p>
                </div>
                <Button variant="destructive">Сбросить систему</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
