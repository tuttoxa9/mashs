import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  DocumentReference,
  CollectionReference,
  Query,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { 
  User,
  Client,
  Vehicle,
  Service,
  Shift,
  Appointment,
  AppointmentService,
  Notification
} from '@shared/schema';

// Типы для конвертеров Firestore
interface FirestoreDataConverter<T> {
  toFirestore(modelObject: T): DocumentData;
  fromFirestore(snapshot: QueryDocumentSnapshot): T;
}

// Базовый класс для работы с Firestore
export class FirestoreService<T extends { id: number }> {
  protected collectionName: string;
  protected converter: FirestoreDataConverter<T>;

  constructor(collectionName: string, converter: FirestoreDataConverter<T>) {
    this.collectionName = collectionName;
    this.converter = converter;
  }

  // Получить ссылку на коллекцию
  protected getCollectionRef(): CollectionReference<T> {
    return collection(db, this.collectionName).withConverter(this.converter);
  }

  // Получить ссылку на документ
  protected getDocRef(id: number): DocumentReference<T> {
    return doc(db, this.collectionName, id.toString()).withConverter(this.converter);
  }

  // Получить все документы
  async getAll(): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(this.getCollectionRef());
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error(`Error getting all ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Получить документ по ID
  async getById(id: number): Promise<T | undefined> {
    try {
      const docSnapshot = await getDoc(this.getDocRef(id));
      return docSnapshot.exists() ? docSnapshot.data() : undefined;
    } catch (error) {
      console.error(`Error getting ${this.collectionName} by id:`, error);
      throw error;
    }
  }

  // Создать новый документ
  async create(data: Omit<T, 'id'>): Promise<T> {
    try {
      // Создаем числовой ID на основе хеша UUID
      const numericId = parseInt(uuidv4().replace(/-/g, '').substring(0, 8), 16);
      
      // Добавляем ID и timestamp createdAt
      const newData = {
        ...data,
        id: numericId,
        createdAt: new Date().toISOString()
      } as unknown as T;
      
      // Сохраняем документ с ID в качестве ключа
      await setDoc(this.getDocRef(numericId), newData);
      return newData;
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Обновить документ
  async update(id: number, data: Partial<T>): Promise<T | undefined> {
    try {
      const docRef = this.getDocRef(id);
      const docSnapshot = await getDoc(docRef);
      
      if (!docSnapshot.exists()) {
        console.error(`${this.collectionName} with id ${id} not found`);
        return undefined;
      }
      
      const existingData = docSnapshot.data();
      const updatedData = { ...existingData, ...data } as T;
      
      await updateDoc(docRef, updatedData as any);
      return updatedData;
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error);
      throw error;
    }
  }

  // Удалить документ
  async delete(id: number): Promise<boolean> {
    try {
      const docRef = this.getDocRef(id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      throw error;
    }
  }
  
  // Получить документы по условию
  async query(conditions: Array<{field: string, operator: "=="|"!="|">"|"<"|">="|"<=", value: any}>, 
              sortField?: string, 
              sortDirection?: 'asc'|'desc', 
              limitCount?: number): Promise<T[]> {
    try {
      let q: Query = this.getCollectionRef();
      
      // Добавляем условия
      conditions.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
      
      // Добавляем сортировку
      if (sortField) {
        q = query(q, orderBy(sortField, sortDirection || 'asc'));
      }
      
      // Добавляем лимит
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error(`Error querying ${this.collectionName}:`, error);
      throw error;
    }
  }
}

// Конвертеры для каждой сущности
// Конвертер для User
const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      role: user.role,
      createdAt: user.createdAt,
      phone: user.phone || null
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): User {
    const data = snapshot.data();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      surname: data.surname,
      role: data.role,
      createdAt: data.createdAt,
      phone: data.phone || ""
    };
  }
};

// Конвертер для Client
const clientConverter: FirestoreDataConverter<Client> = {
  toFirestore(client: Client): DocumentData {
    return {
      id: client.id,
      name: client.name,
      surname: client.surname,
      email: client.email || null,
      phone: client.phone,
      createdAt: client.createdAt
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Client {
    const data = snapshot.data();
    return {
      id: data.id,
      name: data.name,
      surname: data.surname,
      email: data.email || null,
      phone: data.phone,
      createdAt: data.createdAt
    };
  }
};

// Конвертер для Vehicle
const vehicleConverter: FirestoreDataConverter<Vehicle> = {
  toFirestore(vehicle: Vehicle): DocumentData {
    return {
      id: vehicle.id,
      clientId: vehicle.clientId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year || null,
      licensePlate: vehicle.licensePlate,
      color: vehicle.color || null,
      createdAt: vehicle.createdAt
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Vehicle {
    const data = snapshot.data();
    return {
      id: data.id,
      clientId: data.clientId,
      make: data.make,
      model: data.model,
      year: data.year || null,
      licensePlate: data.licensePlate,
      color: data.color || null,
      createdAt: data.createdAt
    };
  }
};

// Конвертер для Service
const serviceConverter: FirestoreDataConverter<Service> = {
  toFirestore(service: Service): DocumentData {
    return {
      id: service.id,
      name: service.name,
      description: service.description || null,
      price: service.price,
      durationMinutes: service.durationMinutes,
      active: service.active
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Service {
    const data = snapshot.data();
    return {
      id: data.id,
      name: data.name,
      description: data.description || null,
      price: data.price,
      durationMinutes: data.durationMinutes,
      active: data.active
    };
  }
};

// Конвертер для Shift
const shiftConverter: FirestoreDataConverter<Shift> = {
  toFirestore(shift: Shift): DocumentData {
    return {
      id: shift.id,
      date: shift.date,
      userId: shift.userId,
      startTime: shift.startTime,
      endTime: shift.endTime,
      status: shift.status,
      earnings: shift.earnings || null
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Shift {
    const data = snapshot.data();
    return {
      id: data.id,
      date: data.date,
      userId: data.userId,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status,
      earnings: data.earnings || null
    };
  }
};

// Конвертер для Appointment
const appointmentConverter: FirestoreDataConverter<Appointment> = {
  toFirestore(appointment: Appointment): DocumentData {
    return {
      id: appointment.id,
      date: appointment.date,
      clientId: appointment.clientId,
      userId: appointment.userId || null,
      startTime: appointment.startTime,
      endTime: appointment.endTime || null,
      status: appointment.status,
      vehicleId: appointment.vehicleId,
      totalPrice: appointment.totalPrice,
      notes: appointment.notes || null,
      createdAt: appointment.createdAt
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Appointment {
    const data = snapshot.data();
    return {
      id: data.id,
      date: data.date,
      clientId: data.clientId,
      userId: data.userId || null,
      startTime: data.startTime,
      endTime: data.endTime || null,
      status: data.status,
      vehicleId: data.vehicleId,
      totalPrice: data.totalPrice,
      notes: data.notes || null,
      createdAt: data.createdAt
    };
  }
};

// Конвертер для AppointmentService
const appointmentServiceConverter: FirestoreDataConverter<AppointmentService> = {
  toFirestore(appointmentService: AppointmentService): DocumentData {
    return {
      id: appointmentService.id,
      appointmentId: appointmentService.appointmentId,
      serviceId: appointmentService.serviceId,
      price: appointmentService.price
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): AppointmentService {
    const data = snapshot.data();
    return {
      id: data.id,
      appointmentId: data.appointmentId,
      serviceId: data.serviceId,
      price: data.price
    };
  }
};

// Конвертер для Notification
const notificationConverter: FirestoreDataConverter<Notification> = {
  toFirestore(notification: Notification): DocumentData {
    return {
      id: notification.id,
      userId: notification.userId,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Notification {
    const data = snapshot.data();
    return {
      id: data.id,
      userId: data.userId,
      message: data.message,
      type: data.type,
      read: data.read,
      createdAt: data.createdAt
    };
  }
};

// Сервисы для работы с сущностями
export const userService = new FirestoreService<User>('users', userConverter);
export const clientService = new FirestoreService<Client>('clients', clientConverter);
export const vehicleService = new FirestoreService<Vehicle>('vehicles', vehicleConverter);
export const serviceService = new FirestoreService<Service>('services', serviceConverter);
export const shiftService = new FirestoreService<Shift>('shifts', shiftConverter);
export const appointmentService = new FirestoreService<Appointment>('appointments', appointmentConverter);
export const appointmentServiceService = new FirestoreService<AppointmentService>('appointment_services', appointmentServiceConverter);
export const notificationService = new FirestoreService<Notification>('notifications', notificationConverter);

// Специальные методы для сущностей
// Методы для Vehicle
export const vehicleMethods = {
  async getByClientId(clientId: number): Promise<Vehicle[]> {
    return await vehicleService.query([{field: 'clientId', operator: '==', value: clientId}]);
  }
};

// Методы для Appointment
export const appointmentMethods = {
  async getByClientId(clientId: number): Promise<Appointment[]> {
    return await appointmentService.query([{field: 'clientId', operator: '==', value: clientId}]);
  },
  
  async getByDate(date: string): Promise<Appointment[]> {
    return await appointmentService.query([{field: 'date', operator: '==', value: date}]);
  },
  
  async getByUserId(userId: number): Promise<Appointment[]> {
    return await appointmentService.query([{field: 'userId', operator: '==', value: userId}]);
  },
  
  async getByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    return await appointmentService.query([
      {field: 'date', operator: '>=', value: startDate},
      {field: 'date', operator: '<=', value: endDate}
    ]);
  }
};

// Методы для AppointmentService
export const appointmentServiceMethods = {
  async getByAppointmentId(appointmentId: number): Promise<AppointmentService[]> {
    return await appointmentServiceService.query([{field: 'appointmentId', operator: '==', value: appointmentId}]);
  }
};

// Методы для Shift
export const shiftMethods = {
  async getByDate(date: string): Promise<Shift[]> {
    return await shiftService.query([{field: 'date', operator: '==', value: date}]);
  },
  
  async getByUserId(userId: number): Promise<Shift[]> {
    return await shiftService.query([{field: 'userId', operator: '==', value: userId}]);
  },
  
  async getByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
    return await shiftService.query([
      {field: 'date', operator: '>=', value: startDate},
      {field: 'date', operator: '<=', value: endDate}
    ]);
  }
};

// Методы для Notification
export const notificationMethods = {
  async getByUserId(userId: number): Promise<Notification[]> {
    return await notificationService.query([{field: 'userId', operator: '==', value: userId}]);
  },
  
  async markAsRead(id: number): Promise<Notification | undefined> {
    return await notificationService.update(id, { read: true });
  },
  
  async markAllAsRead(userId: number): Promise<void> {
    const notifications = await notificationMethods.getByUserId(userId);
    
    for (const notification of notifications) {
      if (!notification.read) {
        await notificationService.update(notification.id, { read: true });
      }
    }
  }
};

// Методы для отчетов
export const reportMethods = {
  // Ежедневный отчет
  async getDailyReport(date: string): Promise<any> {
    try {
      // Получаем все записи за выбранный день
      const appointments = await appointmentMethods.getByDate(date);
      
      // Получаем все смены за выбранный день
      const shifts = await shiftMethods.getByDate(date);
      
      // Получаем всех сотрудников
      const employees = await userService.getAll();
      
      // Собираем статистику по сотрудникам
      const employeeStats = employees
        .filter(employee => employee.role === "employee")
        .map(employee => {
          const employeeAppointments = appointments.filter(app => app.userId === employee.id);
          const completedAppointments = employeeAppointments.filter(app => app.status === "completed");
          const earnings = shifts
            .filter(shift => shift.userId === employee.id)
            .reduce((sum, shift) => sum + (shift.earnings || 0), 0);
          
          return {
            userId: employee.id,
            name: `${employee.name} ${employee.surname}`,
            totalAppointments: employeeAppointments.length,
            completedAppointments: completedAppointments.length,
            earnings: earnings
          };
        });
      
      // Общая статистика
      const totalAppointments = appointments.length;
      const totalRevenue = appointments
        .filter(app => app.status === "completed")
        .reduce((sum, app) => sum + app.totalPrice, 0);
      
      return {
        date,
        totalAppointments,
        totalRevenue,
        employees: employeeStats
      };
    } catch (error) {
      console.error("Error getting daily report:", error);
      throw error;
    }
  },
  
  // Недельный отчет
  async getWeeklyReport(startDate: string): Promise<any> {
    try {
      // Вычисляем конец недели (startDate + 6 дней)
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(endDateObj.getDate() + 6);
      const endDate = endDateObj.toISOString().split('T')[0];
      
      // Получаем все записи за период
      const appointments = await appointmentMethods.getByDateRange(startDate, endDate);
      
      // Получаем все смены за период
      const shifts = await shiftMethods.getByDateRange(startDate, endDate);
      
      // Получаем всех сотрудников
      const employees = await userService.getAll();
      
      // Создаем отчеты по дням
      const dailyReports = [];
      let currentDateObj = new Date(startDate);
      
      while (currentDateObj <= endDateObj) {
        const currentDate = currentDateObj.toISOString().split('T')[0];
        const dailyAppointments = appointments.filter(app => app.date === currentDate);
        const dailyRevenue = dailyAppointments
          .filter(app => app.status === "completed")
          .reduce((sum, app) => sum + app.totalPrice, 0);
        
        dailyReports.push({
          date: currentDate,
          totalAppointments: dailyAppointments.length,
          totalRevenue: dailyRevenue
        });
        
        currentDateObj.setDate(currentDateObj.getDate() + 1);
      }
      
      // Собираем статистику по сотрудникам
      const employeeStats = employees
        .filter(employee => employee.role === "employee")
        .map(employee => {
          const employeeAppointments = appointments.filter(app => app.userId === employee.id);
          const completedAppointments = employeeAppointments.filter(app => app.status === "completed");
          const earnings = shifts
            .filter(shift => shift.userId === employee.id)
            .reduce((sum, shift) => sum + (shift.earnings || 0), 0);
          
          return {
            userId: employee.id,
            name: `${employee.name} ${employee.surname}`,
            totalAppointments: employeeAppointments.length,
            completedAppointments: completedAppointments.length,
            earnings: earnings
          };
        });
      
      // Общая статистика
      const totalAppointments = appointments.length;
      const totalRevenue = appointments
        .filter(app => app.status === "completed")
        .reduce((sum, app) => sum + app.totalPrice, 0);
      
      return {
        startDate,
        endDate,
        totalAppointments,
        totalRevenue,
        employees: employeeStats,
        dailyReports
      };
    } catch (error) {
      console.error("Error getting weekly report:", error);
      throw error;
    }
  },
  
  // Месячный отчет
  async getMonthlyReport(month: number, year: number): Promise<any> {
    try {
      // Формируем даты начала и конца месяца
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
      
      // Получаем все записи за период
      const appointments = await appointmentMethods.getByDateRange(startDate, endDate);
      
      // Получаем все смены за период
      const shifts = await shiftMethods.getByDateRange(startDate, endDate);
      
      // Получаем всех сотрудников
      const employees = await userService.getAll();
      
      // Создаем отчеты по дням
      const dailyReports = [];
      let currentDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      while (currentDateObj <= endDateObj) {
        const currentDate = currentDateObj.toISOString().split('T')[0];
        const dailyAppointments = appointments.filter(app => app.date === currentDate);
        const dailyRevenue = dailyAppointments
          .filter(app => app.status === "completed")
          .reduce((sum, app) => sum + app.totalPrice, 0);
        
        dailyReports.push({
          date: currentDate,
          totalAppointments: dailyAppointments.length,
          totalRevenue: dailyRevenue
        });
        
        currentDateObj.setDate(currentDateObj.getDate() + 1);
      }
      
      // Собираем статистику по сотрудникам
      const employeeStats = employees
        .filter(employee => employee.role === "employee")
        .map(employee => {
          const employeeAppointments = appointments.filter(app => app.userId === employee.id);
          const completedAppointments = employeeAppointments.filter(app => app.status === "completed");
          const earnings = shifts
            .filter(shift => shift.userId === employee.id)
            .reduce((sum, shift) => sum + (shift.earnings || 0), 0);
          
          return {
            userId: employee.id,
            name: `${employee.name} ${employee.surname}`,
            totalAppointments: employeeAppointments.length,
            completedAppointments: completedAppointments.length,
            earnings: earnings
          };
        });
      
      // Общая статистика
      const totalAppointments = appointments.length;
      const totalRevenue = appointments
        .filter(app => app.status === "completed")
        .reduce((sum, app) => sum + app.totalPrice, 0);
      
      return {
        month,
        year,
        startDate,
        endDate,
        totalAppointments,
        totalRevenue,
        employees: employeeStats,
        dailyReports
      };
    } catch (error) {
      console.error("Error getting monthly report:", error);
      throw error;
    }
  },
  
  // Отчет по сотруднику
  async getEmployeeReport(userId: number, startDate: string, endDate: string): Promise<any> {
    try {
      // Получаем данные о сотруднике
      const employee = await userService.getById(userId);
      if (!employee) throw new Error(`Employee with id ${userId} not found`);
      
      // Получаем все записи сотрудника за период
      const appointments = await appointmentService.query([
        {field: 'userId', operator: '==', value: userId},
        {field: 'date', operator: '>=', value: startDate},
        {field: 'date', operator: '<=', value: endDate}
      ]);
      
      // Получаем все смены сотрудника за период
      const shifts = await shiftService.query([
        {field: 'userId', operator: '==', value: userId},
        {field: 'date', operator: '>=', value: startDate},
        {field: 'date', operator: '<=', value: endDate}
      ]);
      
      // Создаем отчеты по дням
      const dailyData = [];
      let currentDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      while (currentDateObj <= endDateObj) {
        const currentDate = currentDateObj.toISOString().split('T')[0];
        const dailyAppointments = appointments.filter(app => app.date === currentDate);
        const completedAppointments = dailyAppointments.filter(app => app.status === "completed");
        const dailyShift = shifts.find(shift => shift.date === currentDate);
        const earnings = dailyShift ? dailyShift.earnings || 0 : 0;
        const revenue = dailyAppointments
          .filter(app => app.status === "completed")
          .reduce((sum, app) => sum + app.totalPrice, 0);
        
        dailyData.push({
          date: currentDate,
          appointments: dailyAppointments.length,
          completedAppointments: completedAppointments.length,
          revenue,
          earnings
        });
        
        currentDateObj.setDate(currentDateObj.getDate() + 1);
      }
      
      // Общая статистика
      const totalAppointments = appointments.length;
      const totalCompletedAppointments = appointments.filter(app => app.status === "completed").length;
      const totalRevenue = appointments
        .filter(app => app.status === "completed")
        .reduce((sum, app) => sum + app.totalPrice, 0);
      const totalEarnings = shifts.reduce((sum, shift) => sum + (shift.earnings || 0), 0);
      
      return {
        employee: {
          id: employee.id,
          name: `${employee.name} ${employee.surname}`,
          email: employee.email,
          role: employee.role
        },
        startDate,
        endDate,
        totalAppointments,
        totalCompletedAppointments,
        totalRevenue,
        totalEarnings,
        dailyData
      };
    } catch (error) {
      console.error("Error getting employee report:", error);
      throw error;
    }
  }
};