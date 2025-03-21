import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertClientSchema, 
  insertVehicleSchema, 
  insertServiceSchema, 
  insertShiftSchema, 
  insertAppointmentSchema, 
  insertAppointmentServiceSchema,
  insertNotificationSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler helper
  const handleZodError = (err: unknown) => {
    if (err instanceof ZodError) {
      return fromZodError(err).message;
    }
    return String(err);
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Неверный email или пароль" });
      }
      
      return res.json({ user: { ...user, password: undefined } });
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(users.map(user => ({...user, password: undefined})));
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      return res.json({...user, password: undefined});
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      return res.status(201).json({...newUser, password: undefined});
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      return res.json({...updatedUser, password: undefined});
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      return res.json({ message: "Пользователь удален" });
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  // Clients routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      return res.json(clients);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Клиент не найден" });
      }
      
      return res.json(client);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const newClient = await storage.createClient(clientData);
      return res.status(201).json(newClient);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.parse(req.body);
      const updatedClient = await storage.updateClient(id, clientData);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Клиент не найден" });
      }
      
      return res.json(updatedClient);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteClient(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Клиент не найден" });
      }
      
      return res.json({ message: "Клиент удален" });
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  // Vehicles routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      return res.json(vehicles);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/clients/:clientId/vehicles", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const vehicles = await storage.getVehiclesByClientId(clientId);
      return res.json(vehicles);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Автомобиль не найден" });
      }
      
      return res.json(vehicle);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const newVehicle = await storage.createVehicle(vehicleData);
      return res.status(201).json(newVehicle);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicleData = insertVehicleSchema.parse(req.body);
      const updatedVehicle = await storage.updateVehicle(id, vehicleData);
      
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Автомобиль не найден" });
      }
      
      return res.json(updatedVehicle);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteVehicle(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Автомобиль не найден" });
      }
      
      return res.json({ message: "Автомобиль удален" });
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  // Services routes
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getAllServices();
      return res.json(services);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getService(id);
      
      if (!service) {
        return res.status(404).json({ message: "Услуга не найдена" });
      }
      
      return res.json(service);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const newService = await storage.createService(serviceData);
      return res.status(201).json(newService);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serviceData = insertServiceSchema.parse(req.body);
      const updatedService = await storage.updateService(id, serviceData);
      
      if (!updatedService) {
        return res.status(404).json({ message: "Услуга не найдена" });
      }
      
      return res.json(updatedService);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteService(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Услуга не найдена" });
      }
      
      return res.json({ message: "Услуга удалена" });
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  // Shifts routes
  app.get("/api/shifts", async (req, res) => {
    try {
      const { date, userId } = req.query;
      let shifts;
      
      if (date) {
        shifts = await storage.getShiftsByDate(date as string);
      } else if (userId) {
        shifts = await storage.getShiftsByUserId(parseInt(userId as string));
      } else {
        shifts = await storage.getAllShifts();
      }
      
      return res.json(shifts);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shift = await storage.getShift(id);
      
      if (!shift) {
        return res.status(404).json({ message: "Смена не найдена" });
      }
      
      return res.json(shift);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/shifts", async (req, res) => {
    try {
      const shiftData = insertShiftSchema.parse(req.body);
      const newShift = await storage.createShift(shiftData);
      return res.status(201).json(newShift);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.put("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const shiftData = insertShiftSchema.parse(req.body);
      const updatedShift = await storage.updateShift(id, shiftData);
      
      if (!updatedShift) {
        return res.status(404).json({ message: "Смена не найдена" });
      }
      
      return res.json(updatedShift);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.delete("/api/shifts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteShift(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Смена не найдена" });
      }
      
      return res.json({ message: "Смена удалена" });
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  // Appointments routes
  app.get("/api/appointments", async (req, res) => {
    try {
      const { date, clientId, userId } = req.query;
      let appointments;
      
      if (date) {
        appointments = await storage.getAppointmentsByDate(date as string);
      } else if (clientId) {
        appointments = await storage.getAppointmentsByClientId(parseInt(clientId as string));
      } else if (userId) {
        appointments = await storage.getAppointmentsByUserId(parseInt(userId as string));
      } else {
        appointments = await storage.getAllAppointments();
      }
      
      return res.json(appointments);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ message: "Запись не найдена" });
      }
      
      return res.json(appointment);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const newAppointment = await storage.createAppointment(appointmentData);
      return res.status(201).json(newAppointment);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const updatedAppointment = await storage.updateAppointment(id, appointmentData);
      
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Запись не найдена" });
      }
      
      return res.json(updatedAppointment);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAppointment(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Запись не найдена" });
      }
      
      return res.json({ message: "Запись удалена" });
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  // Appointment Services routes
  app.get("/api/appointments/:appointmentId/services", async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      const services = await storage.getAppointmentServices(appointmentId);
      return res.json(services);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/appointment-services", async (req, res) => {
    try {
      const appointmentServiceData = insertAppointmentServiceSchema.parse(req.body);
      const newAppointmentService = await storage.createAppointmentService(appointmentServiceData);
      return res.status(201).json(newAppointmentService);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.delete("/api/appointment-services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAppointmentService(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Услуга записи не найдена" });
      }
      
      return res.json({ message: "Услуга записи удалена" });
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  // Notifications routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const { userId } = req.query;
      let notifications;
      
      if (userId) {
        notifications = await storage.getNotificationsByUserId(parseInt(userId as string));
      } else {
        notifications = await storage.getAllNotifications();
      }
      
      return res.json(notifications);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const newNotification = await storage.createNotification(notificationData);
      return res.status(201).json(newNotification);
    } catch (err) {
      return res.status(400).json({ message: handleZodError(err) });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedNotification = await storage.markNotificationRead(id);
      
      if (!updatedNotification) {
        return res.status(404).json({ message: "Уведомление не найдено" });
      }
      
      return res.json(updatedNotification);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.put("/api/notifications/read-all", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "Необходимо указать userId" });
      }
      
      await storage.markAllNotificationsRead(parseInt(userId));
      return res.json({ message: "Все уведомления отмечены как прочитанные" });
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  // Reports routes
  app.get("/api/reports/daily", async (req, res) => {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ message: "Необходимо указать дату" });
      }
      
      const report = await storage.getDailyReport(date as string);
      return res.json(report);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/reports/weekly", async (req, res) => {
    try {
      const { startDate } = req.query;
      
      if (!startDate) {
        return res.status(400).json({ message: "Необходимо указать начальную дату недели" });
      }
      
      const report = await storage.getWeeklyReport(startDate as string);
      return res.json(report);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/reports/monthly", async (req, res) => {
    try {
      const { month, year } = req.query;
      
      if (!month || !year) {
        return res.status(400).json({ message: "Необходимо указать месяц и год" });
      }
      
      const report = await storage.getMonthlyReport(parseInt(month as string), parseInt(year as string));
      return res.json(report);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  app.get("/api/reports/employee/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Необходимо указать начальную и конечную даты" });
      }
      
      const report = await storage.getEmployeeReport(userId, startDate as string, endDate as string);
      return res.json(report);
    } catch (err) {
      return res.status(500).json({ message: String(err) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
