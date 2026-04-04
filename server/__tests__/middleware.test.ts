import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { request, createTestUser } from "./helpers.js";

describe("Auth Middleware", () => {
  it("returns 401 without Authorization header", async () => {
    const res = await request.get("/api/pacientes");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token/i);
  });

  it("returns 401 with malformed token", async () => {
    const res = await request
      .get("/api/pacientes")
      .set("Authorization", "Bearer not.a.valid.jwt");
    expect(res.status).toBe(401);
  });

  it("returns 401 with expired token", async () => {
    const { user, tenant } = await createTestUser();
    const expiredToken = jwt.sign(
      { userId: String(user._id), tenantId: String(tenant._id), rol: "admin" },
      process.env.JWT_SECRET!,
      { expiresIn: "0s" },
    );

    const res = await request
      .get("/api/pacientes")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it("succeeds with valid token", async () => {
    const { token } = await createTestUser();
    const res = await request
      .get("/api/pacientes")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("returns 403 for doctor trying admin-only route", async () => {
    const { token } = await createTestUser({ rol: "doctor" });
    const res = await request
      .post("/api/doctores")
      .set("Authorization", `Bearer ${token}`)
      .send({
        nombre: "New Doctor",
        email: "new@test.com",
        especialidad: "clinica",
      });
    expect(res.status).toBe(403);
  });
});
