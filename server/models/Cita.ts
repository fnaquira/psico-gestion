import { Schema, model, Document, Types } from "mongoose";

export interface ICita extends Document {
  tenantId: Types.ObjectId;
  pacienteId: Types.ObjectId;
  doctorId: Types.ObjectId;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  tipoSesion: "inicial" | "seguimiento" | "evaluacion" | "otra";
  estado: "programada" | "realizada" | "cancelada" | "no_asistio";
  notas: string;
  montoCita: number;
  fechaCreacion: Date;
}

const CitaSchema = new Schema<ICita>({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  pacienteId: { type: Schema.Types.ObjectId, ref: "Paciente", required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fecha: { type: Date, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  tipoSesion: {
    type: String,
    enum: ["inicial", "seguimiento", "evaluacion", "otra"],
    default: "seguimiento",
  },
  estado: {
    type: String,
    enum: ["programada", "realizada", "cancelada", "no_asistio"],
    default: "programada",
  },
  notas: { type: String, default: "" },
  montoCita: { type: Number, default: 0 },
  fechaCreacion: { type: Date, default: Date.now },
});

CitaSchema.index({ tenantId: 1, fecha: 1, doctorId: 1 });
CitaSchema.index({ tenantId: 1, pacienteId: 1 });

export const Cita = model<ICita>("Cita", CitaSchema);
