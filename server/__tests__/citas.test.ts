import { describe, it, expect, beforeEach } from "vitest";
import { request, createTestUser } from "./helpers.js";
import { Paciente } from "../models/Paciente.js";
import { Cita } from "../models/Cita.js";

describe("Citas Routes", () => {
  let token: string;
  let tenantId: string;
  let doctorId: string;
  let pacienteId: string;

  beforeEach(async () => {
    const ctx = await createTestUser();
    token = ctx.token;
    tenantId = String(ctx.tenant._id);
    doctorId = String(ctx.user._id);

    const paciente = await Paciente.create({
      tenantId,
      nombre: "Ana",
      apellido: "Silva",
      fechaNacimiento: new Date("1990-01-01"),
      esMenor: false,
      genero: "F",
    });
    pacienteId = String(paciente._id);
  });

  describe("GET /api/citas", () => {
    it("returns empty list initially", async () => {
      const res = await request
        .get("/api/citas")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("filters by fecha", async () => {
      const fecha = new Date("2026-04-10");
      await Cita.create({
        tenantId,
        pacienteId,
        doctorId,
        fecha,
        horaInicio: "09:00",
        horaFin: "10:00",
      });
      await Cita.create({
        tenantId,
        pacienteId,
        doctorId,
        fecha: new Date("2026-04-11"),
        horaInicio: "09:00",
        horaFin: "10:00",
      });

      const res = await request
        .get("/api/citas?fecha=2026-04-10")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("returns populated paciente and doctor fields", async () => {
      await Cita.create({
        tenantId,
        pacienteId,
        doctorId,
        fecha: new Date("2026-04-10"),
        horaInicio: "09:00",
        horaFin: "10:00",
      });

      const res = await request
        .get("/api/citas?fecha=2026-04-10")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      const cita = res.body[0];
      expect(cita.paciente).toBeDefined();
      expect(cita.paciente.nombre).toBe("Ana");
      expect(cita.doctor).toBeDefined();
      expect(cita.doctor.nombre).toBe("Test User");
      // pacienteId and doctorId should be string IDs
      expect(cita.pacienteId).toBe(pacienteId);
      expect(cita.doctorId).toBe(doctorId);
    });

    it("supports date range with desde/hasta", async () => {
      await Cita.create([
        { tenantId, pacienteId, doctorId, fecha: new Date("2026-04-10"), horaInicio: "09:00", horaFin: "10:00" },
        { tenantId, pacienteId, doctorId, fecha: new Date("2026-04-11"), horaInicio: "09:00", horaFin: "10:00" },
        { tenantId, pacienteId, doctorId, fecha: new Date("2026-04-12"), horaInicio: "09:00", horaFin: "10:00" },
      ]);

      const res = await request
        .get("/api/citas?desde=2026-04-10&hasta=2026-04-12")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2); // 10 and 11, not 12 (lt)
    });
  });

  describe("GET /api/citas/:id", () => {
    it("returns a single cita with populated fields", async () => {
      const cita = await Cita.create({
        tenantId,
        pacienteId,
        doctorId,
        fecha: new Date("2026-04-10"),
        horaInicio: "14:00",
        horaFin: "15:00",
        tipoSesion: "inicial",
      });

      const res = await request
        .get(`/api/citas/${cita._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.paciente).toBeDefined();
      expect(res.body.tipoSesion).toBe("inicial");
    });

    it("returns 404 for non-existent cita", async () => {
      const res = await request
        .get("/api/citas/000000000000000000000000")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/citas", () => {
    it("creates a cita", async () => {
      const res = await request
        .post("/api/citas")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pacienteId,
          doctorId,
          fecha: "2026-04-15",
          horaInicio: "10:00",
          horaFin: "11:00",
          tipoSesion: "inicial",
          montoCita: 5000,
        });

      expect(res.status).toBe(201);
      expect(res.body.paciente).toBeDefined();
      expect(res.body.montoCita).toBe(5000);
      expect(res.body.estado).toBe("programada");
    });

    it("returns 400 on invalid horaInicio format", async () => {
      const res = await request
        .post("/api/citas")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pacienteId,
          doctorId,
          fecha: "2026-04-15",
          horaInicio: "invalid",
          horaFin: "11:00",
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe("PUT /api/citas/:id", () => {
    it("updates cita fields", async () => {
      const cita = await Cita.create({
        tenantId,
        pacienteId,
        doctorId,
        fecha: new Date("2026-04-15"),
        horaInicio: "10:00",
        horaFin: "11:00",
      });

      const res = await request
        .put(`/api/citas/${cita._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ estado: "realizada", notas: "Sesion completada" });

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe("realizada");
      expect(res.body.notas).toBe("Sesion completada");
    });
  });

  describe("DELETE /api/citas/:id", () => {
    it("soft-cancels by setting estado to cancelada", async () => {
      const cita = await Cita.create({
        tenantId,
        pacienteId,
        doctorId,
        fecha: new Date("2026-04-15"),
        horaInicio: "10:00",
        horaFin: "11:00",
      });

      const res = await request
        .delete(`/api/citas/${cita._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const updated = await Cita.findById(cita._id);
      expect(updated?.estado).toBe("cancelada");
    });
  });

  describe("Multi-tenancy", () => {
    it("cannot see citas from another tenant", async () => {
      const other = await createTestUser({ email: "other@test.com" });
      const otherPaciente = await Paciente.create({
        tenantId: other.tenant._id,
        nombre: "Other",
        apellido: "Patient",
        fechaNacimiento: new Date("1990-01-01"),
        esMenor: false,
        genero: "M",
      });

      await Cita.create({
        tenantId: other.tenant._id,
        pacienteId: otherPaciente._id,
        doctorId: other.user._id,
        fecha: new Date("2026-04-10"),
        horaInicio: "09:00",
        horaFin: "10:00",
      });

      const res = await request
        .get("/api/citas?fecha=2026-04-10")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body).toHaveLength(0);
    });
  });
});
