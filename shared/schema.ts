import { pgTable, text, serial, integer, boolean, timestamp, date, time, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Пользователи системы (администраторы, сотрудники)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  surname: text("surname").notNull(),
  role: text("role").notNull().default("employee"), // admin, employee
  password: text("password").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  firebaseUid: text("firebase_uid").unique(),
});

// Клиенты
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  surname: text("surname").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Автомобили
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year"),
  color: text("color"),
  licensePlate: text("license_plate").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Услуги автомойки
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  active: boolean("active").default(true).notNull(),
});

// Смены сотрудников
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, active, completed
  earnings: doublePrecision("earnings").default(0),
});

// Записи на услуги
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  userId: integer("user_id").references(() => users.id),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time"),
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, in_progress, completed, cancelled
  totalPrice: doublePrecision("total_price").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Услуги в записи
export const appointmentServices = pgTable("appointment_services", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => appointments.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  price: doublePrecision("price").notNull(),
});

// Уведомления
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Схемы для валидации и типы

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentServiceSchema = createInsertSchema(appointmentServices).omit({
  id: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertAppointmentService = z.infer<typeof insertAppointmentServiceSchema>;
export type AppointmentService = typeof appointmentServices.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
