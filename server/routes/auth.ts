import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Tenant } from "../models/Tenant.js";
import { User } from "../models/User.js";
import { getJwtSecret } from "../env.js";

const router = Router();

const registerSchema = z.object({
  nombreConsultorio: z.string().min(2),
  nombre: z.string().min(2),
  email: z.string().email(),
  especialidad: z.enum(["clinica", "infantil", "educativa", "neuropsicologia", "organizacional", "otra"]),
  password: z.string().min(8),
  timezone: z.string().refine(
    val => {
      try { Intl.DateTimeFormat(undefined, { timeZone: val }); return true; }
      catch { return false; }
    },
    { message: "Zona horaria inválida" }
  ).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function signToken(userId: string, tenantId: string | null, rol: "admin" | "doctor" | "superadmin"): string {
  return jwt.sign({ userId, tenantId, rol }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  } as jwt.SignOptions);
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const { nombreConsultorio, nombre, email, especialidad, password, timezone } = result.data;

  // Unique slug
  let slug = slugify(nombreConsultorio);
  const existing = await Tenant.findOne({ slug });
  if (existing) slug = `${slug}-${Date.now()}`;

  const tenant = await Tenant.create({ name: nombreConsultorio, slug });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    tenantId: tenant._id,
    nombre,
    email,
    passwordHash,
    rol: "admin",
    especialidad,
    timezone,
  });

  const token = signToken(String(user._id), String(tenant._id), "admin");

  res.status(201).json({
    token,
    user: {
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      especialidad: user.especialidad,
      activo: user.activo,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
      timezone: user.timezone,
    },
    tenant: {
      _id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      settings: tenant.settings,
    },
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const { email, password } = result.data;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.activo) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const tenant = await Tenant.findById(user.tenantId);

  const token = signToken(String(user._id), String(user.tenantId), user.rol);

  res.json({
    token,
    user: {
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      especialidad: user.especialidad,
      activo: user.activo,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
      timezone: user.timezone,
    },
    tenant: tenant
      ? {
          _id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
          settings: tenant.settings,
        }
      : null,
  });
});

// POST /api/auth/logout (stateless — frontend drops the token)
router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

// GET /api/auth/me — returns current user + tenant from JWT
import { authenticate } from "../middleware/auth.js";
router.get("/me", authenticate, async (req, res) => {
  const { userId, tenantId } = req.user!;
  const [user, tenant] = await Promise.all([
    User.findById(userId).lean(),
    Tenant.findById(tenantId).lean(),
  ]);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" }) as any;
  res.json({
    user: {
      _id: user._id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      especialidad: user.especialidad,
      activo: user.activo,
      createdAt: user.createdAt,
      timezone: user.timezone,
    },
    tenant: tenant
      ? { _id: tenant._id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, settings: tenant.settings }
      : null,
  });
});

const updateMeSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  especialidad: z.enum(["clinica", "infantil", "educativa", "neuropsicologia", "organizacional", "otra"]).optional(),
  timezone: z.string().refine(
    val => {
      try { Intl.DateTimeFormat(undefined, { timeZone: val }); return true; }
      catch { return false; }
    },
    { message: "Zona horaria inválida" }
  ).optional(),
});

// PATCH /api/auth/me — update own profile
router.patch("/me", authenticate, async (req, res) => {
  const { userId, tenantId } = req.user!;
  const result = updateMeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  // Explicit field allowlist (Fix 2)
  const update: Record<string, unknown> = {};
  if (result.data.nombre !== undefined) update.nombre = result.data.nombre;
  if (result.data.especialidad !== undefined) update.especialidad = result.data.especialidad;
  if (result.data.timezone !== undefined) update.timezone = result.data.timezone;

  // Handle email separately with conflict check
  if (result.data.email) {
    const conflict = await User.findOne({
      email: result.data.email.toLowerCase(),
      tenantId,
      _id: { $ne: userId },
    });
    if (conflict) {
      res.status(409).json({ error: "Ese email ya está en uso por otro usuario" });
      return;
    }
    update.email = result.data.email.toLowerCase();
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  // Shape response explicitly (Fix 1) - mirrors GET /me pattern
  res.json({
    _id: user._id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    especialidad: user.especialidad,
    activo: user.activo,
    timezone: user.timezone,
    createdAt: user.createdAt,
  });
});

export default router;
