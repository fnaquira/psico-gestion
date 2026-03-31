/**
 * Seed script — crea datos de ejemplo para desarrollo
 *
 * Uso:
 *   npx tsx server/seed.ts
 *   (o desde dentro del contenedor api)
 *
 * Credenciales creadas:
 *   email:    demo@psicogestion.com
 *   password: Demo1234!
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import { Tenant } from "./models/Tenant.js";
import { User } from "./models/User.js";
import { Tutor } from "./models/Tutor.js";
import { Paciente } from "./models/Paciente.js";
import { Cita } from "./models/Cita.js";
import { Pago } from "./models/Pago.js";

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://localhost:27017/psicogestion";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✓ MongoDB conectado");

  // ── Limpiar datos anteriores ────────────────────────────────────────────────
  await Promise.all([
    Tenant.deleteMany({}),
    User.deleteMany({}),
    Tutor.deleteMany({}),
    Paciente.deleteMany({}),
    Cita.deleteMany({}),
    Pago.deleteMany({}),
  ]);
  console.log("✓ Colecciones limpiadas");

  // ── Tenant ──────────────────────────────────────────────────────────────────
  const tenant = await Tenant.create({
    name: "Consultorio Demo",
    slug: "consultorio-demo",
    plan: "pro",
    settings: { currency: "ARS", timezone: "America/Argentina/Buenos_Aires", sessionPrice: 15000 },
  });

  // ── Usuario admin ────────────────────────────────────────────────────────────
  const passwordHash = await bcryptjs.hash("Demo1234!", 12);
  const admin = await User.create({
    tenantId: tenant._id,
    nombre: "Dra. Laura Méndez",
    email: "demo@psicogestion.com",
    passwordHash,
    rol: "admin",
    especialidad: "clinica",
    activo: true,
  });

  // ── Segundo doctor ───────────────────────────────────────────────────────────
  const doctorHash = await bcryptjs.hash("Doctor123!", 12);
  const doctor2 = await User.create({
    tenantId: tenant._id,
    nombre: "Dr. Martín Torres",
    email: "martin@psicogestion.com",
    passwordHash: doctorHash,
    rol: "doctor",
    especialidad: "infantil",
    activo: true,
  });

  // ── Tutor (para paciente menor) ──────────────────────────────────────────────
  const tutor = await Tutor.create({
    tenantId: tenant._id,
    nombre: "Roberto",
    apellido: "Gómez",
    relacion: "padre",
    telefono: "351-555-0101",
    email: "roberto.gomez@email.com",
    documento: "28.456.789",
  });

  // ── Pacientes ────────────────────────────────────────────────────────────────
  const today = new Date();
  const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000);

  const [p1, p2, p3, p4, p5] = await Paciente.insertMany([
    {
      tenantId: tenant._id,
      nombre: "Valentina",
      apellido: "Rodríguez",
      fechaNacimiento: new Date("1990-05-14"),
      esMenor: false,
      genero: "F",
      telefono: "351-555-1234",
      email: "valentina.r@email.com",
      estado: "activo",
      doctorAsignado: admin._id,
      fechaRegistro: daysAgo(120),
    },
    {
      tenantId: tenant._id,
      nombre: "Carlos",
      apellido: "Herrera",
      fechaNacimiento: new Date("1985-11-22"),
      esMenor: false,
      genero: "M",
      telefono: "351-555-5678",
      email: "carlos.h@email.com",
      estado: "activo",
      doctorAsignado: admin._id,
      fechaRegistro: daysAgo(90),
    },
    {
      tenantId: tenant._id,
      nombre: "Lucía",
      apellido: "Fernández",
      fechaNacimiento: new Date("1998-03-07"),
      esMenor: false,
      genero: "F",
      telefono: "351-555-9012",
      email: "lucia.f@email.com",
      estado: "en_deuda",
      doctorAsignado: doctor2._id,
      fechaRegistro: daysAgo(60),
    },
    {
      // Menor con tutor
      tenantId: tenant._id,
      nombre: "Tomás",
      apellido: "Gómez",
      fechaNacimiento: new Date("2015-07-19"),
      esMenor: true,
      genero: "M",
      telefono: "351-555-3456",
      email: "",
      estado: "activo",
      tutorId: tutor._id,
      doctorAsignado: doctor2._id,
      fechaRegistro: daysAgo(45),
    },
    {
      tenantId: tenant._id,
      nombre: "Sofía",
      apellido: "Navarro",
      fechaNacimiento: new Date("1979-09-30"),
      esMenor: false,
      genero: "F",
      telefono: "351-555-7890",
      email: "sofia.n@email.com",
      estado: "en_deuda",
      doctorAsignado: admin._id,
      fechaRegistro: daysAgo(30),
    },
  ]);

  // ── Citas ────────────────────────────────────────────────────────────────────
  const todayDate = new Date(today.toDateString()); // medianoche
  const hoursFromNow = (h: number) => {
    const d = new Date(todayDate);
    d.setHours(h);
    return d;
  };

  const citas = await Cita.insertMany([
    // Hoy
    {
      tenantId: tenant._id,
      pacienteId: p1._id,
      doctorId: admin._id,
      fecha: todayDate,
      horaInicio: "09:00",
      horaFin: "10:00",
      tipoSesion: "seguimiento",
      estado: "programada",
      montoCita: 15000,
    },
    {
      tenantId: tenant._id,
      pacienteId: p2._id,
      doctorId: admin._id,
      fecha: todayDate,
      horaInicio: "10:30",
      horaFin: "11:30",
      tipoSesion: "seguimiento",
      estado: "programada",
      montoCita: 15000,
    },
    {
      tenantId: tenant._id,
      pacienteId: p4._id,
      doctorId: doctor2._id,
      fecha: todayDate,
      horaInicio: "14:00",
      horaFin: "15:00",
      tipoSesion: "inicial",
      estado: "programada",
      montoCita: 15000,
    },
    // Ayer — realizadas
    {
      tenantId: tenant._id,
      pacienteId: p1._id,
      doctorId: admin._id,
      fecha: daysAgo(1),
      horaInicio: "09:00",
      horaFin: "10:00",
      tipoSesion: "seguimiento",
      estado: "realizada",
      montoCita: 15000,
    },
    {
      tenantId: tenant._id,
      pacienteId: p3._id,
      doctorId: doctor2._id,
      fecha: daysAgo(1),
      horaInicio: "11:00",
      horaFin: "12:00",
      tipoSesion: "evaluacion",
      estado: "realizada",
      montoCita: 18000,
    },
    // Hace 2 días
    {
      tenantId: tenant._id,
      pacienteId: p2._id,
      doctorId: admin._id,
      fecha: daysAgo(2),
      horaInicio: "15:00",
      horaFin: "16:00",
      tipoSesion: "seguimiento",
      estado: "realizada",
      montoCita: 15000,
    },
    {
      tenantId: tenant._id,
      pacienteId: p5._id,
      doctorId: admin._id,
      fecha: daysAgo(2),
      horaInicio: "16:30",
      horaFin: "17:30",
      tipoSesion: "inicial",
      estado: "realizada",
      montoCita: 15000,
    },
    // Hace 3 días
    {
      tenantId: tenant._id,
      pacienteId: p1._id,
      doctorId: admin._id,
      fecha: daysAgo(3),
      horaInicio: "09:00",
      horaFin: "10:00",
      tipoSesion: "seguimiento",
      estado: "realizada",
      montoCita: 15000,
    },
    // Hace 5 días
    {
      tenantId: tenant._id,
      pacienteId: p4._id,
      doctorId: doctor2._id,
      fecha: daysAgo(5),
      horaInicio: "10:00",
      horaFin: "11:00",
      tipoSesion: "seguimiento",
      estado: "realizada",
      montoCita: 15000,
    },
    // Hace 6 días
    {
      tenantId: tenant._id,
      pacienteId: p2._id,
      doctorId: admin._id,
      fecha: daysAgo(6),
      horaInicio: "14:00",
      horaFin: "15:00",
      tipoSesion: "seguimiento",
      estado: "no_asistio",
      montoCita: 15000,
    },
  ]);

  // ── Pagos ────────────────────────────────────────────────────────────────────
  await Pago.insertMany([
    // Ayer — citas realizadas cobradas
    {
      tenantId: tenant._id,
      citaId: citas[3]._id,
      pacienteId: p1._id,
      monto: 15000,
      fechaPago: daysAgo(1),
      metodo: "transferencia",
      tipoPago: "al_llegar",
      creadoPor: admin._id,
    },
    {
      tenantId: tenant._id,
      citaId: citas[4]._id,
      pacienteId: p3._id,
      monto: 9000, // pago parcial → deuda
      fechaPago: daysAgo(1),
      metodo: "efectivo",
      tipoPago: "al_llegar",
      notas: "Pago parcial, resta $9000",
      creadoPor: doctor2._id,
    },
    // Hace 2 días
    {
      tenantId: tenant._id,
      citaId: citas[5]._id,
      pacienteId: p2._id,
      monto: 15000,
      fechaPago: daysAgo(2),
      metodo: "tarjeta",
      tipoPago: "al_llegar",
      creadoPor: admin._id,
    },
    // Hace 3 días
    {
      tenantId: tenant._id,
      citaId: citas[7]._id,
      pacienteId: p1._id,
      monto: 15000,
      fechaPago: daysAgo(3),
      metodo: "efectivo",
      tipoPago: "al_llegar",
      creadoPor: admin._id,
    },
    // Hace 5 días
    {
      tenantId: tenant._id,
      citaId: citas[8]._id,
      pacienteId: p4._id,
      monto: 15000,
      fechaPago: daysAgo(5),
      metodo: "transferencia",
      tipoPago: "al_llegar",
      creadoPor: doctor2._id,
    },
    // Adelanto de p1 para próxima sesión
    {
      tenantId: tenant._id,
      citaId: null,
      pacienteId: p1._id,
      monto: 15000,
      fechaPago: today,
      metodo: "transferencia",
      tipoPago: "adelantado",
      notas: "Adelanto para sesión de hoy",
      creadoPor: admin._id,
    },
  ]);

  console.log("\n══════════════════════════════════════════");
  console.log("  Seed completado exitosamente");
  console.log("══════════════════════════════════════════");
  console.log("\n  Credenciales de acceso:");
  console.log("  ┌─ Admin ──────────────────────────────┐");
  console.log("  │  email:    demo@psicogestion.com      │");
  console.log("  │  password: Demo1234!                  │");
  console.log("  └──────────────────────────────────────┘");
  console.log("  ┌─ Doctor ─────────────────────────────┐");
  console.log("  │  email:    martin@psicogestion.com    │");
  console.log("  │  password: Doctor123!                 │");
  console.log("  └──────────────────────────────────────┘");
  console.log("\n  Datos creados:");
  console.log(`  • 1 tenant: "${tenant.name}"`);
  console.log("  • 2 usuarios (1 admin + 1 doctor)");
  console.log("  • 5 pacientes (3 activos, 2 en deuda)");
  console.log("  • 1 tutor (para paciente menor)");
  console.log("  • 10 citas (3 hoy, 7 historial)");
  console.log("  • 6 pagos");
  console.log("");

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("Error en seed:", err);
  process.exit(1);
});
