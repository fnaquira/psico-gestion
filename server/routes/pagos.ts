import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { Pago } from "../models/Pago.js";
import { Paciente } from "../models/Paciente.js";

const router = Router();

const pagoSchema = z.object({
  pacienteId: z.string().min(1),
  citaId: z.string().nullable().optional(),
  monto: z.number().min(0),
  metodo: z.enum(["efectivo", "transferencia", "tarjeta"]),
  tipoPago: z.enum(["adelantado", "al_llegar", "deuda"]),
  notas: z.string().default(""),
});

// GET /api/pagos?search=&page=&limit=
router.get("/", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const { search = "", page = "1", limit = "20" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const pagos = await Pago.find({ tenantId })
    .populate("pacienteId", "nombre apellido")
    .populate("citaId", "horaInicio tipoSesion")
    .sort({ fechaPago: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  const filtered = search
    ? pagos.filter((p: any) => {
        const name = `${p.pacienteId?.nombre ?? ""} ${p.pacienteId?.apellido ?? ""}`.toLowerCase();
        return name.includes(search.toLowerCase());
      })
    : pagos;

  res.json({ data: filtered, page: pageNum, limit: limitNum });
});

// GET /api/pagos/deudas
router.get("/deudas", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;

  const pacientesDeuda = await Paciente.find({ tenantId, estado: "en_deuda" })
    .select("nombre apellido telefono fechaRegistro")
    .lean();

  const result = await Promise.all(
    pacientesDeuda.map(async p => {
      const pagosDeuda = await Pago.find({
        tenantId,
        pacienteId: p._id,
        tipoPago: "deuda",
      }).lean();

      const totalDeuda = pagosDeuda.reduce((acc, pg) => acc + pg.monto, 0);

      return {
        _id: p._id,
        nombre: `${p.nombre} ${p.apellido}`,
        telefono: p.telefono,
        deuda: totalDeuda,
        desde: p.fechaRegistro,
        sesiones: pagosDeuda.length,
      };
    }),
  );

  const totalDeuda = result.reduce((acc, p) => acc + p.deuda, 0);
  res.json({ data: result, totalDeuda, count: result.length });
});

// POST /api/pagos
router.post("/", async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!;
  const result = pagoSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const pago = await Pago.create({
    tenantId,
    creadoPor: userId,
    ...result.data,
  });

  // If paying off debt, check if patient is fully paid and update estado
  if (result.data.tipoPago === "deuda" || result.data.tipoPago === "al_llegar") {
    const pagosDeuda = await Pago.find({
      tenantId,
      pacienteId: result.data.pacienteId,
      tipoPago: "deuda",
    }).lean();

    if (pagosDeuda.length === 0) {
      await Paciente.findOneAndUpdate(
        { _id: result.data.pacienteId, tenantId, estado: "en_deuda" },
        { estado: "activo" },
      );
    }
  }

  const populated = await pago.populate("pacienteId", "nombre apellido");
  res.status(201).json(populated);
});

export default router;
