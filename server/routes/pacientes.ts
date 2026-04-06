import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { Paciente } from "../models/Paciente.js";
import { Tutor } from "../models/Tutor.js";

const router = Router();

const pacienteSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  fechaNacimiento: z.string(),
  esMenor: z.boolean().default(false),
  genero: z.enum(["M", "F", "Otro"]).default("Otro"),
  telefono: z.string().default(""),
  email: z.string().default(""),
  direccion: z.string().default(""),
  notasClinicas: z.string().default(""),
  motivoConsulta: z.string().default(""),
  estado: z.enum(["activo", "inactivo", "en_deuda"]).default("activo"),
  doctorAsignado: z.string().nullable().default(null),
  tutor: z
    .object({
      nombre: z.string().min(1),
      apellido: z.string().min(1),
      relacion: z.enum(["padre", "madre", "tutor_legal", "otro"]),
      telefono: z.string().default(""),
      email: z.string().default(""),
      documento: z.string().default(""),
    })
    .optional(),
});

// GET /api/pacientes
router.get("/", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const { search = "", page = "1", limit = "20" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = { tenantId, estado: { $ne: "inactivo" } };
  if (search) {
    filter.$or = [
      { nombre: { $regex: search, $options: "i" } },
      { apellido: { $regex: search, $options: "i" } },
      { telefono: { $regex: search, $options: "i" } },
    ];
  }

  const [pacientesRaw, total] = await Promise.all([
    Paciente.find(filter)
      .populate("tutorId")
      .skip(skip)
      .limit(limitNum)
      .sort({ fechaRegistro: -1 })
      .lean(),
    Paciente.countDocuments(filter),
  ]);

  // Rename tutorId (populated) → tutor to match PacienteDTO shape
  const pacientes = pacientesRaw.map(({ tutorId, ...p }: any) => ({
    ...p,
    tutor: tutorId ?? null,
  }));

  res.json({ data: pacientes, total, page: pageNum, limit: limitNum });
});

// GET /api/pacientes/:id
router.get("/:id", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const paciente = await Paciente.findOne({ _id: req.params.id, tenantId }).populate("tutorId").lean();
  if (!paciente) {
    res.status(404).json({ error: "Paciente no encontrado" });
    return;
  }
  res.json(paciente);
});

// POST /api/pacientes
router.post("/", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const result = pacienteSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const { tutor: tutorData, ...pacienteData } = result.data;

  let tutorId: string | null = null;
  if (pacienteData.esMenor && tutorData) {
    const tutor = await Tutor.create({ tenantId, ...tutorData });
    tutorId = String(tutor._id);
  }

  const paciente = await Paciente.create({
    tenantId,
    ...pacienteData,
    fechaNacimiento: new Date(pacienteData.fechaNacimiento),
    tutorId,
  });

  const populated = await paciente.populate("tutorId");
  res.status(201).json(populated);
});

// PUT /api/pacientes/:id
router.put("/:id", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const result = pacienteSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const { tutor: tutorData, ...updateData } = result.data;

  if (updateData.fechaNacimiento) {
    (updateData as any).fechaNacimiento = new Date(updateData.fechaNacimiento);
  }

  const paciente = await Paciente.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    updateData,
    { new: true },
  ).populate("tutorId");

  if (!paciente) {
    res.status(404).json({ error: "Paciente no encontrado" });
    return;
  }

  // Update tutor if provided
  if (tutorData && paciente.tutorId) {
    await Tutor.findByIdAndUpdate(paciente.tutorId, tutorData);
  }

  res.json(await paciente.populate("tutorId"));
});

// DELETE /api/pacientes/:id (soft delete)
router.delete("/:id", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const paciente = await Paciente.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    { estado: "inactivo" },
    { new: true },
  );
  if (!paciente) {
    res.status(404).json({ error: "Paciente no encontrado" });
    return;
  }
  res.json({ ok: true });
});

export default router;
