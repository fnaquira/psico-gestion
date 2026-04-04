import { describe, it, expect, beforeEach } from "vitest";
import { request, createTestUser } from "./helpers.js";
import { Paciente } from "../models/Paciente.js";

describe("Pacientes Routes", () => {
  let token: string;
  let tenantId: string;

  beforeEach(async () => {
    const ctx = await createTestUser();
    token = ctx.token;
    tenantId = String(ctx.tenant._id);
  });

  describe("GET /api/pacientes", () => {
    it("returns empty list initially", async () => {
      const res = await request
        .get("/api/pacientes")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it("returns paginated list", async () => {
      await Paciente.create({
        tenantId,
        nombre: "Ana",
        apellido: "Silva",
        fechaNacimiento: new Date("1990-01-01"),
        esMenor: false,
        genero: "F",
      });

      const res = await request
        .get("/api/pacientes")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].nombre).toBe("Ana");
      expect(res.body.total).toBe(1);
    });

    it("filters by search term", async () => {
      await Paciente.create([
        { tenantId, nombre: "Ana", apellido: "Silva", fechaNacimiento: new Date("1990-01-01"), esMenor: false, genero: "F" },
        { tenantId, nombre: "Carlos", apellido: "Martinez", fechaNacimiento: new Date("1985-05-10"), esMenor: false, genero: "M" },
      ]);

      const res = await request
        .get("/api/pacientes?search=Carlos")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].nombre).toBe("Carlos");
    });
  });

  describe("GET /api/pacientes/:id", () => {
    it("returns a single paciente", async () => {
      const paciente = await Paciente.create({
        tenantId,
        nombre: "Laura",
        apellido: "Gomez",
        fechaNacimiento: new Date("1995-03-15"),
        esMenor: false,
        genero: "F",
      });

      const res = await request
        .get(`/api/pacientes/${paciente._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe("Laura");
    });

    it("returns 404 for another tenant", async () => {
      const other = await createTestUser({ email: "other@test.com" });
      const paciente = await Paciente.create({
        tenantId: other.tenant._id,
        nombre: "Otro",
        apellido: "Tenant",
        fechaNacimiento: new Date("1990-01-01"),
        esMenor: false,
        genero: "M",
      });

      const res = await request
        .get(`/api/pacientes/${paciente._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/pacientes", () => {
    it("creates a paciente", async () => {
      const res = await request
        .post("/api/pacientes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nombre: "Roberto",
          apellido: "Silva",
          fechaNacimiento: "2000-06-15",
          esMenor: false,
          genero: "M",
          telefono: "1234567890",
        });

      expect(res.status).toBe(201);
      expect(res.body.nombre).toBe("Roberto");
      expect(res.body.estado).toBe("activo");
    });

    it("creates a paciente with tutor when esMenor", async () => {
      const res = await request
        .post("/api/pacientes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          nombre: "Pedro",
          apellido: "Menor",
          fechaNacimiento: "2015-01-01",
          esMenor: true,
          genero: "M",
          tutor: {
            nombre: "Maria",
            apellido: "Madre",
            relacion: "madre",
            telefono: "9876543210",
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.nombre).toBe("Pedro");
    });

    it("returns 400 on missing required fields", async () => {
      const res = await request
        .post("/api/pacientes")
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: "OnlyName" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe("PUT /api/pacientes/:id", () => {
    it("updates paciente fields", async () => {
      const paciente = await Paciente.create({
        tenantId,
        nombre: "Update",
        apellido: "Me",
        fechaNacimiento: new Date("1990-01-01"),
        esMenor: false,
        genero: "F",
      });

      const res = await request
        .put(`/api/pacientes/${paciente._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ nombre: "Updated" });

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe("Updated");
    });
  });

  describe("DELETE /api/pacientes/:id", () => {
    it("soft-deletes by setting estado to inactivo", async () => {
      const paciente = await Paciente.create({
        tenantId,
        nombre: "Delete",
        apellido: "Me",
        fechaNacimiento: new Date("1990-01-01"),
        esMenor: false,
        genero: "F",
      });

      const res = await request
        .delete(`/api/pacientes/${paciente._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const updated = await Paciente.findById(paciente._id);
      expect(updated?.estado).toBe("inactivo");
    });
  });
});
