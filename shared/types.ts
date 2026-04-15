// Shared TypeScript types used by both frontend and backend

export interface AuthPayload {
  userId: string;
  tenantId: string | null;  // null for superadmin
  rol: "admin" | "doctor" | "superadmin";
}

// --- DTOs returned by the API ---

export interface TenantDTO {
  _id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  settings: {
    currency: string;
    timezone: string;
    sessionPrice: number;
  };
}

export interface UserDTO {
  _id: string;
  tenantId: string | null;   // null for superadmin
  nombre: string;
  email: string;
  rol: "admin" | "doctor" | "superadmin";
  especialidad: string;
  activo: boolean;
  timezone: string;
  createdAt: string;
}

export interface TutorDTO {
  _id: string;
  tenantId: string;
  nombre: string;
  apellido: string;
  relacion: "padre" | "madre" | "tutor_legal" | "otro";
  telefono: string;
  email: string;
  documento: string;
  fechaRegistro: string;
}

export interface PacienteDTO {
  _id: string;
  tenantId: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  esMenor: boolean;
  genero: "M" | "F" | "Otro";
  telefono: string;
  email: string;
  direccion: string;
  notasClinicas: string;
  motivoConsulta: string;
  estado: "activo" | "inactivo" | "en_deuda";
  tutor?: TutorDTO;
  doctorAsignado?: string;
  fechaRegistro: string;
}

export interface CitaDTO {
  _id: string;
  tenantId: string;
  pacienteId: string;
  paciente?: Pick<PacienteDTO, "_id" | "nombre" | "apellido">;
  doctorId: string;
  doctor?: Pick<UserDTO, "_id" | "nombre">;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipoSesion: "inicial" | "seguimiento" | "evaluacion" | "otra";
  estado: "programada" | "realizada" | "cancelada" | "no_asistio";
  notas: string;
  montoCita: number;
  fechaCreacion: string;
  googleMeetLink?: string;
}

export interface PagoDTO {
  _id: string;
  tenantId: string;
  citaId?: string;
  pacienteId: string;
  paciente?: Pick<PacienteDTO, "_id" | "nombre" | "apellido">;
  monto: number;
  fechaPago: string;
  metodo: "efectivo" | "transferencia" | "tarjeta";
  tipoPago: "adelantado" | "al_llegar" | "deuda";
  notas: string;
  creadoPor: string;
}

export interface DashboardStats {
  citasHoy: number;
  citasHoyPendientes: number;
  pacientesActivos: number;
  pacientesNuevosMes: number;
  ingresosMes: number;
  ingresosVariacion: number;
  deudasTotal: number;
  pacientesEnDeuda: number;
  ingresosUltimos7Dias: { dia: string; monto: number }[];
  alertas: Alerta[];
  citasDelDia: CitaDelDia[];
}

export interface Alerta {
  tipo: "deuda" | "cita_proxima" | "pago_adelantado";
  mensaje: string;
  detalle: string;
  monto?: number;
}

export interface CitaDelDia {
  hora: string;
  paciente: string;
  tipo: string;
  doctor: string;
  estado: "Confirmada" | "Pendiente";
}

export interface BloqueoDTO {
  _id: string;
  doctorId: string;
  fecha: string;       // ISO date string
  horaInicio: string;  // "HH:MM"
  horaFin: string;     // "HH:MM"
}

// --- Auth responses ---

export interface LoginResponse {
  token: string;
  user: UserDTO;
  tenant: TenantDTO | null;
}

export interface RegisterResponse {
  token: string;
  user: UserDTO;
  tenant: TenantDTO;
}
