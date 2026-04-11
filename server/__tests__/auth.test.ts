import { describe, it, expect } from "vitest";
import { request, createTestUser } from "./helpers.js";

describe("Auth Routes", () => {
  describe("POST /api/auth/register", () => {
    it("creates a tenant, user and returns a token", async () => {
      const res = await request.post("/api/auth/register").send({
        nombreConsultorio: "Mi Consultorio",
        nombre: "Dr. Test",
        email: "doctor@test.com",
        especialidad: "clinica",
        password: "Password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.nombre).toBe("Dr. Test");
      expect(res.body.user.email).toBe("doctor@test.com");
      expect(res.body.user.rol).toBe("admin");
      expect(res.body.tenant.name).toBe("Mi Consultorio");
      expect(res.body.tenant.slug).toMatch(/^mi-consultorio/);
      // passwordHash must not leak
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it("returns 400 on missing fields", async () => {
      const res = await request.post("/api/auth/register").send({
        nombre: "Test",
      });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("returns 400 on short password", async () => {
      const res = await request.post("/api/auth/register").send({
        nombreConsultorio: "Test",
        nombre: "Dr. Test",
        email: "test@test.com",
        especialidad: "clinica",
        password: "short",
      });
      expect(res.status).toBe(400);
    });

    it("stores and returns explicit timezone", async () => {
      const res = await request.post("/api/auth/register").send({
        nombreConsultorio: "Consultorio Lima",
        nombre: "Dr. Lima",
        email: "lima@test.com",
        especialidad: "clinica",
        password: "Password123",
        timezone: "America/Lima",
      });

      expect(res.status).toBe(201);
      expect(res.body.user.timezone).toBe("America/Lima");
    });

    it("uses default timezone when omitted", async () => {
      const res = await request.post("/api/auth/register").send({
        nombreConsultorio: "Sin Timezone",
        nombre: "Dr. Default",
        email: "default-tz@test.com",
        especialidad: "clinica",
        password: "Password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.user.timezone).toBe("America/Lima");
    });

    it("returns 400 for invalid timezone on register", async () => {
      const res = await request.post("/api/auth/register").send({
        nombreConsultorio: "Bad Tz",
        nombre: "Dr. Bad",
        email: "bad-tz@test.com",
        especialidad: "clinica",
        password: "Password123",
        timezone: "not/a/timezone",
      });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns token for valid credentials", async () => {
      // First register
      await request.post("/api/auth/register").send({
        nombreConsultorio: "Login Test",
        nombre: "Dr. Login",
        email: "login@test.com",
        especialidad: "clinica",
        password: "Password123",
      });

      const res = await request.post("/api/auth/login").send({
        email: "login@test.com",
        password: "Password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("login@test.com");
    });

    it("returns 401 for wrong password", async () => {
      await request.post("/api/auth/register").send({
        nombreConsultorio: "Wrong Pass",
        nombre: "Dr. Wrong",
        email: "wrong@test.com",
        especialidad: "clinica",
        password: "Password123",
      });

      const res = await request.post("/api/auth/login").send({
        email: "wrong@test.com",
        password: "WrongPassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/inválidas/i);
    });

    it("returns 401 for non-existent email", async () => {
      const res = await request.post("/api/auth/login").send({
        email: "noexist@test.com",
        password: "Password123",
      });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns current user when authenticated", async () => {
      const { token } = await createTestUser();

      const res = await request
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.nombre).toBe("Test User");
    });

    it("returns 401 without token", async () => {
      const res = await request.get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns 401 with invalid token", async () => {
      const res = await request
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token-here");
      expect(res.status).toBe(401);
    });

    it("includes timezone in response", async () => {
      const { token } = await createTestUser();
      const res = await request
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.timezone).toBe("America/Lima");
    });
  });

  describe("PATCH /api/auth/me", () => {
    it("updates nombre and timezone", async () => {
      const { token } = await createTestUser();

      const res = await request
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: "Dr. Actualizado", timezone: "America/Bogota" });

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe("Dr. Actualizado");
      expect(res.body.timezone).toBe("America/Bogota");
      expect(res.body.passwordHash).toBeUndefined();
    });

    it("returns 401 without token", async () => {
      const res = await request
        .patch("/api/auth/me")
        .send({ nombre: "Hacker" });

      expect(res.status).toBe(401);
    });

    it("returns 409 if email is already taken by another user in same tenant", async () => {
      const ctx = await createTestUser({ email: "original@test.com" });
      await createTestUser({ email: "taken@test.com", tenantId: String(ctx.tenant._id) });

      const res = await request
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${ctx.token}`)
        .send({ email: "taken@test.com" });

      expect(res.status).toBe(409);
    });

    it("allows updating to same email (no-op)", async () => {
      const { token } = await createTestUser({ email: "same@test.com" });

      const res = await request
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "same@test.com" });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("same@test.com");
    });

    it("allows email that exists in a different tenant", async () => {
      const ctx1 = await createTestUser({ email: "cross1@test.com" });
      // Create user in a DIFFERENT tenant (no tenantId override → new tenant)
      await createTestUser({ email: "cross2@test.com" });

      const res = await request
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${ctx1.token}`)
        .send({ email: "cross2@test.com" });

      // Should succeed because cross2@test.com is in a different tenant
      expect(res.status).toBe(200);
      expect(res.body.email).toBe("cross2@test.com");
    });

    it("returns 400 for invalid timezone on PATCH /me", async () => {
      const { token } = await createTestUser();
      const res = await request
        .patch("/api/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ timezone: "garbage" });
      expect(res.status).toBe(400);
    });
  });
});
