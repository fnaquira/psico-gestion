import { describe, it, expect, beforeEach } from "vitest";
import { request, createTestUser } from "./helpers.js";
import { Tutor } from "../models/Tutor.js";

describe("Tutores Routes", () => {
  let token: string;
  let tenantId: string;

  beforeEach(async () => {
    const ctx = await createTestUser();
    token = ctx.token;
    tenantId = String(ctx.tenant._id);
  });

  describe("POST /api/tutores", () => {
    it("creates a tutor", async () => {
      const res = await request
        .post("/api/tutores")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nombre: "Maria",
          apellido: "Madre",
          relacion: "madre",
          telefono: "1234567890",
          email: "maria@test.com",
          documento: "12345678",
        });

      expect(res.status).toBe(201);
      expect(res.body.nombre).toBe("Maria");
      expect(res.body.relacion).toBe("madre");
    });

    it("returns 400 on missing required fields", async () => {
      const res = await request
        .post("/api/tutores")
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: "OnlyName" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe("GET /api/tutores/:id", () => {
    it("returns a tutor", async () => {
      const tutor = await Tutor.create({
        tenantId,
        nombre: "Carlos",
        apellido: "Padre",
        relacion: "padre",
      });

      const res = await request
        .get(`/api/tutores/${tutor._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe("Carlos");
    });

    it("returns 404 for another tenant", async () => {
      const other = await createTestUser({ email: "other@test.com" });
      const tutor = await Tutor.create({
        tenantId: other.tenant._id,
        nombre: "Other",
        apellido: "Tutor",
        relacion: "padre",
      });

      const res = await request
        .get(`/api/tutores/${tutor._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/tutores/:id", () => {
    it("updates tutor fields", async () => {
      const tutor = await Tutor.create({
        tenantId,
        nombre: "Update",
        apellido: "Me",
        relacion: "padre",
      });

      const res = await request
        .put(`/api/tutores/${tutor._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ telefono: "9999999999" });

      expect(res.status).toBe(200);
      expect(res.body.telefono).toBe("9999999999");
    });
  });
});
