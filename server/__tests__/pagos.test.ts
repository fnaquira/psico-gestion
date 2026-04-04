import { describe, it, expect, beforeEach } from "vitest";
import { request, createTestUser } from "./helpers.js";
import { Paciente } from "../models/Paciente.js";
import { Pago } from "../models/Pago.js";

describe("Pagos Routes", () => {
  let token: string;
  let tenantId: string;
  let userId: string;
  let pacienteId: string;

  beforeEach(async () => {
    const ctx = await createTestUser();
    token = ctx.token;
    tenantId = String(ctx.tenant._id);
    userId = String(ctx.user._id);

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

  describe("GET /api/pagos", () => {
    it("returns paginated payment list", async () => {
      await Pago.create({
        tenantId,
        pacienteId,
        creadoPor: userId,
        monto: 5000,
        metodo: "efectivo",
        tipoPago: "al_llegar",
      });

      const res = await request
        .get("/api/pagos")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].monto).toBe(5000);
    });
  });

  describe("GET /api/pagos/deudas", () => {
    it("returns debt summary for patients en_deuda", async () => {
      await Paciente.findByIdAndUpdate(pacienteId, { estado: "en_deuda" });
      await Pago.create({
        tenantId,
        pacienteId,
        creadoPor: userId,
        monto: 3000,
        metodo: "efectivo",
        tipoPago: "deuda",
      });

      const res = await request
        .get("/api/pagos/deudas")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].deuda).toBe(3000);
      expect(res.body.totalDeuda).toBe(3000);
    });
  });

  describe("POST /api/pagos", () => {
    it("creates a payment", async () => {
      const res = await request
        .post("/api/pagos")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pacienteId,
          monto: 5000,
          metodo: "transferencia",
          tipoPago: "al_llegar",
          notas: "Pago sesion",
        });

      expect(res.status).toBe(201);
      expect(res.body.monto).toBe(5000);
      expect(res.body.metodo).toBe("transferencia");
    });

    it("returns 400 on invalid data", async () => {
      const res = await request
        .post("/api/pagos")
        .set("Authorization", `Bearer ${token}`)
        .send({
          pacienteId,
          monto: -100,
          metodo: "efectivo",
          tipoPago: "al_llegar",
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 on missing pacienteId", async () => {
      const res = await request
        .post("/api/pagos")
        .set("Authorization", `Bearer ${token}`)
        .send({
          monto: 5000,
          metodo: "efectivo",
          tipoPago: "al_llegar",
        });

      expect(res.status).toBe(400);
    });
  });
});
