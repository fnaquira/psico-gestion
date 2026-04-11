import { Router } from "express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Tenant } from "../models/Tenant.js";
import { User } from "../models/User.js";
import { Paciente } from "../models/Paciente.js";
import { Cita } from "../models/Cita.js";
import { Pago } from "../models/Pago.js";

const router = Router();

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next) =>
    fn(req, res).catch(next);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

function paginationParams(query: Record<string, unknown>) {
  const raw = parseInt((query.page as string) ?? "1", 10);
  const page = Number.isFinite(raw) && raw > 0 ? raw : 1;
  return { skip: (page - 1) * 20, limit: 20 };
}

// ── Tenants ─────────────────────────────────────────────────────────────────

router.get(
  "/tenants",
  wrap(async (req, res) => {
    const { skip, limit } = paginationParams(req.query);
    const filter: Record<string, unknown> = {};
    if (req.query.name)
      filter.name = { $regex: escapeRegex(req.query.name as string), $options: "i" };
    if (req.query.slug)
      filter.slug = { $regex: escapeRegex(req.query.slug as string), $options: "i" };
    const plan = safeEnum(req.query.plan, ["free", "pro", "enterprise"] as const);
    if (plan) filter.plan = plan;

    const [items, total] = await Promise.all([
      Tenant.find(filter).skip(skip).limit(limit).lean(),
      Tenant.countDocuments(filter),
    ]);
    res.json({ items, total });
  }),
);

// ── Users ────────────────────────────────────────────────────────────────────

router.get(
  "/users",
  wrap(async (req, res) => {
    const { skip, limit } = paginationParams(req.query);
    const filter: Record<string, unknown> = {};
    if (req.query.nombre)
      filter.nombre = { $regex: escapeRegex(req.query.nombre as string), $options: "i" };
    if (req.query.email)
      filter.email = { $regex: escapeRegex(req.query.email as string), $options: "i" };
    const rol = safeEnum(req.query.rol, ["admin", "doctor"] as const);
    if (rol) filter.rol = rol;
    if (req.query.tenantId) filter.tenantId = req.query.tenantId;
    if (req.query.activo !== undefined) filter.activo = req.query.activo === "true";

    const [items, total] = await Promise.all([
      User.find(filter).select("-passwordHash -googleCalendar").skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ items, total });
  }),
);

const patchUserSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  rol: z.enum(["admin", "doctor"]).optional(),
  activo: z.boolean().optional(),
  especialidad: z.string().optional(),
  password: z.string().min(8).optional(),
});

router.patch(
  "/users/:id",
  wrap(async (req, res) => {
    const result = patchUserSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.issues });
      return;
    }
    const { password, ...fields } = result.data;
    const update: Record<string, unknown> = { ...fields };
    if (password) update.passwordHash = await bcrypt.hash(password, 12);

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select("-passwordHash -googleCalendar")
      .lean();
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.json(user);
  }),
);

// ── Pacientes ────────────────────────────────────────────────────────────────

router.get(
  "/pacientes",
  wrap(async (req, res) => {
    const { skip, limit } = paginationParams(req.query);
    const filter: Record<string, unknown> = {};
    if (req.query.nombre)
      filter.nombre = { $regex: escapeRegex(req.query.nombre as string), $options: "i" };
    if (req.query.apellido)
      filter.apellido = { $regex: escapeRegex(req.query.apellido as string), $options: "i" };
    const estado = safeEnum(req.query.estado, ["activo", "inactivo", "en_deuda"] as const);
    if (estado) filter.estado = estado;
    if (req.query.tenantId) filter.tenantId = req.query.tenantId;

    const [items, total] = await Promise.all([
      Paciente.find(filter).skip(skip).limit(limit).lean(),
      Paciente.countDocuments(filter),
    ]);
    res.json({ items, total });
  }),
);

const patchPacienteSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  estado: z.enum(["activo", "inactivo", "en_deuda"]).optional(),
  notasClinicas: z.string().optional(),
});

router.patch(
  "/pacientes/:id",
  wrap(async (req, res) => {
    const result = patchPacienteSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.issues });
      return;
    }
    const paciente = await Paciente.findByIdAndUpdate(req.params.id, result.data, {
      new: true,
    }).lean();
    if (!paciente) {
      res.status(404).json({ error: "Paciente no encontrado" });
      return;
    }
    res.json(paciente);
  }),
);

// ── Citas ────────────────────────────────────────────────────────────────────

router.get(
  "/citas",
  wrap(async (req, res) => {
    const { skip, limit } = paginationParams(req.query);
    const filter: Record<string, unknown> = {};
    const estadoCita = safeEnum(req.query.estado, ["programada", "realizada", "cancelada", "no_asistio"] as const);
    if (estadoCita) filter.estado = estadoCita;
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    if (req.query.tenantId) filter.tenantId = req.query.tenantId;
    if (req.query.fecha) {
      const d = new Date(req.query.fecha as string);
      if (isNaN(d.getTime())) {
        res.status(400).json({ error: "Fecha inválida" });
        return;
      }
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.fecha = { $gte: d, $lt: next };
    }

    const [items, total] = await Promise.all([
      Cita.find(filter).skip(skip).limit(limit).lean(),
      Cita.countDocuments(filter),
    ]);
    res.json({ items, total });
  }),
);

const patchCitaSchema = z.object({
  estado: z.enum(["programada", "realizada", "cancelada", "no_asistio"]).optional(),
  notas: z.string().optional(),
  montoCita: z.number().min(0).optional(),
  horaInicio: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  horaFin: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

router.patch(
  "/citas/:id",
  wrap(async (req, res) => {
    const result = patchCitaSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.issues });
      return;
    }
    const cita = await Cita.findByIdAndUpdate(req.params.id, result.data, { new: true }).lean();
    if (!cita) {
      res.status(404).json({ error: "Cita no encontrada" });
      return;
    }
    res.json(cita);
  }),
);

// ── Pagos ────────────────────────────────────────────────────────────────────

router.get(
  "/pagos",
  wrap(async (req, res) => {
    const { skip, limit } = paginationParams(req.query);
    const filter: Record<string, unknown> = {};
    const metodo = safeEnum(req.query.metodo, ["efectivo", "transferencia", "tarjeta"] as const);
    if (metodo) filter.metodo = metodo;
    const tipoPago = safeEnum(req.query.tipoPago, ["adelantado", "al_llegar", "deuda"] as const);
    if (tipoPago) filter.tipoPago = tipoPago;
    if (req.query.tenantId) filter.tenantId = req.query.tenantId;
    if (req.query.fechaDesde || req.query.fechaHasta) {
      const fechaFilter: Record<string, Date> = {};
      if (req.query.fechaDesde) {
        const d = new Date(req.query.fechaDesde as string);
        if (isNaN(d.getTime())) {
          res.status(400).json({ error: "fechaDesde inválida" });
          return;
        }
        fechaFilter.$gte = d;
      }
      if (req.query.fechaHasta) {
        const d = new Date(req.query.fechaHasta as string);
        if (isNaN(d.getTime())) {
          res.status(400).json({ error: "fechaHasta inválida" });
          return;
        }
        fechaFilter.$lte = d;
      }
      filter.fechaPago = fechaFilter;
    }

    const [items, total] = await Promise.all([
      Pago.find(filter).skip(skip).limit(limit).lean(),
      Pago.countDocuments(filter),
    ]);
    res.json({ items, total });
  }),
);

const patchPagoSchema = z.object({
  monto: z.number().min(0).optional(),
  notas: z.string().optional(),
  metodo: z.enum(["efectivo", "transferencia", "tarjeta"]).optional(),
});

router.patch(
  "/pagos/:id",
  wrap(async (req, res) => {
    const result = patchPagoSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.issues });
      return;
    }
    const pago = await Pago.findByIdAndUpdate(req.params.id, result.data, { new: true }).lean();
    if (!pago) {
      res.status(404).json({ error: "Pago no encontrado" });
      return;
    }
    res.json(pago);
  }),
);

export default router;
