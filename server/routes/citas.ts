import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { Cita } from "../models/Cita.js";

const router = Router();

const citaSchema = z.object({
  pacienteId: z.string().min(1),
  doctorId: z.string().min(1),
  fecha: z.string(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/),
  tipoSesion: z.enum(["inicial", "seguimiento", "evaluacion", "otra"]).default("seguimiento"),
  estado: z.enum(["programada", "realizada", "cancelada", "no_asistio"]).default("programada"),
  notas: z.string().default(""),
  montoCita: z.number().min(0).default(0),
});

// GET /api/citas?fecha=YYYY-MM-DD&doctorId=xxx
router.get("/", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const { fecha, doctorId } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { tenantId };

  if (fecha) {
    const start = new Date(fecha);
    const end = new Date(start.getTime() + 86400000);
    filter.fecha = { $gte: start, $lt: end };
  }

  if (doctorId) filter.doctorId = doctorId;

  const citas = await Cita.find(filter)
    .populate("pacienteId", "nombre apellido")
    .populate("doctorId", "nombre especialidad")
    .sort({ horaInicio: 1 })
    .lean();

  res.json(citas);
});

// GET /api/citas/:id
router.get("/:id", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const cita = await Cita.findOne({ _id: req.params.id, tenantId })
    .populate("pacienteId", "nombre apellido")
    .populate("doctorId", "nombre")
    .lean();
  if (!cita) {
    res.status(404).json({ error: "Cita no encontrada" });
    return;
  }
  res.json(cita);
});

// POST /api/citas
router.post("/", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const result = citaSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }
  const cita = await Cita.create({
    tenantId,
    ...result.data,
    fecha: new Date(result.data.fecha),
  });
  const populated = await cita.populate([
    { path: "pacienteId", select: "nombre apellido" },
    { path: "doctorId", select: "nombre" },
  ]);
  res.status(201).json(populated);
});

// PUT /api/citas/:id
router.put("/:id", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const result = citaSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }
  const update: Record<string, unknown> = { ...result.data };
  if (update.fecha) update.fecha = new Date(update.fecha as string);

  const cita = await Cita.findOneAndUpdate({ _id: req.params.id, tenantId }, update, {
    new: true,
  })
    .populate("pacienteId", "nombre apellido")
    .populate("doctorId", "nombre");
  if (!cita) {
    res.status(404).json({ error: "Cita no encontrada" });
    return;
  }
  res.json(cita);
});

// DELETE /api/citas/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const cita = await Cita.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    { estado: "cancelada" },
    { new: true },
  );
  if (!cita) {
    res.status(404).json({ error: "Cita no encontrada" });
    return;
  }
  res.json({ ok: true });
});

export default router;
