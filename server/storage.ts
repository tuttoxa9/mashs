import { 
  User, InsertUser, 
  Client, InsertClient, 
  Vehicle, InsertVehicle, 
  Service, InsertService, 
  Shift, InsertShift, 
  Appointment, InsertAppointment, 
  AppointmentService, InsertAppointmentService, 
  Notification, InsertNotification
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: InsertUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Clients
  getClient(id: number): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: InsertClient): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Vehicles
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getAllVehicles(): Promise<Vehicle[]>;
  getVehiclesByClientId(clientId: number): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: InsertVehicle): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  // Services
  getService(id: number): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: InsertService): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Shifts
  getShift(id: number): Promise<Shift | undefined>;
  getAllShifts(): Promise<Shift[]>;
  getShiftsByDate(date: string): Promise<Shift[]>;
  getShiftsByUserId(userId: number): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: InsertShift): Promise<Shift | undefined>;
  deleteShift(id: number): Promise<boolean>;

  // Appointments
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAllAppointments(): Promise<Appointment[]>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  getAppointmentsByClientId(clientId: number): Promise<Appointment[]>;
  getAppointmentsByUserId(userId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: InsertAppointment): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;

  // Appointment Services
  getAppointmentServices(appointmentId: number): Promise<AppointmentService[]>;
  createAppointmentService(appointmentService: InsertAppointmentService): Promise<AppointmentService>;
  deleteAppointmentService(id: number): Promise<boolean>;

  // Notifications
  getAllNotifications(): Promise<Notification[]>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: number): Promise<void>;

  // Reports
  getDailyReport(date: string): Promise<any>;
  getWeeklyReport(startDate: string): Promise<any>;
  getMonthlyReport(month: number, year: number): Promise<any>;
  getEmployeeReport(userId: number, startDate: string, endDate: string): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private vehicles: Map<number, Vehicle>;
  private services: Map<number, Service>;
  private shifts: Map<number, Shift>;
  private appointments: Map<number, Appointment>;
  private appointmentServices: Map<number, AppointmentService>;
  private notifications: Map<number, Notification>;
  
  private userIdCounter: number;
  private clientIdCounter: number;
  private vehicleIdCounter: number;
  private serviceIdCounter: number;
  private shiftIdCounter: number;
  private appointmentIdCounter: number;
  private appointmentServiceIdCounter: number;
  private notificationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.vehicles = new Map();
    this.services = new Map();
    this.shifts = new Map();
    this.appointments = new Map();
    this.appointmentServices = new Map();
    this.notifications = new Map();
    
    this.userIdCounter = 1;
    this.clientIdCounter = 1;
    this.vehicleIdCounter = 1;
    this.serviceIdCounter = 1;
    this.shiftIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.appointmentServiceIdCounter = 1;
    this.notificationIdCounter = 1;
    
    // Initializing with sample data
    this.initSampleData();
  }

  private initSampleData() {
    // Add a default admin user
    this.createUser({
      email: 'admin@autowash.ru',
      name: 'Иван',
      surname: 'Петров',
      role: 'admin',
      password: 'admin123',
      phone: '+7 (999) 123-45-67',
    });
    
    // Add sample employees
    this.createUser({
      email: 'employee1@autowash.ru',
      name: 'Сергей',
      surname: 'Козлов',
      role: 'employee',
      password: 'employee1',
      phone: '+7 (999) 111-22-33',
    });
    
    this.createUser({
      email: 'employee2@autowash.ru',
      name: 'Александр',
      surname: 'Попов',
      role: 'employee',
      password: 'employee2',
      phone: '+7 (999) 222-33-44',
    });
    
    this.createUser({
      email: 'employee3@autowash.ru',
      name: 'Виктория',
      surname: 'Соколова',
      role: 'employee',
      password: 'employee3',
      phone: '+7 (999) 333-44-55',
    });
    
    this.createUser({
      email: 'employee4@autowash.ru',
      name: 'Денис',
      surname: 'Новиков',
      role: 'employee',
      password: 'employee4',
      phone: '+7 (999) 444-55-66',
    });
    
    // Add sample services
    this.createService({
      name: 'Стандартная мойка',
      description: 'Мойка кузова, уборка салона, протирка стекол',
      price: 900,
      durationMinutes: 30,
      active: true,
    });
    
    this.createService({
      name: 'Комплексная мойка',
      description: 'Стандартная мойка + чистка ковриков и багажника',
      price: 1500,
      durationMinutes: 45,
      active: true,
    });
    
    this.createService({
      name: 'Детейлинг салона',
      description: 'Полная химчистка салона, обработка пластика, кожи, ткани',
      price: 2500,
      durationMinutes: 120,
      active: true,
    });
    
    this.createService({
      name: 'Полировка кузова',
      description: 'Полировка кузова с удалением мелких царапин',
      price: 3500,
      durationMinutes: 180,
      active: true,
    });
    
    this.createService({
      name: 'Экспресс-мойка',
      description: 'Быстрая мойка кузова без сушки',
      price: 500,
      durationMinutes: 15,
      active: true,
    });
    
    // Add sample clients
    const client1 = this.createClient({
      name: 'Алексей',
      surname: 'Смирнов',
      phone: '+7 (925) 123-45-67',
      email: 'alexey@gmail.com',
    });
    
    const client2 = this.createClient({
      name: 'Мария',
      surname: 'Иванова',
      phone: '+7 (916) 987-65-43',
      email: 'maria@gmail.com',
    });
    
    const client3 = this.createClient({
      name: 'Дмитрий',
      surname: 'Петров',
      phone: '+7 (903) 111-22-33',
      email: 'dmitry@gmail.com',
    });
    
    // Add sample vehicles
    this.createVehicle({
      clientId: client1.id,
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'Белый',
      licensePlate: 'А123БВ77',
    });
    
    this.createVehicle({
      clientId: client2.id,
      make: 'Kia',
      model: 'Rio',
      year: 2019,
      color: 'Синий',
      licensePlate: 'В567ГД77',
    });
    
    this.createVehicle({
      clientId: client3.id,
      make: 'BMW',
      model: 'X5',
      year: 2021,
      color: 'Черный',
      licensePlate: 'Е234ЖЗ777',
    });
    
    // Add sample shifts for today
    const today = new Date().toISOString().split('T')[0];
    
    this.createShift({
      userId: 2,
      date: today,
      startTime: '08:00:00',
      endTime: '20:00:00',
      status: 'active',
      earnings: 8500,
    });
    
    this.createShift({
      userId: 3,
      date: today,
      startTime: '08:00:00',
      endTime: '20:00:00',
      status: 'active',
      earnings: 12300,
    });
    
    this.createShift({
      userId: 4,
      date: today,
      startTime: '08:00:00',
      endTime: '20:00:00',
      status: 'active',
      earnings: 9200,
    });
    
    this.createShift({
      userId: 5,
      date: today,
      startTime: '08:00:00',
      endTime: '20:00:00',
      status: 'active',
      earnings: 6500,
    });
    
    // Add sample appointments
    const appointment1 = this.createAppointment({
      clientId: client1.id,
      vehicleId: 1,
      userId: 2,
      date: today,
      startTime: '10:00:00',
      endTime: '10:30:00',
      status: 'scheduled',
      totalPrice: 900,
      notes: '',
    });
    
    const appointment2 = this.createAppointment({
      clientId: client2.id,
      vehicleId: 2,
      userId: 3,
      date: today,
      startTime: '11:30:00',
      endTime: '12:15:00',
      status: 'confirmed',
      totalPrice: 1500,
      notes: '',
    });
    
    const appointment3 = this.createAppointment({
      clientId: client3.id,
      vehicleId: 3,
      userId: 4,
      date: today,
      startTime: '13:00:00',
      endTime: '15:00:00',
      status: 'in_progress',
      totalPrice: 2500,
      notes: '',
    });
    
    // Add appointment services
    this.createAppointmentService({
      appointmentId: appointment1.id,
      serviceId: 1,
      price: 900,
    });
    
    this.createAppointmentService({
      appointmentId: appointment2.id,
      serviceId: 2,
      price: 1500,
    });
    
    this.createAppointmentService({
      appointmentId: appointment3.id,
      serviceId: 3,
      price: 2500,
    });
    
    // Add sample notifications
    this.createNotification({
      userId: 1,
      title: 'Новая запись',
      message: 'Новая запись на 16:30 - Белов Игорь (VW Tiguan)',
      read: false,
    });
    
    this.createNotification({
      userId: 1,
      title: 'Обслуживание завершено',
      message: 'Соколова Виктория закончила обслуживание BMW X5',
      read: false,
    });
    
    this.createNotification({
      userId: 1,
      title: 'Изменение записи',
      message: 'Клиент Смирнов А. изменил время записи на завтра',
      read: true,
    });
    
    this.createNotification({
      userId: 1,
      title: 'Ежедневный отчет',
      message: 'Создан ежедневный отчет за вчерашний день',
      read: true,
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date().toISOString();
    const newUser: User = { ...user, id, createdAt };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: InsertUser): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }

    const updatedUser: User = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Clients
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const createdAt = new Date().toISOString();
    const newClient: Client = { ...client, id, createdAt };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, client: InsertClient): Promise<Client | undefined> {
    const existingClient = this.clients.get(id);
    if (!existingClient) {
      return undefined;
    }

    const updatedClient: Client = { ...existingClient, ...client };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Vehicles
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehiclesByClientId(clientId: number): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(
      (vehicle) => vehicle.clientId === clientId
    );
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleIdCounter++;
    const createdAt = new Date().toISOString();
    const newVehicle: Vehicle = { ...vehicle, id, createdAt };
    this.vehicles.set(id, newVehicle);
    return newVehicle;
  }

  async updateVehicle(id: number, vehicle: InsertVehicle): Promise<Vehicle | undefined> {
    const existingVehicle = this.vehicles.get(id);
    if (!existingVehicle) {
      return undefined;
    }

    const updatedVehicle: Vehicle = { ...existingVehicle, ...vehicle };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  // Services
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async createService(service: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const newService: Service = { ...service, id };
    this.services.set(id, newService);
    return newService;
  }

  async updateService(id: number, service: InsertService): Promise<Service | undefined> {
    const existingService = this.services.get(id);
    if (!existingService) {
      return undefined;
    }

    const updatedService: Service = { ...existingService, ...service };
    this.services.set(id, updatedService);
    return updatedService;
  }

  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }

  // Shifts
  async getShift(id: number): Promise<Shift | undefined> {
    return this.shifts.get(id);
  }

  async getAllShifts(): Promise<Shift[]> {
    return Array.from(this.shifts.values());
  }

  async getShiftsByDate(date: string): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(
      (shift) => shift.date === date
    );
  }

  async getShiftsByUserId(userId: number): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(
      (shift) => shift.userId === userId
    );
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const id = this.shiftIdCounter++;
    const newShift: Shift = { ...shift, id };
    this.shifts.set(id, newShift);
    return newShift;
  }

  async updateShift(id: number, shift: InsertShift): Promise<Shift | undefined> {
    const existingShift = this.shifts.get(id);
    if (!existingShift) {
      return undefined;
    }

    const updatedShift: Shift = { ...existingShift, ...shift };
    this.shifts.set(id, updatedShift);
    return updatedShift;
  }

  async deleteShift(id: number): Promise<boolean> {
    return this.shifts.delete(id);
  }

  // Appointments
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.date === date
    );
  }

  async getAppointmentsByClientId(clientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.clientId === clientId
    );
  }

  async getAppointmentsByUserId(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.userId === userId
    );
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const createdAt = new Date().toISOString();
    const newAppointment: Appointment = { ...appointment, id, createdAt };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: InsertAppointment): Promise<Appointment | undefined> {
    const existingAppointment = this.appointments.get(id);
    if (!existingAppointment) {
      return undefined;
    }

    const updatedAppointment: Appointment = { ...existingAppointment, ...appointment };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Appointment Services
  async getAppointmentServices(appointmentId: number): Promise<AppointmentService[]> {
    return Array.from(this.appointmentServices.values()).filter(
      (appointmentService) => appointmentService.appointmentId === appointmentId
    );
  }

  async createAppointmentService(appointmentService: InsertAppointmentService): Promise<AppointmentService> {
    const id = this.appointmentServiceIdCounter++;
    const newAppointmentService: AppointmentService = { ...appointmentService, id };
    this.appointmentServices.set(id, newAppointmentService);
    return newAppointmentService;
  }

  async deleteAppointmentService(id: number): Promise<boolean> {
    return this.appointmentServices.delete(id);
  }

  // Notifications
  async getAllNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values());
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.userId === userId
    );
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const createdAt = new Date().toISOString();
    const newNotification: Notification = { ...notification, id, createdAt };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) {
      return undefined;
    }

    const updatedNotification: Notification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    const notifications = await this.getNotificationsByUserId(userId);
    
    for (const notification of notifications) {
      if (!notification.read) {
        await this.markNotificationRead(notification.id);
      }
    }
  }

  // Reports
  async getDailyReport(date: string): Promise<any> {
    const appointments = await this.getAppointmentsByDate(date);
    const shifts = await this.getShiftsByDate(date);
    
    const totalRevenue = appointments.reduce((sum, appointment) => sum + appointment.totalPrice, 0);
    const employeeData = [];
    
    for (const shift of shifts) {
      const user = await this.getUser(shift.userId);
      const employeeAppointments = appointments.filter(a => a.userId === shift.userId);
      const completedAppointments = employeeAppointments.filter(a => a.status === 'completed');
      
      employeeData.push({
        userId: shift.userId,
        name: user ? `${user.name} ${user.surname}` : 'Неизвестный сотрудник',
        totalAppointments: employeeAppointments.length,
        completedAppointments: completedAppointments.length,
        earnings: shift.earnings,
      });
    }
    
    return {
      date,
      totalAppointments: appointments.length,
      totalRevenue,
      employees: employeeData,
    };
  }

  async getWeeklyReport(startDate: string): Promise<any> {
    // Convert startDate to Date object
    const start = new Date(startDate);
    const dailyReports = [];
    
    // Generate reports for 7 days
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      const dailyReport = await this.getDailyReport(dateString);
      dailyReports.push(dailyReport);
    }
    
    const totalRevenue = dailyReports.reduce((sum, report) => sum + report.totalRevenue, 0);
    const totalAppointments = dailyReports.reduce((sum, report) => sum + report.totalAppointments, 0);
    
    // Aggregate employee data
    const employeeMap = new Map();
    
    dailyReports.forEach(report => {
      report.employees.forEach(employee => {
        const existingEmployee = employeeMap.get(employee.userId);
        
        if (existingEmployee) {
          employeeMap.set(employee.userId, {
            ...existingEmployee,
            totalAppointments: existingEmployee.totalAppointments + employee.totalAppointments,
            completedAppointments: existingEmployee.completedAppointments + employee.completedAppointments,
            earnings: existingEmployee.earnings + employee.earnings,
          });
        } else {
          employeeMap.set(employee.userId, {
            userId: employee.userId,
            name: employee.name,
            totalAppointments: employee.totalAppointments,
            completedAppointments: employee.completedAppointments,
            earnings: employee.earnings,
          });
        }
      });
    });
    
    return {
      startDate,
      endDate: new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAppointments,
      totalRevenue,
      employees: Array.from(employeeMap.values()),
      dailyReports,
    };
  }

  async getMonthlyReport(month: number, year: number): Promise<any> {
    // Get the number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyReports = [];
    
    // Generate reports for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dailyReport = await this.getDailyReport(dateString);
      dailyReports.push(dailyReport);
    }
    
    const totalRevenue = dailyReports.reduce((sum, report) => sum + report.totalRevenue, 0);
    const totalAppointments = dailyReports.reduce((sum, report) => sum + report.totalAppointments, 0);
    
    // Aggregate employee data
    const employeeMap = new Map();
    
    dailyReports.forEach(report => {
      report.employees.forEach(employee => {
        const existingEmployee = employeeMap.get(employee.userId);
        
        if (existingEmployee) {
          employeeMap.set(employee.userId, {
            ...existingEmployee,
            totalAppointments: existingEmployee.totalAppointments + employee.totalAppointments,
            completedAppointments: existingEmployee.completedAppointments + employee.completedAppointments,
            earnings: existingEmployee.earnings + employee.earnings,
          });
        } else {
          employeeMap.set(employee.userId, {
            userId: employee.userId,
            name: employee.name,
            totalAppointments: employee.totalAppointments,
            completedAppointments: employee.completedAppointments,
            earnings: employee.earnings,
          });
        }
      });
    });
    
    return {
      month,
      year,
      totalAppointments,
      totalRevenue,
      employees: Array.from(employeeMap.values()),
      dailyReports,
    };
  }

  async getEmployeeReport(userId: number, startDate: string, endDate: string): Promise<any> {
    // Convert dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error("Сотрудник не найден");
    }
    
    const dailyData = [];
    let currentDate = new Date(start);
    
    // Generate data for each day in the range
    while (currentDate <= end) {
      const dateString = currentDate.toISOString().split('T')[0];
      const shifts = await this.getShiftsByDate(dateString);
      const employeeShift = shifts.find(s => s.userId === userId);
      
      const appointments = await this.getAppointmentsByDate(dateString);
      const employeeAppointments = appointments.filter(a => a.userId === userId);
      const completedAppointments = employeeAppointments.filter(a => a.status === 'completed');
      
      const revenue = employeeAppointments.reduce((sum, appointment) => sum + appointment.totalPrice, 0);
      
      dailyData.push({
        date: dateString,
        appointments: employeeAppointments.length,
        completedAppointments: completedAppointments.length,
        revenue,
        earnings: employeeShift ? employeeShift.earnings : 0,
        shift: employeeShift,
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const totalAppointments = dailyData.reduce((sum, day) => sum + day.appointments, 0);
    const totalCompletedAppointments = dailyData.reduce((sum, day) => sum + day.completedAppointments, 0);
    const totalRevenue = dailyData.reduce((sum, day) => sum + day.revenue, 0);
    const totalEarnings = dailyData.reduce((sum, day) => sum + day.earnings, 0);
    
    return {
      employee: {
        id: user.id,
        name: `${user.name} ${user.surname}`,
        email: user.email,
        role: user.role,
      },
      startDate,
      endDate,
      totalAppointments,
      totalCompletedAppointments,
      totalRevenue,
      totalEarnings,
      dailyData,
    };
  }
}

export const storage = new MemStorage();
