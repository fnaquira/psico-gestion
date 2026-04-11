import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { Tutor } from "../models/Tutor.js";

const router = Router();

const tutorSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  relacion: z.enum(["padre", "madre", "tutor_legal", "otro"]),
  telefono: z.string().default(""),
  email: z.string().default(""),
  documento: z.string().default(""),
});

// POST /api/tutores
router.post("/", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const result = tutorSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }
  const tutor = await Tutor.create({ tenantId: tenantId!, ...result.data });
  res.status(201).json(tutor);
});

// GET /api/tutores/:id
router.get("/:id", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const tutor = await Tutor.findOne({ _id: req.params.id, tenantId: tenantId! }).lean();
  if (!tutor) {
    res.status(404).json({ error: "Tutor no encontrado" });
    return;
  }
  res.json(tutor);
});

// PUT /api/tutores/:id
router.put("/:id", async (req: Request, res: Response) => {
  const { tenantId } = req.user!;
  const result = tutorSchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }
  const tutor = await Tutor.findOneAndUpdate({ _id: req.params.id, tenantId: tenantId! }, result.data, {
    new: true,
  });
  if (!tutor) {
    res.status(404).json({ error: "Tutor no encontrado" });
    return;
  }
  res.json(tutor);
});

export default router;
