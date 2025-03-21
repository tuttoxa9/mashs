import React from "react";

interface RequireAuthProps {
  children: React.ReactNode;
}

// Временно отключаем проверку авторизации в компоненте RequireAuth
export default function RequireAuth({ children }: RequireAuthProps) {
  // Просто рендерим дочерние элементы без проверки
  return <>{children}</>;
}
