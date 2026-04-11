import { Schema, model, Document, Types } from "mongoose";

export interface IBloqueo extends Document {
  doctorId: Types.ObjectId;
  tenantId: Types.ObjectId;
  googleCalendarEventId: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  updatedAt: Date;
}

const BloqueoSchema = new Schema<IBloqueo>({
  doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
  googleCalendarEventId: { type: String, required: true },
  fecha: { type: Date, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

BloqueoSchema.index({ doctorId: 1, googleCalendarEventId: 1 }, { unique: true });
BloqueoSchema.index({ tenantId: 1, doctorId: 1, fecha: 1 });

export const Bloqueo = model<IBloqueo>("Bloqueo", BloqueoSchema);
