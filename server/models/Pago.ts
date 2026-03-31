import { Schema, model, Document, Types } from "mongoose";

export interface IPago extends Document {
  tenantId: Types.ObjectId;
  citaId: Types.ObjectId | null;
  pacienteId: Types.ObjectId;
  monto: number;
  fechaPago: Date;
  metodo: "efectivo" | "transferencia" | "tarjeta";
  tipoPago: "adelantado" | "al_llegar" | "deuda";
  notas: string;
  creadoPor: Types.ObjectId;
}

const PagoSchema = new Schema<IPago>({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  citaId: { type: Schema.Types.ObjectId, ref: "Cita", default: null },
  pacienteId: { type: Schema.Types.ObjectId, ref: "Paciente", required: true },
  monto: { type: Number, required: true, min: 0 },
  fechaPago: { type: Date, default: Date.now },
  metodo: { type: String, enum: ["efectivo", "transferencia", "tarjeta"], required: true },
  tipoPago: { type: String, enum: ["adelantado", "al_llegar", "deuda"], required: true },
  notas: { type: String, default: "" },
  creadoPor: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

PagoSchema.index({ tenantId: 1, pacienteId: 1 });
PagoSchema.index({ tenantId: 1, fechaPago: -1 });

export const Pago = model<IPago>("Pago", PagoSchema);
