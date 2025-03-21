import { useState, useEffect } from "react";
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
import { AlertCircle, CheckCircle2, Loader2, Info, Copy, ExternalLink } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "@/lib/firebase";
import { formatBelarusPhone } from "@/lib/utils";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { checkFirestoreAccess, getFirestoreRulesInstructions, initializeFirestoreStructure } from "@/lib/firestoreRules";
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
  const [firebaseStatus, setFirebaseStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  
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
  
  // Проверка подключения к Firebase и базовые настройки
  const checkFirebaseConnection = async () => {
    setFirebaseStatus('loading');
    try {
      // Сначала проверяем доступ к Firestore
      const hasAccess = await checkFirestoreAccess();
      
      if (hasAccess) {
        // Если успешно, пытаемся инициализировать структуру базы данных
        await initializeFirestoreStructure();
        setFirebaseStatus('connected');
        
        toast({
          title: "Firebase подключен",
          description: "Соединение с Firebase успешно установлено.",
        });
      } else {
        setFirebaseStatus('error');
        
        toast({
          title: "Ошибка подключения к Firebase",
          description: "Не удалось подключиться к Firebase. Проверьте правила доступа в консоли Firebase.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking Firebase connection:", error);
      setFirebaseStatus('error');
      
      toast({
        title: "Ошибка подключения к Firebase",
        description: "Не удалось подключиться к Firebase. Проверьте настройки и параметры доступа.",
        variant: "destructive",
      });
    }
  };
  
  // Копирование инструкций по настройке правил безопасности в буфер обмена
  const copyFirestoreRules = () => {
    const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Для тестирования разрешаем полный доступ
    // ВНИМАНИЕ: Это временное решение только для разработки!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;
    
    navigator.clipboard.writeText(rules).then(() => {
      toast({
        title: "Скопировано в буфер обмена",
        description: "Правила безопасности Firebase скопированы в буфер обмена.",
      });
    }).catch(err => {
      console.error("Ошибка при копировании: ", err);
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать правила в буфер обмена.",
        variant: "destructive",
      });
    });
  };
  
  // При открытии вкладки системных настроек выполняем проверку
  useEffect(() => {
    if (selectedTab === 'system') {
      checkFirebaseConnection();
    }
  }, [selectedTab]);

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
                  &copy; 2023-2025 Все права защищены
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Firebase интеграция</h3>
                
                {firebaseStatus === 'loading' && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <p className="text-sm">
                      Проверка подключения к Firebase...
                    </p>
                  </div>
                )}
                
                {firebaseStatus === 'connected' && (
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">
                        Firebase успешно подключен
                      </p>
                      <p className="text-xs">
                        Все функции системы доступны
                      </p>
                    </div>
                  </div>
                )}
                
                {firebaseStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">
                        Ошибка подключения к Firebase
                      </p>
                      <p className="text-xs">
                        Проверьте настройки доступа в Firebase Console и убедитесь, что правила безопасности настроены правильно
                      </p>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={checkFirebaseConnection} 
                  className="mt-2"
                  disabled={firebaseStatus === 'loading'}
                >
                  {firebaseStatus === 'loading' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Проверка...
                    </>
                  ) : (
                    "Проверить соединение"
                  )}
                </Button>
                
                {firebaseStatus === 'error' && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-white border rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center">
                          <Info className="h-4 w-4 mr-2 text-blue-500" />
                          Инструкция по настройке правил безопасности Firebase
                        </h4>
                        <Button
                          onClick={copyFirestoreRules}
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Копировать правила
                        </Button>
                      </div>
                      
                      <ol className="space-y-2 text-sm text-gray-700 ml-5 list-decimal">
                        <li>Перейдите в <a href="https://console.firebase.google.com/project/wash-33cd8/firestore" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                          Firebase Console
                          <ExternalLink className="h-3 w-3 ml-0.5" />
                        </a></li>
                        <li>Выберите проект <strong>wash-33cd8</strong></li>
                        <li>В левом меню выберите <strong>Firestore Database</strong></li>
                        <li>Перейдите на вкладку <strong>Rules</strong></li>
                        <li>Замените существующие правила на следующие:</li>
                      </ol>
                      
                      <div className="bg-gray-100 rounded-md p-3 mt-2 font-mono text-xs text-gray-800 overflow-x-auto">
                        rules_version = '2';<br/>
                        service cloud.firestore &#123;<br/>
                        &nbsp;&nbsp;match /databases/&#123;database&#125;/documents &#123;<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;// Для тестирования разрешаем полный доступ<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;// ВНИМАНИЕ: Это временное решение только для разработки!<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;match /&#123;document=**&#125; &#123;<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if true;<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;&#125;<br/>
                        &nbsp;&nbsp;&#125;<br/>
                        &#125;
                      </div>
                      
                      <p className="text-xs text-red-600 mt-3 flex items-start">
                        <AlertCircle className="h-3.5 w-3.5 mr-1 mt-0.5 flex-shrink-0" />
                        <span>
                          Внимание! Эти правила разрешают полный доступ к базе данных для всех пользователей.
                          Используйте их только для разработки. В продакшене необходимо настроить более строгие правила безопасности.
                        </span>
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md mt-2">
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
