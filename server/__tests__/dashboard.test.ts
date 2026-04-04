import { describe, it, expect, beforeEach } from "vitest";
import { request, createTestUser } from "./helpers.js";
import { Paciente } from "../models/Paciente.js";
import { Cita } from "../models/Cita.js";
import { Pago } from "../models/Pago.js";

describe("Dashboard Routes", () => {
  let token: string;
  let tenantId: string;
  let userId: string;

  beforeEach(async () => {
    const ctx = await createTestUser();
    token = ctx.token;
    tenantId = String(ctx.tenant._id);
    userId = String(ctx.user._id);
  });

  describe("GET /api/dashboard/stats", () => {
    it("returns all expected stat fields", async () => {
      const res = await request
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        citasHoy: expect.any(Number),
        citasHoyPendientes: expect.any(Number),
        pacientesActivos: expect.any(Number),
        pacientesNuevosMes: expect.any(Number),
        ingresosMes: expect.any(Number),
        ingresosVariacion: expect.any(Number),
        deudasTotal: expect.any(Number),
        pacientesEnDeuda: expect.any(Number),
        ingresosUltimos7Dias: expect.any(Array),
        alertas: expect.any(Array),
        citasDelDia: expect.any(Array),
      });
    });

    it("counts active pacientes correctly", async () => {
      await Paciente.create([
        { tenantId, nombre: "A", apellido: "B", fechaNacimiento: new Date(), esMenor: false, genero: "F", estado: "activo" },
        { tenantId, nombre: "C", apellido: "D", fechaNacimiento: new Date(), esMenor: false, genero: "M", estado: "activo" },
        { tenantId, nombre: "E", apellido: "F", fechaNacimiento: new Date(), esMenor: false, genero: "F", estado: "inactivo" },
      ]);

      const res = await request
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.pacientesActivos).toBe(2);
    });

    it("counts today's appointments", async () => {
      const paciente = await Paciente.create({
        tenantId,
        nombre: "Test",
        apellido: "Patient",
        fechaNacimiento: new Date(),
        esMenor: false,
        genero: "F",
      });

      const today = new Date();
      today.setHours(12, 0, 0, 0);

      await Cita.create({
        tenantId,
        pacienteId: paciente._id,
        doctorId: userId,
        fecha: today,
        horaInicio: "14:00",
        horaFin: "15:00",
      });

      const res = await request
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.citasHoy).toBe(1);
      expect(res.body.citasDelDia).toHaveLength(1);
    });

    it("returns 401 without auth", async () => {
      const res = await request.get("/api/dashboard/stats");
      expect(res.status).toBe(401);
    });
  });
});
