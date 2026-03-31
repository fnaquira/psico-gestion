import { Schema, model, Document, Types } from "mongoose";

export interface ITutor extends Document {
  tenantId: Types.ObjectId;
  nombre: string;
  apellido: string;
  relacion: "padre" | "madre" | "tutor_legal" | "otro";
  telefono: string;
  email: string;
  documento: string;
  fechaRegistro: Date;
}

const TutorSchema = new Schema<ITutor>({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, required: true, trim: true },
  relacion: { type: String, enum: ["padre", "madre", "tutor_legal", "otro"], required: true },
  telefono: { type: String, default: "" },
  email: { type: String, default: "", lowercase: true, trim: true },
  documento: { type: String, default: "" },
  fechaRegistro: { type: Date, default: Date.now },
});

export const Tutor = model<ITutor>("Tutor", TutorSchema);
