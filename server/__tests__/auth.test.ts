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
  });
});
