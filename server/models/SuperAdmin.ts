import { Schema, model, Document } from "mongoose";

export interface ISuperAdmin extends Document {
  nombre: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const SuperAdminSchema = new Schema<ISuperAdmin>(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const SuperAdmin = model<ISuperAdmin>("SuperAdmin", SuperAdminSchema);
