import { Schema, model, Document } from "mongoose";

export interface ITenant extends Document {
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  settings: {
    currency: string;
    timezone: string;
    sessionPrice: number;
  };
  createdAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    settings: {
      currency: { type: String, default: "ARS" },
      timezone: { type: String, default: "America/Lima" },
      sessionPrice: { type: Number, default: 0 },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Tenant = model<ITenant>("Tenant", TenantSchema);
