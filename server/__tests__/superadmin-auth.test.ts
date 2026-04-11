import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { SuperAdmin } from "../models/SuperAdmin.js";
import { request } from "./helpers.js";

describe("SuperAdmin Login", () => {
  it("returns superadmin token when credentials are valid", async () => {
    const passwordHash = await bcrypt.hash("Admin1234!", 4);
    await SuperAdmin.create({
      nombre: "Super Admin",
      email: "admin@psicogestion.com",
      passwordHash,
    });

    const res = await request.post("/api/auth/login").send({
      email: "admin@psicogestion.com",
      password: "Admin1234!",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.rol).toBe("superadmin");
    expect(res.body.user.tenantId).toBeNull();
    expect(res.body.tenant).toBeNull();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("returns 401 for invalid superadmin password", async () => {
    const passwordHash = await bcrypt.hash("Admin1234!", 4);
    await SuperAdmin.create({
      nombre: "Super Admin",
      email: "admin2@psicogestion.com",
      passwordHash,
    });

    const res = await request.post("/api/auth/login").send({
      email: "admin2@psicogestion.com",
      password: "WrongPassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/inválidas/i);
  });

  it("returns 401 when email does not exist in either collection", async () => {
    const res = await request.post("/api/auth/login").send({
      email: "nobody@nowhere.com",
      password: "SomePassword123",
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/inválidas/i);
  });

  it("does NOT fall through to superadmin if user email exists (even with different password)", async () => {
    await request.post("/api/auth/register").send({
      nombreConsultorio: "Overlap Clinic",
      nombre: "Dr. Overlap",
      email: "overlap@test.com",
      especialidad: "clinica",
      password: "Password123",
    });
    const passwordHash = await bcrypt.hash("AdminPass!", 4);
    await SuperAdmin.create({
      nombre: "Overlap Admin",
      email: "overlap@test.com",
      passwordHash,
    });

    // Using the superadmin password on a user email — should fail (not fall through)
    const res = await request.post("/api/auth/login").send({
      email: "overlap@test.com",
      password: "AdminPass!",
    });
    expect(res.status).toBe(401);
  });
});
