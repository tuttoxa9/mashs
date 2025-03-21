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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Vehicle } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { MoreVertical, Edit, Trash2, Calendar, AlertCircle, Search } from "lucide-react";
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
import VehicleForm from "./VehicleForm";

interface VehiclesListProps {
  clientId?: number;
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

export default function VehiclesList({ clientId, onVehicleSelect }: VehiclesListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch vehicles
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: clientId ? ['/api/clients', clientId, 'vehicles'] : ['/api/vehicles'],
    queryFn: async () => {
      const url = clientId ? `/api/clients/${clientId}/vehicles` : '/api/vehicles';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Не удалось загрузить список автомобилей');
      return res.json();
    }
  });
  
  // Delete vehicle mutation
  const deleteVehicle = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/vehicles/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: ['/api/clients', clientId, 'vehicles'] });
      }
      toast({
        title: "Автомобиль удален",
        description: "Автомобиль успешно удален из системы",
      });
      setVehicleToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить автомобиль",
        variant: "destructive",
      });
      setVehicleToDelete(null);
    }
  });
  
  const handleAddVehicle = () => {
    setSelectedVehicle(null);
    setVehicleFormOpen(true);
  };
  
  const handleEditVehicle = (id: number) => {
    setSelectedVehicle(id);
    setVehicleFormOpen(true);
  };
  
  const handleDeleteVehicle = (id: number) => {
    setVehicleToDelete(id);
  };
  
  const confirmDeleteVehicle = () => {
    if (vehicleToDelete) {
      deleteVehicle.mutate(vehicleToDelete);
    }
  };
  
  const handleSelect = (vehicle: Vehicle) => {
    if (onVehicleSelect) {
      onVehicleSelect(vehicle);
    }
  };
  
  const closeVehicleForm = () => {
    setVehicleFormOpen(false);
    setSelectedVehicle(null);
  };
  
  // Filter vehicles based on search query
  const filteredVehicles = vehicles
    ? vehicles.filter((vehicle: Vehicle) => {
        const makeModel = `${vehicle.make} ${vehicle.model}`.toLowerCase();
        const licensePlate = vehicle.licensePlate.toLowerCase();
        const color = (vehicle.color || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return makeModel.includes(query) || licensePlate.includes(query) || color.includes(query);
      })
    : [];
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">Автомобили</CardTitle>
          <Skeleton className="h-10 w-36" />
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="border rounded-md">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Марка и модель</TableHead>
                    <TableHead>Гос. номер</TableHead>
                    <TableHead>Год выпуска</TableHead>
                    <TableHead>Цвет</TableHead>
                    <TableHead className="text-right w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
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
          <CardTitle>Автомобили</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Не удалось загрузить список автомобилей</h3>
          <p className="text-gray-500 mt-2">Пожалуйста, попробуйте позже</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">
            {clientId ? "Автомобили клиента" : "Автомобили"}
          </CardTitle>
          <Button onClick={handleAddVehicle}>
            <span className="material-icons text-sm mr-1">add</span>
            Добавить автомобиль
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Поиск по марке, модели или гос. номеру"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="border rounded-md">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Марка и модель</TableHead>
                    <TableHead>Гос. номер</TableHead>
                    <TableHead>Год выпуска</TableHead>
                    <TableHead>Цвет</TableHead>
                    <TableHead className="text-right w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length > 0 ? (
                    filteredVehicles.map((vehicle: Vehicle) => (
                      <TableRow 
                        key={vehicle.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSelect(vehicle)}
                      >
                        <TableCell className="font-medium">
                          {vehicle.make} {vehicle.model}
                        </TableCell>
                        <TableCell>{vehicle.licensePlate}</TableCell>
                        <TableCell>{vehicle.year || "-"}</TableCell>
                        <TableCell>{vehicle.color || "-"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEditVehicle(vehicle.id);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                // Navigate to vehicle's appointments
                              }}>
                                <Calendar className="h-4 w-4 mr-2" />
                                История обслуживания
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVehicle(vehicle.id);
                                }}
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
                      <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                        {searchQuery 
                          ? "Нет автомобилей, соответствующих поисковому запросу" 
                          : "Нет автомобилей"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Vehicle Form Modal */}
      {vehicleFormOpen && (
        <VehicleForm 
          isOpen={vehicleFormOpen} 
          onClose={closeVehicleForm} 
          vehicleId={selectedVehicle || undefined}
          clientId={clientId}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!vehicleToDelete} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Автомобиль и все связанные с ним данные будут безвозвратно удалены из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteVehicle}
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
