import { Schema, model, Document, Types } from "mongoose";

export interface IPaciente extends Document {
  tenantId: Types.ObjectId;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  esMenor: boolean;
  genero: "M" | "F" | "Otro";
  telefono: string;
  email: string;
  direccion: string;
  notasClinicas: string;
  estado: "activo" | "inactivo" | "en_deuda";
  tutorId: Types.ObjectId | null;
  doctorAsignado: Types.ObjectId | null;
  fechaRegistro: Date;
}

const PacienteSchema = new Schema<IPaciente>({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, required: true, trim: true },
  fechaNacimiento: { type: Date, required: true },
  esMenor: { type: Boolean, default: false },
  genero: { type: String, enum: ["M", "F", "Otro"], default: "Otro" },
  telefono: { type: String, default: "" },
  email: { type: String, default: "", lowercase: true, trim: true },
  direccion: { type: String, default: "" },
  notasClinicas: { type: String, default: "" },
  estado: { type: String, enum: ["activo", "inactivo", "en_deuda"], default: "activo" },
  tutorId: { type: Schema.Types.ObjectId, ref: "Tutor", default: null },
  doctorAsignado: { type: Schema.Types.ObjectId, ref: "User", default: null },
  fechaRegistro: { type: Date, default: Date.now },
});

PacienteSchema.index({ tenantId: 1, estado: 1 });
PacienteSchema.index({ tenantId: 1, nombre: "text", apellido: "text", telefono: "text" });

export const Paciente = model<IPaciente>("Paciente", PacienteSchema);
