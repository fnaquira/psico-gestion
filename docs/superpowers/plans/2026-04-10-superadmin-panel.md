# Admin Panel (God Mode) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a platform-level superadmin panel that lets a god-mode user view and edit all tenants, users, pacientes, citas, and pagos across every consultorio in the system.

**Architecture:** Separate `SuperAdmin` Mongoose model (no `tenantId`). Login checks the `superadmins` collection only if no `User` matches the email. JWT carries `{ rol: "superadmin", tenantId: null }`. Frontend routing directs superadmin to `/admin`, rendering an independent panel with its own sidebar and five flat-view tabs.

**Tech Stack:** Express + Mongoose + Zod + bcryptjs (backend), React + Wouter + Axios + shadcn/ui (frontend), Vitest + Supertest + MongoMemoryServer (tests).

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `server/models/SuperAdmin.ts` | Mongoose model: `nombre`, `email`, `passwordHash` |
| `server/routes/admin.ts` | GET + PATCH endpoints for all five entities (cross-tenant) |
| `server/__tests__/superadmin-auth.test.ts` | Login tests for superadmin path |
| `server/__tests__/admin.test.ts` | Authorization + CRUD tests for admin routes |
| `client/src/pages/AdminPanelPage.tsx` | Admin panel layout (sidebar + content) |
| `client/src/components/admin/AdminSidebar.tsx` | Admin nav sidebar |
| `client/src/components/admin/AdminTenantsView.tsx` | Tenants table + edit |
| `client/src/components/admin/AdminUsersView.tsx` | Users table + edit (with password reset) |
| `client/src/components/admin/AdminPacientesView.tsx` | Pacientes table + edit |
| `client/src/components/admin/AdminCitasView.tsx` | Citas table + edit |
| `client/src/components/admin/AdminPagosView.tsx` | Pagos table + edit |

### Modified files
| File | Change |
|------|--------|
| `shared/types.ts` | `AuthPayload.tenantId: string \| null`; add `"superadmin"` to `rol` in `AuthPayload` and `UserDTO` |
| `server/middleware/auth.ts` | Add `requireSuperAdmin` export |
| `server/routes/auth.ts` | Login checks `superadmins` collection if no `User` found |
| `server/app.ts` | Register `/api/admin` with `authenticate + requireSuperAdmin` |
| `server/index.ts` | Call `ensureSuperAdmin()` after `connectDB()` |
| `server/__tests__/helpers.ts` | Export `createSuperAdminToken()` |
| `client/src/App.tsx` | Add `/admin` route; redirect superadmin to `/admin` after login |
| `.env.example` | Document `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` |

---

## Task 1: Update shared/types.ts

**Files:**
- Modify: `shared/types.ts`

- [ ] **Step 1: Update AuthPayload and UserDTO**

Replace the existing `AuthPayload` and `UserDTO` interfaces with:

```ts
export interface AuthPayload {
  userId: string;
  tenantId: string | null;  // null for superadmin
  rol: "admin" | "doctor" | "superadmin";
}
```

And update `UserDTO`:

```ts
export interface UserDTO {
  _id: string;
  tenantId: string | null;   // null for superadmin
  nombre: string;
  email: string;
  rol: "admin" | "doctor" | "superadmin";
  especialidad: string;
  activo: boolean;
  timezone: string;
  createdAt: string;
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm check
```

Expected: No TypeScript errors. If there are errors in other files that use `rol`, fix them now (e.g., `signToken` in `server/routes/auth.ts` — update its `rol` parameter type to `"admin" | "doctor" | "superadmin"`).

- [ ] **Step 3: Commit**

```bash
git add shared/types.ts
git commit -m "feat(types): add superadmin role, nullable tenantId in AuthPayload and UserDTO"
```

---

## Task 2: Create SuperAdmin model

**Files:**
- Create: `server/models/SuperAdmin.ts`

- [ ] **Step 1: Create the model**

```ts
import { Schema, model, Document } from "mongoose";

export interface ISuperAdmin extends Document {
  nombre: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const SuperAdminSchema = new Schema<ISuperAdmin>(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const SuperAdmin = model<ISuperAdmin>("SuperAdmin", SuperAdminSchema);
```

- [ ] **Step 2: Run type check**

```bash
pnpm check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add server/models/SuperAdmin.ts
git commit -m "feat(models): add SuperAdmin model"
```

---

## Task 3: Update test helpers

**Files:**
- Modify: `server/__tests__/helpers.ts`

- [ ] **Step 1: Add import and createSuperAdminToken function**

Add to the imports at the top of `server/__tests__/helpers.ts`:

```ts
import { SuperAdmin } from "../models/SuperAdmin.js";
```

Add the following export after `createTestUser`:

```ts
export async function createSuperAdminToken(): Promise<{
  superAdmin: InstanceType<typeof SuperAdmin>;
  token: string;
}> {
  const passwordHash = await bcrypt.hash("SuperPass123", 4);
  const superAdmin = await SuperAdmin.create({
    nombre: "Test Super Admin",
    email: `superadmin-${Date.now()}@test.com`,
    passwordHash,
  });
  const token = jwt.sign(
    { userId: String(superAdmin._id), tenantId: null, rol: "superadmin" },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" },
  );
  return { superAdmin: superAdmin as any, token };
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add server/__tests__/helpers.ts
git commit -m "test(helpers): add createSuperAdminToken helper"
```

---

## Task 4: Add requireSuperAdmin middleware

**Files:**
- Modify: `server/middleware/auth.ts`

- [ ] **Step 1: Add requireSuperAdmin export**

Append to `server/middleware/auth.ts` after `requireAdmin`:

```ts
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.rol !== "superadmin") {
    res.status(403).json({ error: "Se requiere rol superadmin" });
    return;
  }
  next();
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add server/middleware/auth.ts
git commit -m "feat(auth): add requireSuperAdmin middleware"
```

---

## Task 5: Modify login route to check SuperAdmin

**Files:**
- Modify: `server/routes/auth.ts`
- Create: `server/__tests__/superadmin-auth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `server/__tests__/superadmin-auth.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { SuperAdmin } from "../models/SuperAdmin.js";
import { request } from "./helpers.js";

describe("SuperAdmin Login", () => {
  it("returns superadmin token when credentials are valid", async () => {
    const passwordHash = await bcrypt.hash("Admin1234!", 4);
    await SuperAdmin.create({
      nombre: "Super Admin",
      email: "admin@psicogestion.com",
      passwordHash,
    });

    const res = await request.post("/api/auth/login").send({
      email: "admin@psicogestion.com",
      password: "Admin1234!",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.rol).toBe("superadmin");
    expect(res.body.user.tenantId).toBeNull();
    expect(res.body.tenant).toBeNull();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("returns 401 for invalid superadmin password", async () => {
    const passwordHash = await bcrypt.hash("Admin1234!", 4);
    await SuperAdmin.create({
      nombre: "Super Admin",
      email: "admin2@psicogestion.com",
      passwordHash,
    });

    const res = await request.post("/api/auth/login").send({
      email: "admin2@psicogestion.com",
      password: "WrongPassword",
    });

    expect(res.status).toBe(401);
  });

  it("does NOT fall through to superadmin if user email exists (even with different password)", async () => {
    await request.post("/api/auth/register").send({
      nombreConsultorio: "Overlap Clinic",
      nombre: "Dr. Overlap",
      email: "overlap@test.com",
      especialidad: "clinica",
      password: "Password123",
    });
    const passwordHash = await bcrypt.hash("AdminPass!", 4);
    await SuperAdmin.create({
      nombre: "Overlap Admin",
      email: "overlap@test.com",
      passwordHash,
    });

    // Using the superadmin password on a user email — should fail (not fall through)
    const res = await request.post("/api/auth/login").send({
      email: "overlap@test.com",
      password: "AdminPass!",
    });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test -- --reporter=verbose superadmin-auth
```

Expected: All 3 tests fail (the superadmin collection is never checked by the current login).

- [ ] **Step 3: Update login route**

In `server/routes/auth.ts`, first update the `signToken` signature to accept `"superadmin"` as a role and `null` as tenantId:

```ts
function signToken(userId: string, tenantId: string | null, rol: "admin" | "doctor" | "superadmin"): string {
  return jwt.sign({ userId, tenantId, rol }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  } as jwt.SignOptions);
}
```

Then add the import for `SuperAdmin` after the existing imports:

```ts
import { SuperAdmin } from "../models/SuperAdmin.js";
```

Replace the entire `POST /api/auth/login` handler (lines 100–148 in the current file) with:

```ts
// POST /api/auth/login
router.post("/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const { email, password } = result.data;
  const normalizedEmail = email.toLowerCase();

  // ── Regular user check ────────────────────────────────────────────────────
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // User record exists → follow normal auth, never fall through to superadmin
    if (!user.activo) {
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
        ? { _id: tenant._id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, settings: tenant.settings }
        : null,
    });
    return;
  }

  // ── SuperAdmin check (only if no User found with this email) ─────────────
  const superAdmin = await SuperAdmin.findOne({ email: normalizedEmail });
  if (!superAdmin) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const validSuperAdmin = await bcrypt.compare(password, superAdmin.passwordHash);
  if (!validSuperAdmin) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const token = signToken(String(superAdmin._id), null, "superadmin");

  res.json({
    token,
    user: {
      _id: superAdmin._id,
      nombre: superAdmin.nombre,
      email: superAdmin.email,
      rol: "superadmin",
      especialidad: "",
      activo: true,
      tenantId: null,
      createdAt: superAdmin.createdAt,
      timezone: "UTC",
    },
    tenant: null,
  });
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- --reporter=verbose superadmin-auth
```

Expected: All 3 tests pass. Also run full test suite to confirm nothing regressed:

```bash
pnpm test
```

Expected: All existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add server/routes/auth.ts server/__tests__/superadmin-auth.test.ts
git commit -m "feat(auth): check superadmin collection when no user found on login"
```

---

## Task 6: Create admin routes

**Files:**
- Create: `server/routes/admin.ts`

- [ ] **Step 1: Create the route file**

Create `server/routes/admin.ts`:

```ts
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Tenant } from "../models/Tenant.js";
import { User } from "../models/User.js";
import { Paciente } from "../models/Paciente.js";
import { Cita } from "../models/Cita.js";
import { Pago } from "../models/Pago.js";

const router = Router();

function paginationParams(query: qs.ParsedQs) {
  const page = Math.max(1, parseInt((query.page as string) ?? "1", 10));
  const limit = 20;
  return { skip: (page - 1) * limit, limit };
}

// ── Tenants ─────────────────────────────────────────────────────────────────

router.get("/tenants", async (req, res) => {
  const { skip, limit } = paginationParams(req.query);
  const filter: Record<string, unknown> = {};
  if (req.query.name) filter.name = { $regex: req.query.name, $options: "i" };
  if (req.query.slug) filter.slug = { $regex: req.query.slug, $options: "i" };
  if (req.query.plan) filter.plan = req.query.plan;

  const [items, total] = await Promise.all([
    Tenant.find(filter).skip(skip).limit(limit).lean(),
    Tenant.countDocuments(filter),
  ]);
  res.json({ items, total });
});

// ── Users ────────────────────────────────────────────────────────────────────

router.get("/users", async (req, res) => {
  const { skip, limit } = paginationParams(req.query);
  const filter: Record<string, unknown> = {};
  if (req.query.nombre) filter.nombre = { $regex: req.query.nombre, $options: "i" };
  if (req.query.email) filter.email = { $regex: req.query.email, $options: "i" };
  if (req.query.rol) filter.rol = req.query.rol;
  if (req.query.tenantId) filter.tenantId = req.query.tenantId;
  if (req.query.activo !== undefined) filter.activo = req.query.activo === "true";

  const [items, total] = await Promise.all([
    User.find(filter).select("-passwordHash -googleCalendar").skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  res.json({ items, total });
});

const patchUserSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  rol: z.enum(["admin", "doctor"]).optional(),
  activo: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

router.patch("/users/:id", async (req, res) => {
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
});

// ── Pacientes ────────────────────────────────────────────────────────────────

router.get("/pacientes", async (req, res) => {
  const { skip, limit } = paginationParams(req.query);
  const filter: Record<string, unknown> = {};
  if (req.query.nombre) filter.nombre = { $regex: req.query.nombre, $options: "i" };
  if (req.query.apellido) filter.apellido = { $regex: req.query.apellido, $options: "i" };
  if (req.query.estado) filter.estado = req.query.estado;
  if (req.query.tenantId) filter.tenantId = req.query.tenantId;

  const [items, total] = await Promise.all([
    Paciente.find(filter).skip(skip).limit(limit).lean(),
    Paciente.countDocuments(filter),
  ]);
  res.json({ items, total });
});

const patchPacienteSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  estado: z.enum(["activo", "inactivo", "en_deuda"]).optional(),
  notasClinicas: z.string().optional(),
});

router.patch("/pacientes/:id", async (req, res) => {
  const result = patchPacienteSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }
  const paciente = await Paciente.findByIdAndUpdate(req.params.id, result.data, { new: true }).lean();
  if (!paciente) {
    res.status(404).json({ error: "Paciente no encontrado" });
    return;
  }
  res.json(paciente);
});

// ── Citas ────────────────────────────────────────────────────────────────────

router.get("/citas", async (req, res) => {
  const { skip, limit } = paginationParams(req.query);
  const filter: Record<string, unknown> = {};
  if (req.query.estado) filter.estado = req.query.estado;
  if (req.query.doctorId) filter.doctorId = req.query.doctorId;
  if (req.query.tenantId) filter.tenantId = req.query.tenantId;
  if (req.query.fecha) {
    const d = new Date(req.query.fecha as string);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.fecha = { $gte: d, $lt: next };
  }

  const [items, total] = await Promise.all([
    Cita.find(filter).skip(skip).limit(limit).lean(),
    Cita.countDocuments(filter),
  ]);
  res.json({ items, total });
});

const patchCitaSchema = z.object({
  estado: z.enum(["programada", "realizada", "cancelada", "no_asistio"]).optional(),
  notas: z.string().optional(),
  montoCita: z.number().min(0).optional(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

router.patch("/citas/:id", async (req, res) => {
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
});

// ── Pagos ────────────────────────────────────────────────────────────────────

router.get("/pagos", async (req, res) => {
  const { skip, limit } = paginationParams(req.query);
  const filter: Record<string, unknown> = {};
  if (req.query.metodo) filter.metodo = req.query.metodo;
  if (req.query.tipoPago) filter.tipoPago = req.query.tipoPago;
  if (req.query.tenantId) filter.tenantId = req.query.tenantId;
  if (req.query.fechaDesde || req.query.fechaHasta) {
    const fechaFilter: Record<string, Date> = {};
    if (req.query.fechaDesde) fechaFilter.$gte = new Date(req.query.fechaDesde as string);
    if (req.query.fechaHasta) fechaFilter.$lte = new Date(req.query.fechaHasta as string);
    filter.fechaPago = fechaFilter;
  }

  const [items, total] = await Promise.all([
    Pago.find(filter).skip(skip).limit(limit).lean(),
    Pago.countDocuments(filter),
  ]);
  res.json({ items, total });
});

const patchPagoSchema = z.object({
  monto: z.number().min(0).optional(),
  notas: z.string().optional(),
  metodo: z.enum(["efectivo", "transferencia", "tarjeta"]).optional(),
});

router.patch("/pagos/:id", async (req, res) => {
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
});

export default router;
```

Note: the `paginationParams` function uses `qs.ParsedQs`. Replace that type with `Record<string, unknown>` if TypeScript complains:

```ts
function paginationParams(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt((query.page as string) ?? "1", 10));
  return { skip: (page - 1) * 20, limit: 20 };
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm check
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add server/routes/admin.ts
git commit -m "feat(routes): add admin CRUD routes for all entities"
```

---

## Task 7: Register admin routes + write tests

**Files:**
- Modify: `server/app.ts`
- Create: `server/__tests__/admin.test.ts`

- [ ] **Step 1: Register admin routes in app.ts**

In `server/app.ts`, add the import after the existing route imports:

```ts
import adminRoutes from "./routes/admin.js";
import { requireSuperAdmin } from "./middleware/auth.js";
```

Add the route registration after the `bloqueos` line:

```ts
app.use("/api/admin", authenticate, requireSuperAdmin, adminRoutes);
```

- [ ] **Step 2: Write admin route tests**

Create `server/__tests__/admin.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { request, createTestUser, createSuperAdminToken } from "./helpers.js";
import { Tenant } from "../models/Tenant.js";
import { Paciente } from "../models/Paciente.js";
import { Cita } from "../models/Cita.js";
import { Pago } from "../models/Pago.js";

describe("Admin Routes — Authorization", () => {
  it("returns 401 without token", async () => {
    const res = await request.get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("returns 403 for regular admin", async () => {
    const { token } = await createTestUser({ rol: "admin" });
    const res = await request.get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("returns 403 for doctor", async () => {
    const { token } = await createTestUser({ rol: "doctor" });
    const res = await request.get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe("GET /api/admin/tenants", () => {
  it("returns tenants list with total", async () => {
    const { token } = await createSuperAdminToken();
    await Tenant.create({ name: "Clinica A", slug: "clinica-a-test" });
    await Tenant.create({ name: "Clinica B", slug: "clinica-b-test" });

    const res = await request
      .get("/api/admin/tenants")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  it("filters tenants by name", async () => {
    const { token } = await createSuperAdminToken();
    await Tenant.create({ name: "Clinica Unica XYZ", slug: "clinica-unica-xyz" });

    const res = await request
      .get("/api/admin/tenants?name=Unica+XYZ")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].name).toMatch(/Unica XYZ/);
  });
});

describe("GET /api/admin/users", () => {
  it("returns all users across tenants without passwordHash", async () => {
    const { token } = await createSuperAdminToken();
    await createTestUser({ email: "user-a@admin-test.com" });
    await createTestUser({ email: "user-b@admin-test.com" });

    const res = await request
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    expect(res.body.items[0].passwordHash).toBeUndefined();
  });

  it("filters by email", async () => {
    const { token } = await createSuperAdminToken();
    await createTestUser({ email: "searchable-xyz@test.com" });

    const res = await request
      .get("/api/admin/users?email=searchable-xyz")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].email).toContain("searchable-xyz");
  });

  it("filters by rol", async () => {
    const { token } = await createSuperAdminToken();
    await createTestUser({ rol: "doctor", email: "doc-filter@test.com" });

    const res = await request
      .get("/api/admin/users?rol=doctor")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.every((u: any) => u.rol === "doctor")).toBe(true);
  });
});

describe("PATCH /api/admin/users/:id", () => {
  it("updates user nombre", async () => {
    const { token } = await createSuperAdminToken();
    const { user } = await createTestUser({ nombre: "Nombre Original" });

    const res = await request
      .patch(`/api/admin/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Nombre Actualizado" });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Nombre Actualizado");
    expect(res.body.passwordHash).toBeUndefined();
  });

  it("resets password when password field provided", async () => {
    const { token } = await createSuperAdminToken();
    const { user } = await createTestUser({ email: "passreset@test.com" });

    await request
      .patch(`/api/admin/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "NewPassword123!" });

    const loginRes = await request.post("/api/auth/login").send({
      email: "passreset@test.com",
      password: "NewPassword123!",
    });
    expect(loginRes.status).toBe(200);
  });

  it("returns 404 for non-existent user", async () => {
    const { token } = await createSuperAdminToken();
    const res = await request
      .patch("/api/admin/users/000000000000000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Ghost" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid payload", async () => {
    const { token } = await createSuperAdminToken();
    const { user } = await createTestUser();
    const res = await request
      .patch(`/api/admin/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "x" }); // too short
    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/pacientes", () => {
  it("returns pacientes with total", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant } = await createTestUser();
    await Paciente.create({
      tenantId: tenant._id,
      nombre: "AdminTest",
      apellido: "Paciente",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });

    const res = await request
      .get("/api/admin/pacientes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.total).toBe("number");
  });

  it("filters by estado", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant } = await createTestUser();
    await Paciente.create({
      tenantId: tenant._id,
      nombre: "Deuda",
      apellido: "Test",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
      estado: "en_deuda",
    });

    const res = await request
      .get("/api/admin/pacientes?estado=en_deuda")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.every((p: any) => p.estado === "en_deuda")).toBe(true);
  });
});

describe("PATCH /api/admin/pacientes/:id", () => {
  it("updates paciente estado", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "Activo",
      apellido: "Test",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
      estado: "activo",
    });

    const res = await request
      .patch(`/api/admin/pacientes/${paciente._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "inactivo" });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("inactivo");
  });
});

describe("GET /api/admin/citas", () => {
  it("returns citas with total", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant, user } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "P",
      apellido: "Q",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });
    await Cita.create({
      tenantId: tenant._id,
      pacienteId: paciente._id,
      doctorId: user._id,
      fecha: new Date(),
      horaInicio: "09:00",
      horaFin: "10:00",
      montoCita: 1000,
    });

    const res = await request
      .get("/api/admin/citas")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });
});

describe("PATCH /api/admin/citas/:id", () => {
  it("updates cita estado", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant, user } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "P",
      apellido: "Q",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });
    const cita = await Cita.create({
      tenantId: tenant._id,
      pacienteId: paciente._id,
      doctorId: user._id,
      fecha: new Date(),
      horaInicio: "09:00",
      horaFin: "10:00",
      montoCita: 1000,
      estado: "programada",
    });

    const res = await request
      .patch(`/api/admin/citas/${cita._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "realizada" });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("realizada");
  });
});

describe("GET /api/admin/pagos", () => {
  it("returns pagos with total", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant, user } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "P",
      apellido: "Q",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });
    await Pago.create({
      tenantId: tenant._id,
      pacienteId: paciente._id,
      monto: 5000,
      fechaPago: new Date(),
      metodo: "efectivo",
      tipoPago: "al_llegar",
      creadoPor: user._id,
    });

    const res = await request
      .get("/api/admin/pagos")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by metodo", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant, user } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "P",
      apellido: "Q",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });
    await Pago.create({
      tenantId: tenant._id,
      pacienteId: paciente._id,
      monto: 5000,
      metodo: "transferencia",
      tipoPago: "al_llegar",
      creadoPor: user._id,
    });

    const res = await request
      .get("/api/admin/pagos?metodo=transferencia")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.every((p: any) => p.metodo === "transferencia")).toBe(true);
  });
});

describe("PATCH /api/admin/pagos/:id", () => {
  it("updates pago notas", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant, user } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "P",
      apellido: "Q",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });
    const pago = await Pago.create({
      tenantId: tenant._id,
      pacienteId: paciente._id,
      monto: 5000,
      metodo: "efectivo",
      tipoPago: "al_llegar",
      creadoPor: user._id,
      notas: "",
    });

    const res = await request
      .patch(`/api/admin/pagos/${pago._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ notas: "Corregido por admin" });

    expect(res.status).toBe(200);
    expect(res.body.notas).toBe("Corregido por admin");
  });
});
```

- [ ] **Step 3: Run all tests**

```bash
pnpm test
```

Expected: All tests pass, including the new admin tests.

- [ ] **Step 4: Commit**

```bash
git add server/app.ts server/__tests__/admin.test.ts
git commit -m "feat(admin): register admin routes with superadmin guard + integration tests"
```

---

## Task 8: ensureSuperAdmin on startup + .env.example

**Files:**
- Modify: `server/index.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add ensureSuperAdmin to server/index.ts**

Add the import after existing imports:

```ts
import { SuperAdmin } from "./models/SuperAdmin.js";
import bcrypt from "bcryptjs";
```

Add the function before `startServer`:

```ts
async function ensureSuperAdmin(): Promise<void> {
  const email = (process.env.SUPERADMIN_EMAIL ?? "admin@psicogestion.com").toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD ?? "Admin1234!";

  const existing = await SuperAdmin.findOne({ email });
  if (existing) return; // already seeded — never overwrite password

  const passwordHash = await bcrypt.hash(password, 12);
  await SuperAdmin.create({ nombre: "Super Admin", email, passwordHash });
  console.log(`✓ SuperAdmin creado: ${email}`);
}
```

Inside `startServer`, add the call right after `await connectDB()`:

```ts
async function startServer() {
  validateServerEnv();
  await connectDB();
  await ensureSuperAdmin();   // ← add this line
  // rest of function unchanged...
```

- [ ] **Step 2: Update .env.example**

Append to `.env.example`:

```env

# Platform superadmin (seeded automatically on server start if not yet created)
# Change both values before deploying to production.
SUPERADMIN_EMAIL=admin@psicogestion.com
SUPERADMIN_PASSWORD=Admin1234!
```

- [ ] **Step 3: Run type check**

```bash
pnpm check
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add server/index.ts .env.example
git commit -m "feat(seed): auto-create superadmin on server startup via SUPERADMIN_EMAIL/PASSWORD env vars"
```

---

## Task 9: Update frontend routing

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Add AdminPanelPage import and routes**

Replace the content of `client/src/App.tsx` with:

```tsx
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";
import AdminPanelPage from "./pages/AdminPanelPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

function Router() {
  const { isAuth, loading, user, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isSuperAdmin = isAuth && user?.rol === "superadmin";

  return (
    <Switch>
      {/* Auth routes — redirect to correct home based on role */}
      <Route path="/login">
        {!isAuth ? <LoginPage /> : isSuperAdmin ? <Redirect to="/admin" /> : <Redirect to="/" />}
      </Route>
      <Route path="/register">
        {isAuth ? <Redirect to="/" /> : <RegisterPage />}
      </Route>
      <Route path="/forgot-password">
        {isAuth ? <Redirect to="/" /> : <ForgotPasswordPage />}
      </Route>

      {/* Superadmin panel */}
      <Route path="/admin">
        {!isAuth ? <Redirect to="/login" /> : !isSuperAdmin ? <Redirect to="/" /> : <AdminPanelPage onLogout={logout} />}
      </Route>

      {/* Regular app — superadmin redirected to /admin */}
      <Route path="/">
        {!isAuth ? <Redirect to="/login" /> : isSuperAdmin ? <Redirect to="/admin" /> : <Home onLogout={logout} />}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
```

- [ ] **Step 2: Run type check**

```bash
pnpm check
```

Expected: Error about `AdminPanelPage` not found (not created yet) — that's expected. If there are other errors, fix them now.

- [ ] **Step 3: Commit (will have TS error until Task 10 — commit after Task 10)**

Do not commit yet. Continue to Task 10 immediately.

---

## Task 10: Create AdminPanelPage + AdminSidebar

**Files:**
- Create: `client/src/pages/AdminPanelPage.tsx`
- Create: `client/src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Create AdminSidebar**

Create `client/src/components/admin/AdminSidebar.tsx`:

```tsx
import React from "react";
import { Building2, Users, UserRound, CalendarDays, CreditCard, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type AdminView = "consultorios" | "usuarios" | "pacientes" | "citas" | "pagos";

interface AdminSidebarProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  onLogout: () => void;
}

const menuItems: { id: AdminView; label: string; icon: React.ElementType }[] = [
  { id: "consultorios", label: "Consultorios", icon: Building2 },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "pacientes", label: "Pacientes", icon: UserRound },
  { id: "citas", label: "Citas", icon: CalendarDays },
  { id: "pagos", label: "Pagos", icon: CreditCard },
];

export default function AdminSidebar({ currentView, onViewChange, onLogout }: AdminSidebarProps) {
  const { user } = useAuth();

  return (
    <div className="w-64 bg-sidebar flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary/20 rounded-lg flex items-center justify-center border border-sidebar-primary/30 shrink-0">
            <ShieldCheck size={15} className="text-sidebar-primary" />
          </div>
          <div>
            <p
              className="text-sidebar-foreground text-[17px] font-semibold leading-tight tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              PsicoGestión
            </p>
            <p className="text-[11px] text-sidebar-foreground/40 mt-0.5 font-medium tracking-wide uppercase">
              Admin
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] font-semibold text-sidebar-foreground/30 uppercase tracking-widest px-3 mb-3">
          Sistema
        </p>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? "bg-sidebar-primary/15 text-sidebar-primary"
                  : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon size={17} strokeWidth={isActive ? 2 : 1.75} />
              <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-4 space-y-0.5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all"
        >
          <LogOut size={16} strokeWidth={1.75} />
          <span className="text-sm font-medium">Salir</span>
        </button>
        <div className="w-full flex items-center gap-3 px-3 py-3 mt-1 bg-sidebar-accent/60 rounded-lg text-left">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/25 border border-sidebar-primary/30 flex items-center justify-center text-sidebar-primary text-xs font-bold shrink-0">
            {user?.nombre ? user.nombre.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "SA"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.nombre ?? "Super Admin"}</p>
            <p className="text-[11px] text-sidebar-foreground/45 truncate">superadmin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create AdminPanelPage**

Create `client/src/pages/AdminPanelPage.tsx`:

```tsx
import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTenantsView from "@/components/admin/AdminTenantsView";
import AdminUsersView from "@/components/admin/AdminUsersView";
import AdminPacientesView from "@/components/admin/AdminPacientesView";
import AdminCitasView from "@/components/admin/AdminCitasView";
import AdminPagosView from "@/components/admin/AdminPagosView";

type AdminView = "consultorios" | "usuarios" | "pacientes" | "citas" | "pagos";

const VIEW_TITLES: Record<AdminView, string> = {
  consultorios: "Consultorios",
  usuarios: "Usuarios",
  pacientes: "Pacientes",
  citas: "Citas",
  pagos: "Pagos",
};

interface AdminPanelPageProps {
  onLogout: () => void;
}

export default function AdminPanelPage({ onLogout }: AdminPanelPageProps) {
  const [currentView, setCurrentView] = useState<AdminView>("usuarios");

  const renderView = () => {
    switch (currentView) {
      case "consultorios": return <AdminTenantsView />;
      case "usuarios": return <AdminUsersView />;
      case "pacientes": return <AdminPacientesView />;
      case "citas": return <AdminCitasView />;
      case "pagos": return <AdminPagosView />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-8 py-3.5 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              {VIEW_TITLES[currentView]}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Vista global del sistema</p>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run type check (views not created yet — expect errors)**

```bash
pnpm check
```

Expected: Errors about missing view component files. Continue to Tasks 11–15 to create them.

---

## Task 11: Create AdminTenantsView

**Files:**
- Create: `client/src/components/admin/AdminTenantsView.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

interface TenantItem {
  _id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
  settings: { currency: string; timezone: string; sessionPrice: number };
}

export default function AdminTenantsView() {
  const [items, setItems] = useState<TenantItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<TenantItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (name) params.name = name;
      const { data } = await api.get("/admin/tenants", { params });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, name]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const planVariant = (plan: string) =>
    plan === "enterprise" ? "default" : plan === "pro" ? "secondary" : "outline";

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por nombre..."
          value={name}
          onChange={e => { setName(e.target.value); setPage(1); }}
          className="w-60"
        />
        <Button variant="outline" size="sm" onClick={() => { setName(""); setPage(1); }}>
          Limpiar
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} consultorios en total</p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Moneda</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Sin resultados</td></tr>
            ) : items.map(item => (
              <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.slug}</td>
                <td className="px-4 py-3">
                  <Badge variant={planVariant(item.plan) as any}>{item.plan}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.settings?.currency ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(item.createdAt).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditTarget(item); setSheetOpen(true); }}>
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Detalle del Consultorio</SheetTitle>
          </SheetHeader>
          {editTarget && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="space-y-1">
                <Label className="text-muted-foreground">ID</Label>
                <p className="font-mono text-xs break-all">{editTarget._id}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Nombre</Label>
                <p className="font-medium">{editTarget.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Slug</Label>
                <p className="font-mono">{editTarget.slug}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Plan</Label>
                <Badge variant={planVariant(editTarget.plan) as any}>{editTarget.plan}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Moneda</Label>
                <p>{editTarget.settings?.currency}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Zona horaria</Label>
                <p>{editTarget.settings?.timezone}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Precio sesión</Label>
                <p>{editTarget.settings?.sessionPrice}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Creado</Label>
                <p>{new Date(editTarget.createdAt).toLocaleString("es-CL")}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

- [ ] **Step 2: Run type check** — expected to still have errors from missing views. Continue.

---

## Task 12: Create AdminUsersView

**Files:**
- Create: `client/src/components/admin/AdminUsersView.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface UserItem {
  _id: string;
  nombre: string;
  email: string;
  rol: "admin" | "doctor";
  activo: boolean;
  tenantId: string;
  especialidad: string;
  createdAt: string;
}

export default function AdminUsersView() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState("");
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRol, setEditRol] = useState<"admin" | "doctor">("doctor");
  const [editActivo, setEditActivo] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (nombre) params.nombre = nombre;
      if (email) params.email = email;
      if (rol) params.rol = rol;
      const { data } = await api.get("/admin/users", { params });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, nombre, email, rol]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (user: UserItem) => {
    setEditTarget(user);
    setEditNombre(user.nombre);
    setEditEmail(user.email);
    setEditRol(user.rol);
    setEditActivo(user.activo);
    setEditPassword("");
    setSaveError("");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    setSaveError("");
    try {
      const payload: Record<string, unknown> = {
        nombre: editNombre,
        email: editEmail,
        rol: editRol,
        activo: editActivo,
      };
      if (editPassword) payload.password = editPassword;
      await api.patch(`/admin/users/${editTarget._id}`, payload);
      setSheetOpen(false);
      fetchData();
    } catch (err: any) {
      setSaveError(err.response?.data?.error ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por nombre..."
          value={nombre}
          onChange={e => { setNombre(e.target.value); setPage(1); }}
          className="w-52"
        />
        <Input
          placeholder="Buscar por email..."
          value={email}
          onChange={e => { setEmail(e.target.value); setPage(1); }}
          className="w-52"
        />
        <Select
          value={rol || "todos"}
          onValueChange={v => { setRol(v === "todos" ? "" : v); setPage(1); }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setNombre(""); setEmail(""); setRol(""); setPage(1); }}
        >
          Limpiar
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} usuarios en total</p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tenant</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Sin resultados</td></tr>
            ) : items.map(item => (
              <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{item.nombre}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={item.rol === "admin" ? "default" : "secondary"}>{item.rol}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={item.activo ? "default" : "destructive"}>
                    {item.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs truncate max-w-32">
                  {item.tenantId}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Editar Usuario</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={editRol} onValueChange={v => setEditRol(v as "admin" | "doctor")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editActivo} onCheckedChange={setEditActivo} />
              <Label>Activo</Label>
            </div>
            <div className="space-y-1.5">
              <Label>Nueva contraseña (opcional)</Label>
              <Input
                type="password"
                placeholder="Dejar vacío para no cambiar"
                value={editPassword}
                onChange={e => setEditPassword(e.target.value)}
              />
            </div>
            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {saveError}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

---

## Task 13: Create AdminPacientesView

**Files:**
- Create: `client/src/components/admin/AdminPacientesView.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PacienteItem {
  _id: string;
  nombre: string;
  apellido: string;
  estado: "activo" | "inactivo" | "en_deuda";
  telefono: string;
  email: string;
  notasClinicas: string;
  tenantId: string;
  fechaRegistro: string;
}

const estadoBadge = (estado: string) => {
  if (estado === "activo") return "default";
  if (estado === "en_deuda") return "destructive";
  return "secondary";
};

export default function AdminPacientesView() {
  const [items, setItems] = useState<PacienteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PacienteItem | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editApellido, setEditApellido] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEstado, setEditEstado] = useState<"activo" | "inactivo" | "en_deuda">("activo");
  const [editNotas, setEditNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (nombre) params.nombre = nombre;
      if (apellido) params.apellido = apellido;
      if (estado) params.estado = estado;
      const { data } = await api.get("/admin/pacientes", { params });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, nombre, apellido, estado]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (p: PacienteItem) => {
    setEditTarget(p);
    setEditNombre(p.nombre);
    setEditApellido(p.apellido);
    setEditTelefono(p.telefono);
    setEditEmail(p.email);
    setEditEstado(p.estado);
    setEditNotas(p.notasClinicas);
    setSaveError("");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    setSaveError("");
    try {
      await api.patch(`/admin/pacientes/${editTarget._id}`, {
        nombre: editNombre,
        apellido: editApellido,
        telefono: editTelefono,
        email: editEmail,
        estado: editEstado,
        notasClinicas: editNotas,
      });
      setSheetOpen(false);
      fetchData();
    } catch (err: any) {
      setSaveError(err.response?.data?.error ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Nombre..." value={nombre} onChange={e => { setNombre(e.target.value); setPage(1); }} className="w-44" />
        <Input placeholder="Apellido..." value={apellido} onChange={e => { setApellido(e.target.value); setPage(1); }} className="w-44" />
        <Select value={estado || "todos"} onValueChange={v => { setEstado(v === "todos" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
            <SelectItem value="en_deuda">En deuda</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => { setNombre(""); setApellido(""); setEstado(""); setPage(1); }}>Limpiar</Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} pacientes en total</p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Apellido</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Teléfono</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registro</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Sin resultados</td></tr>
            ) : items.map(item => (
              <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{item.nombre}</td>
                <td className="px-4 py-3">{item.apellido}</td>
                <td className="px-4 py-3">
                  <Badge variant={estadoBadge(item.estado) as any}>{item.estado}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.telefono || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(item.fechaRegistro).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>Editar Paciente</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Apellido</Label>
              <Input value={editApellido} onChange={e => setEditApellido(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={editTelefono} onChange={e => setEditTelefono(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={editEstado} onValueChange={v => setEditEstado(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="en_deuda">En deuda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notas clínicas</Label>
              <Textarea value={editNotas} onChange={e => setEditNotas(e.target.value)} rows={4} />
            </div>
            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{saveError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

---

## Task 14: Create AdminCitasView

**Files:**
- Create: `client/src/components/admin/AdminCitasView.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CitaItem {
  _id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: "programada" | "realizada" | "cancelada" | "no_asistio";
  tipoSesion: string;
  montoCita: number;
  notas: string;
  tenantId: string;
  pacienteId: string;
  doctorId: string;
}

const estadoBadge = (estado: string) => {
  if (estado === "realizada") return "default";
  if (estado === "cancelada" || estado === "no_asistio") return "destructive";
  return "secondary";
};

export default function AdminCitasView() {
  const [items, setItems] = useState<CitaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CitaItem | null>(null);
  const [editEstado, setEditEstado] = useState<CitaItem["estado"]>("programada");
  const [editNotas, setEditNotas] = useState("");
  const [editMonto, setEditMonto] = useState("");
  const [editHoraInicio, setEditHoraInicio] = useState("");
  const [editHoraFin, setEditHoraFin] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (fecha) params.fecha = fecha;
      if (estado) params.estado = estado;
      const { data } = await api.get("/admin/citas", { params });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, fecha, estado]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (c: CitaItem) => {
    setEditTarget(c);
    setEditEstado(c.estado);
    setEditNotas(c.notas);
    setEditMonto(String(c.montoCita));
    setEditHoraInicio(c.horaInicio);
    setEditHoraFin(c.horaFin);
    setSaveError("");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    setSaveError("");
    try {
      await api.patch(`/admin/citas/${editTarget._id}`, {
        estado: editEstado,
        notas: editNotas,
        montoCita: Number(editMonto),
        horaInicio: editHoraInicio,
        horaFin: editHoraFin,
      });
      setSheetOpen(false);
      fetchData();
    } catch (err: any) {
      setSaveError(err.response?.data?.error ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-3">
        <Input
          type="date"
          value={fecha}
          onChange={e => { setFecha(e.target.value); setPage(1); }}
          className="w-44"
        />
        <Select value={estado || "todos"} onValueChange={v => { setEstado(v === "todos" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="programada">Programada</SelectItem>
            <SelectItem value="realizada">Realizada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
            <SelectItem value="no_asistio">No asistió</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => { setFecha(""); setEstado(""); setPage(1); }}>Limpiar</Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} citas en total</p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Horario</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Monto</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Sin resultados</td></tr>
            ) : items.map(item => (
              <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(item.fecha).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{item.horaInicio} – {item.horaFin}</td>
                <td className="px-4 py-3 text-muted-foreground capitalize">{item.tipoSesion}</td>
                <td className="px-4 py-3">
                  <Badge variant={estadoBadge(item.estado) as any}>{item.estado}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.montoCita.toLocaleString("es-CL")}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>Editar Cita</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={editEstado} onValueChange={v => setEditEstado(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="programada">Programada</SelectItem>
                  <SelectItem value="realizada">Realizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="no_asistio">No asistió</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hora inicio</Label>
                <Input placeholder="09:00" value={editHoraInicio} onChange={e => setEditHoraInicio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora fin</Label>
                <Input placeholder="10:00" value={editHoraFin} onChange={e => setEditHoraFin(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <Input type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={editNotas} onChange={e => setEditNotas(e.target.value)} rows={3} />
            </div>
            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{saveError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

---

## Task 15: Create AdminPagosView + final verification

**Files:**
- Create: `client/src/components/admin/AdminPagosView.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PagoItem {
  _id: string;
  monto: number;
  fechaPago: string;
  metodo: "efectivo" | "transferencia" | "tarjeta";
  tipoPago: "adelantado" | "al_llegar" | "deuda";
  notas: string;
  tenantId: string;
  pacienteId: string;
}

const metodoBadge = (m: string) => {
  if (m === "transferencia") return "default";
  if (m === "tarjeta") return "secondary";
  return "outline";
};

export default function AdminPagosView() {
  const [items, setItems] = useState<PagoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [metodo, setMetodo] = useState("");
  const [tipoPago, setTipoPago] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PagoItem | null>(null);
  const [editMonto, setEditMonto] = useState("");
  const [editMetodo, setEditMetodo] = useState<PagoItem["metodo"]>("efectivo");
  const [editNotas, setEditNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (metodo) params.metodo = metodo;
      if (tipoPago) params.tipoPago = tipoPago;
      if (fechaDesde) params.fechaDesde = fechaDesde;
      if (fechaHasta) params.fechaHasta = fechaHasta;
      const { data } = await api.get("/admin/pagos", { params });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, metodo, tipoPago, fechaDesde, fechaHasta]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (p: PagoItem) => {
    setEditTarget(p);
    setEditMonto(String(p.monto));
    setEditMetodo(p.metodo);
    setEditNotas(p.notas);
    setSaveError("");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    setSaveError("");
    try {
      await api.patch(`/admin/pagos/${editTarget._id}`, {
        monto: Number(editMonto),
        metodo: editMetodo,
        notas: editNotas,
      });
      setSheetOpen(false);
      fetchData();
    } catch (err: any) {
      setSaveError(err.response?.data?.error ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap gap-3">
        <Select value={metodo || "todos"} onValueChange={v => { setMetodo(v === "todos" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Método" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
            <SelectItem value="tarjeta">Tarjeta</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tipoPago || "todos"} onValueChange={v => { setTipoPago(v === "todos" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="al_llegar">Al llegar</SelectItem>
            <SelectItem value="adelantado">Adelantado</SelectItem>
            <SelectItem value="deuda">Deuda</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" placeholder="Desde" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(1); }} className="w-40" />
        <Input type="date" placeholder="Hasta" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(1); }} className="w-40" />
        <Button variant="outline" size="sm" onClick={() => { setMetodo(""); setTipoPago(""); setFechaDesde(""); setFechaHasta(""); setPage(1); }}>
          Limpiar
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{total} pagos en total</p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Monto</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Método</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notas</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Sin resultados</td></tr>
            ) : items.map(item => (
              <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(item.fechaPago).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 font-medium">{item.monto.toLocaleString("es-CL")}</td>
                <td className="px-4 py-3">
                  <Badge variant={metodoBadge(item.metodo) as any}>{item.metodo}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.tipoPago}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-40">{item.notas || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>Editar Pago</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Monto</Label>
              <Input type="number" value={editMonto} onChange={e => setEditMonto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Método</Label>
              <Select value={editMetodo} onValueChange={v => setEditMetodo(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={editNotas} onChange={e => setEditNotas(e.target.value)} rows={3} />
            </div>
            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{saveError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
```

- [ ] **Step 2: Final type check**

```bash
pnpm check
```

Expected: No TypeScript errors anywhere in the project.

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```

Expected: All tests pass (backend tests only — frontend has no test runner configured).

- [ ] **Step 4: Final commit**

```bash
git add client/src/pages/AdminPanelPage.tsx \
        client/src/components/admin/ \
        client/src/App.tsx
git commit -m "feat(admin-panel): add superadmin frontend — independent panel with global views for all entities"
```

---

## Done

After all tasks complete:

1. Start the dev server (`pnpm run dev` + `pnpm run dev:api`) and log in with `admin@psicogestion.com` / `Admin1234!` — you should land on `/admin`.
2. Verify each tab (Consultorios, Usuarios, Pacientes, Citas, Pagos) shows data from the seed.
3. Edit a user and confirm the changes persist.
4. Reset a user password via the Users edit sheet and verify the new password works.
5. Log in as a regular doctor (`martin@psicogestion.com` / `Doctor123!`) and confirm `/admin` redirects to `/`.
