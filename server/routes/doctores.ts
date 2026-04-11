import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const doctorSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  especialidad: z.enum(["clinica", "infantil", "educativa", "neuropsicologia", "organizacional", "otra"]),
  password: z.string().min(8).optional(),
  activo: z.boolean().optional(),
});

// GET /api/doctores
router.get("/", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const doctores = await User.find({ tenantId: tenantId! })
    .select("-passwordHash")
    .sort({ nombre: 1 })
    .lean();
  res.json(doctores);
});

// POST /api/doctores (admin only)
router.post("/", requireAdmin, async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const result = doctorSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const { password, ...data } = result.data;
  const passwordHash = await bcrypt.hash(password ?? "Cambiar123!", 12);

  const existing = await User.findOne({ email: data.email.toLowerCase(), tenantId: tenantId! });
  if (existing) {
    res.status(409).json({ error: "Ya existe un usuario con ese email en este consultorio" });
    return;
  }

  const doctor = await User.create({
    tenantId: tenantId!,
    passwordHash,
    rol: "doctor",
    ...data,
  });

  res.status(201).json({
    _id: doctor._id,
    nombre: doctor.nombre,
    email: doctor.email,
    rol: doctor.rol,
    especialidad: doctor.especialidad,
    activo: doctor.activo,
  });
});

// PUT /api/doctores/:id (admin only)
router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const result = doctorSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const { password, ...data } = result.data;
  const update: Record<string, unknown> = { ...data };
  if (password) update.passwordHash = await bcrypt.hash(password, 12);

  const doctor = await User.findOneAndUpdate({ _id: req.params.id, tenantId: tenantId! }, update, {
    new: true,
  }).select("-passwordHash");

  if (!doctor) {
    res.status(404).json({ error: "Doctor no encontrado" });
    return;
  }
  res.json(doctor);
});

export default router;
