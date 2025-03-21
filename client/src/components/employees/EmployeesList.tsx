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
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { MoreVertical, Edit, Trash2, FileBarChart2, AlertCircle } from "lucide-react";
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
import EmployeeForm from "./EmployeeForm";

interface EmployeesListProps {
  onEmployeeSelect?: (employee: User) => void;
}

export default function EmployeesList({ onEmployeeSelect }: EmployeesListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
  
  // Fetch employees
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Не удалось загрузить список сотрудников');
      return res.json();
    }
  });
  
  // Delete employee mutation
  const deleteEmployee = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/users/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Сотрудник удален",
        description: "Сотрудник успешно удален из системы",
      });
      setEmployeeToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить сотрудника",
        variant: "destructive",
      });
      setEmployeeToDelete(null);
    }
  });
  
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setEmployeeFormOpen(true);
  };
  
  const handleEditEmployee = (id: number) => {
    setSelectedEmployee(id);
    setEmployeeFormOpen(true);
  };
  
  const handleDeleteEmployee = (id: number) => {
    setEmployeeToDelete(id);
  };
  
  const confirmDeleteEmployee = () => {
    if (employeeToDelete) {
      deleteEmployee.mutate(employeeToDelete);
    }
  };
  
  const handleSelect = (employee: User) => {
    if (onEmployeeSelect) {
      onEmployeeSelect(employee);
    }
  };
  
  const closeEmployeeForm = () => {
    setEmployeeFormOpen(false);
    setSelectedEmployee(null);
  };
  
  const getRoleText = (role: string) => {
    return role === 'admin' ? 'Администратор' : 'Сотрудник';
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">Сотрудники</CardTitle>
          <Skeleton className="h-10 w-36" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>ФИО</TableHead>
                    <TableHead>Должность</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead className="text-right w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
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
          <CardTitle>Сотрудники</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Не удалось загрузить список сотрудников</h3>
          <p className="text-gray-500 mt-2">Пожалуйста, попробуйте позже</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-heading">Сотрудники</CardTitle>
          <Button onClick={handleAddEmployee}>
            <span className="material-icons text-sm mr-1">add</span>
            Добавить сотрудника
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>ФИО</TableHead>
                    <TableHead>Должность</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead className="text-right w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees && employees.length > 0 ? (
                    employees.map((employee: User) => (
                      <TableRow 
                        key={employee.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSelect(employee)}
                      >
                        <TableCell>
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="font-heading text-sm">
                              {getInitials(employee.name, employee.surname)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {employee.name} {employee.surname}
                        </TableCell>
                        <TableCell>{getRoleText(employee.role)}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.phone || "-"}</TableCell>
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
                                handleEditEmployee(employee.id);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                // Navigate to employee report
                              }}>
                                <FileBarChart2 className="h-4 w-4 mr-2" />
                                Отчет
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEmployee(employee.id);
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
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        Нет сотрудников
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Employee Form Modal */}
      {employeeFormOpen && (
        <EmployeeForm 
          isOpen={employeeFormOpen} 
          onClose={closeEmployeeForm} 
          employeeId={selectedEmployee || undefined}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!employeeToDelete} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Сотрудник будет безвозвратно удален из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEmployee}
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
