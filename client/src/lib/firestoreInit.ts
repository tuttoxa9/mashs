import { 
  userService, 
  clientService, 
  vehicleService, 
  serviceService, 
  shiftService, 
  appointmentService, 
  appointmentServiceService,
  notificationService
} from './firestore';
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

// Функция для инициализации тестовых данных в Firestore
export async function initializeFirestoreData() {
  console.log("Initializing Firestore with sample data...");
  
  try {
    // Проверяем, есть ли уже данные в базе, чтобы не создавать дубликаты
    const existingUsers = await userService.getAll();
    if (existingUsers.length > 0) {
      console.log("Data already exists in Firestore, skipping initialization");
      return;
    }
    
    // Создаем пользователей
    const users = await createUsers();
    console.log(`Created ${users.length} users`);
    
    // Создаем клиентов
    const clients = await createClients();
    console.log(`Created ${clients.length} clients`);
    
    // Создаем автомобили
    const vehicles = await createVehicles(clients);
    console.log(`Created ${vehicles.length} vehicles`);
    
    // Создаем услуги
    const services = await createServices();
    console.log(`Created ${services.length} services`);
    
    // Создаем смены
    const shifts = await createShifts(users);
    console.log(`Created ${shifts.length} shifts`);
    
    // Создаем записи
    const appointments = await createAppointments(clients, users, vehicles);
    console.log(`Created ${appointments.length} appointments`);
    
    // Связываем записи с услугами
    const appointmentServices = await createAppointmentServices(appointments, services);
    console.log(`Created ${appointmentServices.length} appointment services`);
    
    // Создаем уведомления
    const notifications = await createNotifications(users);
    console.log(`Created ${notifications.length} notifications`);
    
    console.log("Firestore initialization completed successfully");
    
  } catch (error) {
    console.error("Error initializing Firestore data:", error);
    throw error;
  }
}

// Функция для создания пользователей
async function createUsers(): Promise<User[]> {
  const usersData: Omit<User, 'id'>[] = [
    {
      email: "admin@example.com",
      name: "Админ",
      surname: "Администраторов",
      role: "admin",
      createdAt: new Date().toISOString(),
      phone: "+7 (999) 123-4567"
    },
    {
      email: "ivan@example.com",
      name: "Иван",
      surname: "Петров",
      role: "employee",
      createdAt: new Date().toISOString(),
      phone: "+7 (999) 234-5678"
    },
    {
      email: "elena@example.com",
      name: "Елена",
      surname: "Сидорова",
      role: "employee",
      createdAt: new Date().toISOString(),
      phone: "+7 (999) 345-6789"
    },
    {
      email: "dmitry@example.com",
      name: "Дмитрий",
      surname: "Иванов",
      role: "employee",
      createdAt: new Date().toISOString(),
      phone: "+7 (999) 456-7890"
    }
  ];
  
  const users: User[] = [];
  
  for (const userData of usersData) {
    const user = await userService.create(userData);
    users.push(user);
  }
  
  return users;
}

// Функция для создания клиентов
async function createClients(): Promise<Client[]> {
  const clientsData: Omit<Client, 'id'>[] = [
    {
      name: "Алексей",
      surname: "Смирнов",
      email: "alexey@example.com",
      phone: "+7 (999) 111-2233",
      createdAt: new Date().toISOString()
    },
    {
      name: "Ольга",
      surname: "Козлова",
      email: "olga@example.com",
      phone: "+7 (999) 222-3344",
      createdAt: new Date().toISOString()
    },
    {
      name: "Михаил",
      surname: "Новиков",
      email: "mikhail@example.com",
      phone: "+7 (999) 333-4455",
      createdAt: new Date().toISOString()
    },
    {
      name: "Анна",
      surname: "Соколова",
      email: "anna@example.com",
      phone: "+7 (999) 444-5566",
      createdAt: new Date().toISOString()
    },
    {
      name: "Сергей",
      surname: "Морозов",
      email: "sergey@example.com",
      phone: "+7 (999) 555-6677",
      createdAt: new Date().toISOString()
    }
  ];
  
  const clients: Client[] = [];
  
  for (const clientData of clientsData) {
    const client = await clientService.create(clientData);
    clients.push(client);
  }
  
  return clients;
}

// Функция для создания автомобилей
async function createVehicles(clients: Client[]): Promise<Vehicle[]> {
  const vehiclesData: Omit<Vehicle, 'id'>[] = [
    {
      clientId: clients[0].id,
      make: "Toyota",
      model: "Camry",
      year: 2019,
      licensePlate: "А123БВ777",
      color: "Белый",
      createdAt: new Date().toISOString()
    },
    {
      clientId: clients[0].id,
      make: "Volkswagen",
      model: "Polo",
      year: 2020,
      licensePlate: "В234ГД777",
      color: "Синий",
      createdAt: new Date().toISOString()
    },
    {
      clientId: clients[1].id,
      make: "Kia",
      model: "Rio",
      year: 2021,
      licensePlate: "С345ЕЖ777",
      color: "Красный",
      createdAt: new Date().toISOString()
    },
    {
      clientId: clients[2].id,
      make: "Hyundai",
      model: "Solaris",
      year: 2018,
      licensePlate: "О456ПР777",
      color: "Серебристый",
      createdAt: new Date().toISOString()
    },
    {
      clientId: clients[3].id,
      make: "Skoda",
      model: "Octavia",
      year: 2020,
      licensePlate: "Т567УФ777",
      color: "Черный",
      createdAt: new Date().toISOString()
    },
    {
      clientId: clients[4].id,
      make: "BMW",
      model: "X5",
      year: 2022,
      licensePlate: "Х678ЦЧ777",
      color: "Серый",
      createdAt: new Date().toISOString()
    }
  ];
  
  const vehicles: Vehicle[] = [];
  
  for (const vehicleData of vehiclesData) {
    const vehicle = await vehicleService.create(vehicleData);
    vehicles.push(vehicle);
  }
  
  return vehicles;
}

// Функция для создания услуг
async function createServices(): Promise<Service[]> {
  const servicesData: Omit<Service, 'id'>[] = [
    {
      name: "Экспресс-мойка",
      description: "Быстрая мойка кузова без сушки",
      price: 600,
      durationMinutes: 15,
      active: true
    },
    {
      name: "Комплексная мойка",
      description: "Мойка кузова, салона, протирка пластика",
      price: 1200,
      durationMinutes: 30,
      active: true
    },
    {
      name: "Детейлинг-мойка",
      description: "Тщательная мойка с полировкой и обработкой кузова",
      price: 2500,
      durationMinutes: 60,
      active: true
    },
    {
      name: "Химчистка салона",
      description: "Полная химчистка салона и кресел",
      price: 3500,
      durationMinutes: 120,
      active: true
    },
    {
      name: "Полировка кузова",
      description: "Полная полировка кузова автомобиля",
      price: 4000,
      durationMinutes: 120,
      active: true
    },
    {
      name: "Защитное покрытие",
      description: "Нанесение защитного покрытия на кузов",
      price: 5000,
      durationMinutes: 90,
      active: true
    },
    {
      name: "Мойка двигателя",
      description: "Мойка моторного отсека",
      price: 1500,
      durationMinutes: 45,
      active: true
    },
    {
      name: "Обезжиривание",
      description: "Обезжиривание кузова перед полировкой",
      price: 1000,
      durationMinutes: 30,
      active: false
    }
  ];
  
  const services: Service[] = [];
  
  for (const serviceData of servicesData) {
    const service = await serviceService.create(serviceData);
    services.push(service);
  }
  
  return services;
}

// Функция для создания смен
async function createShifts(users: User[]): Promise<Shift[]> {
  // Получаем только сотрудников (не админов)
  const employees = users.filter(user => user.role === "employee");
  
  // Создаем смены на ближайшие 7 дней
  const today = new Date();
  const shiftsData: Omit<Shift, 'id'>[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    
    for (const employee of employees) {
      // Случайный заработок для уже прошедших дней
      const isPastDay = date < new Date();
      const earnings = isPastDay ? Math.floor(Math.random() * 5000) + 3000 : null;
      
      // Статус смены
      const status = isPastDay 
        ? "completed" 
        : (date.toISOString().split('T')[0] === today.toISOString().split('T')[0] 
            ? "active" : "scheduled");
      
      shiftsData.push({
        date: dateString,
        userId: employee.id,
        startTime: "09:00",
        endTime: "18:00",
        status,
        earnings
      });
    }
  }
  
  const shifts: Shift[] = [];
  
  for (const shiftData of shiftsData) {
    const shift = await shiftService.create(shiftData);
    shifts.push(shift);
  }
  
  return shifts;
}

// Функция для создания записей
async function createAppointments(clients: Client[], users: User[], vehicles: Vehicle[]): Promise<Appointment[]> {
  // Получаем только сотрудников
  const employees = users.filter(user => user.role === "employee");
  
  // Создаем записи на ближайшие 7 дней
  const today = new Date();
  const appointmentsData: Omit<Appointment, 'id'>[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    
    // Добавляем 2-4 записи на каждый день
    const numAppointments = Math.floor(Math.random() * 3) + 2;
    
    for (let j = 0; j < numAppointments; j++) {
      // Случайный клиент
      const client = clients[Math.floor(Math.random() * clients.length)];
      
      // Получаем автомобили этого клиента
      const clientVehicles = vehicles.filter(v => v.clientId === client.id);
      
      // Если у клиента нет автомобилей, пропускаем
      if (clientVehicles.length === 0) continue;
      
      // Случайный автомобиль клиента
      const vehicle = clientVehicles[Math.floor(Math.random() * clientVehicles.length)];
      
      // Случайный сотрудник
      const employee = employees[Math.floor(Math.random() * employees.length)];
      
      // Время начала (с 9:00 до 17:00 с шагом в час)
      const hour = 9 + Math.floor(Math.random() * 9);
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      
      // Время окончания (старт + 1-2 часа)
      const endHour = hour + 1 + Math.floor(Math.random() * 2);
      const endTime = `${endHour.toString().padStart(2, '0')}:00`;
      
      // Статус записи
      const isPastAppointment = date < today || (date.toISOString().split('T')[0] === today.toISOString().split('T')[0] && hour < today.getHours());
      
      let status;
      if (isPastAppointment) {
        // Для прошедших записей: либо завершена, либо отменена
        status = Math.random() > 0.2 ? "completed" : "cancelled"; // 80% завершены, 20% отменены
      } else if (date.toISOString().split('T')[0] === today.toISOString().split('T')[0] && hour === today.getHours()) {
        // Для текущего часа: в процессе
        status = "in_progress";
      } else {
        // Для будущих записей: запланирована
        status = "scheduled";
      }
      
      // Случайная цена (от 500 до 5000)
      const totalPrice = Math.floor(Math.random() * 4500) + 500;
      
      appointmentsData.push({
        date: dateString,
        clientId: client.id,
        userId: employee.id,
        startTime,
        endTime: status === "scheduled" ? null : endTime,
        status,
        vehicleId: vehicle.id,
        totalPrice,
        notes: status === "cancelled" ? "Клиент отменил запись" : null,
        createdAt: new Date().toISOString()
      });
    }
  }
  
  const appointments: Appointment[] = [];
  
  for (const appointmentData of appointmentsData) {
    const appointment = await appointmentService.create(appointmentData);
    appointments.push(appointment);
  }
  
  return appointments;
}

// Функция для создания связей записей с услугами
async function createAppointmentServices(appointments: Appointment[], services: Service[]): Promise<AppointmentService[]> {
  const appointmentServicesData: Omit<AppointmentService, 'id'>[] = [];
  
  for (const appointment of appointments) {
    // Добавляем 1-3 услуги на каждую запись
    const numServices = Math.floor(Math.random() * 3) + 1;
    
    // Выбираем случайные услуги без повторений
    const shuffledServices = [...services].sort(() => Math.random() - 0.5).slice(0, numServices);
    
    for (const service of shuffledServices) {
      appointmentServicesData.push({
        appointmentId: appointment.id,
        serviceId: service.id,
        price: service.price
      });
    }
  }
  
  const appointmentServices: AppointmentService[] = [];
  
  for (const asData of appointmentServicesData) {
    const as = await appointmentServiceService.create(asData);
    appointmentServices.push(as);
  }
  
  return appointmentServices;
}

// Функция для создания уведомлений
async function createNotifications(users: User[]): Promise<Notification[]> {
  const notificationsData: Omit<Notification, 'id'>[] = [];
  
  // Добавляем уведомления для каждого пользователя
  for (const user of users) {
    // Добавляем 3-6 уведомлений
    const numNotifications = Math.floor(Math.random() * 4) + 3;
    
    for (let i = 0; i < numNotifications; i++) {
      // Тип уведомления
      const types = ["info", "warning", "success"];
      const type = types[Math.floor(Math.random() * types.length)];
      
      // Дата создания (от 7 дней назад до текущего дня)
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7));
      
      // Сообщение
      let message = "";
      if (type === "info") {
        message = `Информация: новая запись на ${date.toLocaleDateString('ru-RU')}`;
      } else if (type === "warning") {
        message = `Внимание: изменения в графике на ${date.toLocaleDateString('ru-RU')}`;
      } else {
        message = `Выполнено: завершена запись #${Math.floor(Math.random() * 1000)}`;
      }
      
      // Прочитано или нет (70% не прочитаны)
      const read = Math.random() > 0.7;
      
      notificationsData.push({
        userId: user.id,
        message,
        type,
        read,
        createdAt: date.toISOString()
      });
    }
  }
  
  const notifications: Notification[] = [];
  
  for (const notificationData of notificationsData) {
    const notification = await notificationService.create(notificationData);
    notifications.push(notification);
  }
  
  return notifications;
}