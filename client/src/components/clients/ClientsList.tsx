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
import { Client } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { MoreVertical, Edit, Trash2, Car, Calendar, AlertCircle, Search } from "lucide-react";
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
import ClientForm from "./ClientForm";

interface ClientsListProps {
  onClientSelect?: (client: Client) => void;
}

export default function ClientsList({ onClientSelect }: ClientsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch clients
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Не удалось загрузить список клиентов');
      return res.json();
    }
  });
  
  // Delete client mutation
  const deleteClient = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/clients/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Клиент удален",
        description: "Клиент успешно удален из системы",
      });
      setClientToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить клиента",
        variant: "destructive",
      });
      setClientToDelete(null);
    }
  });
  
  const handleAddClient = () => {
    setSelectedClient(null);
    setClientFormOpen(true);
  };
  
  const handleEditClient = (id: number) => {
    setSelectedClient(id);
    setClientFormOpen(true);
  };
  
  const handleDeleteClient = (id: number) => {
    setClientToDelete(id);
  };
  
  const confirmDeleteClient = () => {
    if (clientToDelete) {
      deleteClient.mutate(clientToDelete);
    }
  };
  
  const handleSelect = (client: Client) => {
    if (onClientSelect) {
      onClientSelect(client);
    }
  };
  
  const closeClientForm = () => {
    setClientFormOpen(false);
    setSelectedClient(null);
  };
  
  // Filter clients based on search query
  const filteredClients = clients
    ? clients.filter((client: Client) => {
        const fullName = `${client.name} ${client.surname}`.toLowerCase();
        const phone = client.phone.toLowerCase();
        const email = (client.email || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return fullName.includes(query) || phone.includes(query) || email.includes(query);
      })
    : [];
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">Клиенты</CardTitle>
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
                    <TableHead>ФИО</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Дата регистрации</TableHead>
                    <TableHead className="text-right w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
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
          <CardTitle>Клиенты</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Не удалось загрузить список клиентов</h3>
          <p className="text-gray-500 mt-2">Пожалуйста, попробуйте позже</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">Клиенты</CardTitle>
          <Button onClick={handleAddClient}>
            <span className="material-icons text-sm mr-1">add</span>
            Добавить клиента
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Поиск по имени, телефону или email"
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
                    <TableHead>ФИО</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Дата регистрации</TableHead>
                    <TableHead className="text-right w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client: Client) => (
                      <TableRow 
                        key={client.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSelect(client)}
                      >
                        <TableCell className="font-medium">
                          {client.name} {client.surname}
                        </TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>{client.email || "-"}</TableCell>
                        <TableCell>
                          {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                        </TableCell>
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
                                handleEditClient(client.id);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                // Navigate to client's vehicles
                              }}>
                                <Car className="h-4 w-4 mr-2" />
                                Автомобили
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                // Navigate to client's appointments
                              }}>
                                <Calendar className="h-4 w-4 mr-2" />
                                История записей
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClient(client.id);
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
                          ? "Нет клиентов, соответствующих поисковому запросу" 
                          : "Нет клиентов"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Client Form Modal */}
      {clientFormOpen && (
        <ClientForm 
          isOpen={clientFormOpen} 
          onClose={closeClientForm} 
          clientId={selectedClient || undefined}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Клиент и все связанные с ним данные будут безвозвратно удалены из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteClient}
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
