import supertest from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { Tenant } from "../models/Tenant.js";
import { User } from "../models/User.js";
import { SuperAdmin } from "../models/SuperAdmin.js";

export const app = createApp();
export const request = supertest(app);

interface TestContext {
  tenant: InstanceType<typeof Tenant>;
  user: InstanceType<typeof User>;
  token: string;
}

export async function createTestUser(
  overrides: {
    rol?: "admin" | "doctor";
    email?: string;
    nombre?: string;
    tenantId?: string;
    timezone?: string;
  } = {},
): Promise<TestContext> {
  const tenant =
    overrides.tenantId
      ? await Tenant.findById(overrides.tenantId)
      : await Tenant.create({
          name: "Test Consultorio",
          slug: `test-${Date.now()}`,
        });

  if (!tenant) throw new Error("Tenant not found");

  const passwordHash = await bcrypt.hash("TestPass123", 4); // low rounds for speed
  const user = await User.create({
    tenantId: tenant._id,
    nombre: overrides.nombre ?? "Test User",
    email: overrides.email ?? `test-${Date.now()}@test.com`,
    passwordHash,
    rol: overrides.rol ?? "admin",
    especialidad: "clinica",
    ...(overrides.timezone ? { timezone: overrides.timezone } : {}),
  });

  const token = jwt.sign(
    { userId: String(user._id), tenantId: String(tenant._id), rol: user.rol },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" },
  );

  return { tenant: tenant as any, user: user as any, token };
}

export async function createSuperAdminToken(): Promise<{
  superAdmin: InstanceType<typeof SuperAdmin>;
  token: string;
}> {
  const passwordHash = await bcrypt.hash("SuperPass123", 4);
  const superAdmin = await SuperAdmin.create({
    nombre: "Test Super Admin",
    email: `superadmin-${Date.now()}@test.com`,
    passwordHash,
  });
  const token = jwt.sign(
    { userId: String(superAdmin._id), tenantId: null, rol: "superadmin" },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" },
  );
  return { superAdmin: superAdmin as any, token };
}
