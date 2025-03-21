import { ReactNode } from "react";

interface StatCardProps {
  icon: string;
  iconBgColor: string;
  iconColor: string;
  title: string;
  value: string | number;
}

export default function StatCard({ icon, iconBgColor, iconColor, title, value }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center">
      <div className={`rounded-full ${iconBgColor} w-12 h-12 flex items-center justify-center mr-4`}>
        <span className={`material-icons ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-heading font-semibold">{value}</p>
      </div>
    </div>
  );
}
