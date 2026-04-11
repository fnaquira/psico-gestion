import { Schema, model, Document, Types } from "mongoose";

export interface IGoogleCalendar {
  accessToken?: string;        // AES-256 encrypted
  refreshToken?: string;       // AES-256 encrypted
  calendarId?: string;
  syncEnabled: boolean;
  connectedAt?: Date;
  lastInboundSyncAt?: Date;
}

export interface IUser extends Document {
  tenantId: Types.ObjectId;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: "admin" | "doctor";
  especialidad: "clinica" | "infantil" | "educativa" | "neuropsicologia" | "organizacional" | "otra";
  activo: boolean;
  createdAt: Date;
  googleCalendar?: IGoogleCalendar;
}

const UserSchema = new Schema<IUser>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    rol: { type: String, enum: ["admin", "doctor"], default: "doctor" },
    especialidad: {
      type: String,
      enum: ["clinica", "infantil", "educativa", "neuropsicologia", "organizacional", "otra"],
      default: "clinica",
    },
    activo: { type: Boolean, default: true },
    googleCalendar: {
      accessToken: { type: String },
      refreshToken: { type: String },
      calendarId: { type: String, default: "primary" },
      syncEnabled: { type: Boolean, default: true },
      connectedAt: { type: Date },
      lastInboundSyncAt: { type: Date },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export const User = model<IUser>("User", UserSchema);
