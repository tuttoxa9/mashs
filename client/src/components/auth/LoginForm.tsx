import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "./AuthProvider";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password);
      setLocation("/");
    } catch (error) {
      console.error("Ошибка авторизации:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-primary text-white">
        <div className="flex items-center">
          <span className="material-icons mr-2">local_car_wash</span>
          <CardTitle className="font-heading font-semibold text-lg">АвтоМойка</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2 className="text-2xl font-heading font-bold text-gray-800 mb-6">Вход в систему</h2>
          
          <div className="mb-4">
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email или имя пользователя
            </Label>
            <Input
              id="email"
              type="text"
              {...register("email")}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Checkbox id="rememberMe" {...register("rememberMe")} className="mr-2" />
              <Label htmlFor="rememberMe" className="text-sm text-gray-600">
                Запомнить меня
              </Label>
            </div>
            <a href="#" className="text-sm text-primary hover:text-primary-dark">
              Забыли пароль?
            </a>
          </div>
          
          <Button
            type="submit"
            className="w-full py-2 bg-primary text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              "Войти"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
