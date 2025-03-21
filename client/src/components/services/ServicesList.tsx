import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Service } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { MoreVertical, Edit, Trash2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ServiceForm from "./ServiceForm";

export default function ServicesList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  
  // Fetch services
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Не удалось загрузить список услуг');
      return res.json();
    }
  });
  
  // Delete service mutation
  const deleteService = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/services/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: "Услуга удалена",
        description: "Услуга успешно удалена из системы",
      });
      setServiceToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить услугу",
        variant: "destructive",
      });
      setServiceToDelete(null);
    }
  });
  
  // Toggle service active status
  const toggleServiceActive = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: boolean }) => {
      const service = services.find((s: Service) => s.id === id);
      if (!service) throw new Error('Услуга не найдена');
      
      return await apiRequest('PUT', `/api/services/${id}`, {
        ...service,
        active
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось изменить статус услуги",
        variant: "destructive",
      });
    }
  });
  
  const handleAddService = () => {
    setSelectedService(null);
    setServiceFormOpen(true);
  };
  
  const handleEditService = (id: number) => {
    setSelectedService(id);
    setServiceFormOpen(true);
  };
  
  const handleDeleteService = (id: number) => {
    setServiceToDelete(id);
  };
  
  const confirmDeleteService = () => {
    if (serviceToDelete) {
      deleteService.mutate(serviceToDelete);
    }
  };
  
  const handleToggleActive = (id: number, active: boolean) => {
    toggleServiceActive.mutate({ id, active });
  };
  
  const closeServiceForm = () => {
    setServiceFormOpen(false);
    setSelectedService(null);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">Услуги</CardTitle>
          <Skeleton className="h-10 w-36" />
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Длительность</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-52" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Услуги</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Не удалось загрузить список услуг</h3>
          <p className="text-gray-500 mt-2">Пожалуйста, попробуйте позже</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">Услуги</CardTitle>
          <Button onClick={handleAddService}>
            <span className="material-icons text-sm mr-1">add</span>
            Добавить услугу
          </Button>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Длительность</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services && services.length > 0 ? (
                    services.map((service: Service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{service.description || "-"}</TableCell>
                        <TableCell>{formatCurrency(service.price)}</TableCell>
                        <TableCell>{service.durationMinutes} мин.</TableCell>
                        <TableCell>
                          <Switch
                            checked={service.active}
                            onCheckedChange={(checked) => handleToggleActive(service.id, checked)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditService(service.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteService(service.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        Нет услуг в системе
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Service Form Modal */}
      {serviceFormOpen && (
        <ServiceForm 
          isOpen={serviceFormOpen} 
          onClose={closeServiceForm} 
          serviceId={selectedService || undefined}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Услуга будет безвозвратно удалена из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteService}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
