# Doctor Timezone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-doctor `timezone` field that defaults to the browser's timezone at registration, is always editable from the profile, and drives Google Calendar sync instead of the tenant timezone.

**Architecture:** Timezone lives on the `User` model. The register endpoint accepts it; a new `PATCH /api/auth/me` endpoint lets each doctor update their own profile (replacing ProfileView's localStorage approach). Google Calendar sync reads `doctor.timezone` with a fallback to `tenant.settings.timezone`.

**Tech Stack:** Mongoose, Zod, Express, React, TypeScript, Vitest + Supertest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `server/models/User.ts` | Modify | Add `timezone` field with default `"America/Lima"` |
| `server/models/Tenant.ts` | Modify | Update default timezone to `"America/Lima"` |
| `server/seed.ts` | Modify | Update seed timezone to `"America/Lima"` |
| `shared/types.ts` | Modify | Add `timezone: string` to `UserDTO` |
| `server/routes/auth.ts` | Modify | Accept `timezone` in register; expose in all user responses; add `PATCH /me` |
| `server/routes/citas.ts` | Modify | Use `doctor.timezone` instead of `tenant.settings.timezone` in all 3 sync calls |
| `client/src/lib/timezones.ts` | Create | Static IANA timezone list `{ value, label }[]` |
| `client/src/contexts/AuthContext.tsx` | Modify | Add `timezone` to `RegisterData`; add `updateUser()` function |
| `client/src/pages/RegisterPage.tsx` | Modify | Add Zona Horaria field pre-filled from browser |
| `client/src/components/ProfileView.tsx` | Modify | Replace localStorage with `PATCH /api/auth/me`; add timezone card |
| `server/__tests__/auth.test.ts` | Modify | Tests for timezone in register response + PATCH /me |

---

## Task 1: Model + Shared Types

**Files:**
- Modify: `server/models/User.ts`
- Modify: `server/models/Tenant.ts`
- Modify: `server/seed.ts`
- Modify: `shared/types.ts`

- [ ] **Step 1: Add `timezone` to User model**

In `server/models/User.ts`, add to `IUser` interface (after `activo`):

```ts
timezone: string;
```

Add to `UserSchema` (after `activo`):

```ts
timezone: { type: String, default: "America/Lima" },
```

- [ ] **Step 2: Update Tenant default**

In `server/models/Tenant.ts`, change:
```ts
timezone: { type: String, default: "America/Argentina/Buenos_Aires" },
```
to:
```ts
timezone: { type: String, default: "America/Lima" },
```

- [ ] **Step 3: Update seed**

In `server/seed.ts`, change:
```ts
settings: { currency: "ARS", timezone: "America/Argentina/Buenos_Aires", sessionPrice: 15000 },
```
to:
```ts
settings: { currency: "ARS", timezone: "America/Lima", sessionPrice: 15000 },
```

- [ ] **Step 4: Add timezone to UserDTO**

In `shared/types.ts`, in `UserDTO` (after `activo`):
```ts
timezone: string;
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add server/models/User.ts server/models/Tenant.ts server/seed.ts shared/types.ts
git commit -m "feat: add timezone field to User model and update defaults to America/Lima"
```

---

## Task 2: Backend — Register + GET /me expose timezone

**Files:**
- Modify: `server/routes/auth.ts`
- Modify: `server/__tests__/auth.test.ts`

- [ ] **Step 1: Write failing tests**

In `server/__tests__/auth.test.ts`, add inside `describe("POST /api/auth/register", ...)`:

```ts
it("stores and returns explicit timezone", async () => {
  const res = await request.post("/api/auth/register").send({
    nombreConsultorio: "Consultorio Lima",
    nombre: "Dr. Lima",
    email: "lima@test.com",
    especialidad: "clinica",
    password: "Password123",
    timezone: "America/Lima",
  });

  expect(res.status).toBe(201);
  expect(res.body.user.timezone).toBe("America/Lima");
});

it("uses default timezone when omitted", async () => {
  const res = await request.post("/api/auth/register").send({
    nombreConsultorio: "Sin Timezone",
    nombre: "Dr. Default",
    email: "default-tz@test.com",
    especialidad: "clinica",
    password: "Password123",
  });

  expect(res.status).toBe(201);
  expect(res.body.user.timezone).toBe("America/Lima");
});
```

And inside `describe("GET /api/auth/me", ...)`:

```ts
it("includes timezone in response", async () => {
  const { token } = await createTestUser();
  const res = await request
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body.user.timezone).toBeDefined();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm exec vitest run server/__tests__/auth.test.ts
```

Expected: the 3 new tests FAIL (timezone undefined in response).

- [ ] **Step 3: Update register schema and response**

In `server/routes/auth.ts`, update `registerSchema`:

```ts
const registerSchema = z.object({
  nombreConsultorio: z.string().min(2),
  nombre: z.string().min(2),
  email: z.string().email(),
  especialidad: z.enum(["clinica", "infantil", "educativa", "neuropsicologia", "organizacional", "otra"]),
  password: z.string().min(8),
  timezone: z.string().optional(),
});
```

Update the `User.create(...)` call to pass timezone:

```ts
const { nombreConsultorio, nombre, email, especialidad, password, timezone } = result.data;
// ...
const user = await User.create({
  tenantId: tenant._id,
  nombre,
  email,
  passwordHash,
  rol: "admin",
  especialidad,
  ...(timezone ? { timezone } : {}),
});
```

Update the register response `user` object to include `timezone`:

```ts
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
```

Update the login response `user` object similarly (same shape):

```ts
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
```

Update `GET /api/auth/me` response `user` object:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm exec vitest run server/__tests__/auth.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add server/routes/auth.ts server/__tests__/auth.test.ts
git commit -m "feat: expose timezone in register/login/me responses"
```

---

## Task 3: Backend — PATCH /api/auth/me

**Files:**
- Modify: `server/routes/auth.ts`
- Modify: `server/__tests__/auth.test.ts`

- [ ] **Step 1: Write failing tests**

In `server/__tests__/auth.test.ts`, add a new `describe` block at the end:

```ts
describe("PATCH /api/auth/me", () => {
  it("updates nombre and timezone", async () => {
    const { token } = await createTestUser();

    const res = await request
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Dr. Actualizado", timezone: "America/Bogota" });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Dr. Actualizado");
    expect(res.body.timezone).toBe("America/Bogota");
    expect(res.body.passwordHash).toBeUndefined();
  });

  it("returns 401 without token", async () => {
    const res = await request
      .patch("/api/auth/me")
      .send({ nombre: "Hacker" });

    expect(res.status).toBe(401);
  });

  it("returns 409 if email is already taken by another user in same tenant", async () => {
    const ctx = await createTestUser({ email: "original@test.com" });
    await createTestUser({ email: "taken@test.com", tenantId: String(ctx.tenant._id) });

    const res = await request
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${ctx.token}`)
      .send({ email: "taken@test.com" });

    expect(res.status).toBe(409);
  });

  it("allows updating to same email (no-op)", async () => {
    const { token } = await createTestUser({ email: "same@test.com" });

    const res = await request
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "same@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("same@test.com");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm exec vitest run server/__tests__/auth.test.ts
```

Expected: the 4 new PATCH tests FAIL (404 — route not found).

- [ ] **Step 3: Implement PATCH /api/auth/me**

In `server/routes/auth.ts`, add before the `export default router` line:

```ts
const updateMeSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  especialidad: z.enum(["clinica", "infantil", "educativa", "neuropsicologia", "organizacional", "otra"]).optional(),
  timezone: z.string().optional(),
});

// PATCH /api/auth/me — update own profile
router.patch("/me", authenticate, async (req, res) => {
  const { userId, tenantId } = req.user!;
  const result = updateMeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const { email, ...rest } = result.data;
  const update: Record<string, unknown> = { ...rest };

  if (email) {
    const conflict = await User.findOne({
      email: email.toLowerCase(),
      tenantId,
      _id: { $ne: userId },
    });
    if (conflict) {
      res.status(409).json({ error: "Ese email ya está en uso por otro usuario" });
      return;
    }
    update.email = email.toLowerCase();
  }

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).select("-passwordHash").lean();
  if (!user) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  res.json(user);
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm exec vitest run server/__tests__/auth.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add server/routes/auth.ts server/__tests__/auth.test.ts
git commit -m "feat: add PATCH /api/auth/me for self-profile update including timezone"
```

---

## Task 4: Calendar sync uses doctor.timezone

**Files:**
- Modify: `server/routes/citas.ts`

- [ ] **Step 1: Add User import to citas.ts**

In `server/routes/citas.ts`, add to the imports:

```ts
import { User } from "../models/User.js";
```

- [ ] **Step 2: Update POST /api/citas sync block**

Replace the fire-and-forget block after `res.status(201).json(...)`:

```ts
// Sync con Google Calendar (fire-and-forget)
const [paciente, tenant, doctor] = await Promise.all([
  Paciente.findById(cita.pacienteId).select("nombre apellido").lean(),
  Tenant.findById(tenantId).select("settings").lean(),
  User.findById(cita.doctorId).select("timezone").lean(),
]);
if (paciente) {
  const pacienteNombre = `${paciente.nombre} ${paciente.apellido}`;
  const timezone = (doctor as any)?.timezone ?? tenant?.settings?.timezone ?? "America/Lima";
  syncCitaToCalendar(cita, pacienteNombre, timezone).catch(console.error);
}
```

- [ ] **Step 3: Update PUT /api/citas/:id sync block**

Replace the fire-and-forget block after `res.json(mapCitaDTO(cita.toObject()))`:

```ts
// Sync con Google Calendar (fire-and-forget)
const [paciente, tenant, doctor] = await Promise.all([
  Paciente.findById(cita.pacienteId).select("nombre apellido").lean(),
  Tenant.findById(tenantId).select("settings").lean(),
  User.findById(cita.doctorId).select("timezone").lean(),
]);
if (paciente) {
  const pacienteNombre = `${paciente.nombre} ${paciente.apellido}`;
  const timezone = (doctor as any)?.timezone ?? tenant?.settings?.timezone ?? "America/Lima";
  syncCitaToCalendar(cita, pacienteNombre, timezone).catch(console.error);
}
```

- [ ] **Step 4: Update DELETE /api/citas/:id sync block**

Replace the fire-and-forget block after `res.json({ ok: true })`:

```ts
// Sync cancelación con Google Calendar (fire-and-forget)
if (cita.googleCalendarEventId) {
  const [tenant, doctor] = await Promise.all([
    Tenant.findById(tenantId).select("settings").lean(),
    User.findById(cita.doctorId).select("timezone").lean(),
  ]);
  const timezone = (doctor as any)?.timezone ?? tenant?.settings?.timezone ?? "America/Lima";
  syncCitaToCalendar(cita, "", timezone).catch(console.error);
}
```

- [ ] **Step 5: Run all tests to confirm nothing broke**

```bash
pnpm exec vitest run
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add server/routes/citas.ts
git commit -m "feat: use doctor.timezone for GCal sync with tenant fallback"
```

---

## Task 5: Frontend — IANA timezone list

**Files:**
- Create: `client/src/lib/timezones.ts`

- [ ] **Step 1: Create the timezones file**

Create `client/src/lib/timezones.ts` with the full content:

```ts
export interface TimezoneOption {
  value: string;
  label: string;
  region: string;
}

export const TIMEZONES: TimezoneOption[] = [
  // América del Sur
  { value: "America/Lima", label: "Lima, Bogotá, Quito (UTC-5)", region: "América" },
  { value: "America/Bogota", label: "Bogotá (UTC-5)", region: "América" },
  { value: "America/Guayaquil", label: "Quito, Guayaquil (UTC-5)", region: "América" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (UTC-3)", region: "América" },
  { value: "America/Sao_Paulo", label: "São Paulo, Brasília (UTC-3)", region: "América" },
  { value: "America/Santiago", label: "Santiago (UTC-4/-3)", region: "América" },
  { value: "America/Caracas", label: "Caracas (UTC-4)", region: "América" },
  { value: "America/La_Paz", label: "La Paz (UTC-4)", region: "América" },
  { value: "America/Asuncion", label: "Asunción (UTC-4/-3)", region: "América" },
  { value: "America/Montevideo", label: "Montevideo (UTC-3)", region: "América" },
  // América Central y México
  { value: "America/Mexico_City", label: "Ciudad de México (UTC-6/-5)", region: "América" },
  { value: "America/Monterrey", label: "Monterrey (UTC-6/-5)", region: "América" },
  { value: "America/Guatemala", label: "Guatemala (UTC-6)", region: "América" },
  { value: "America/Costa_Rica", label: "San José (UTC-6)", region: "América" },
  // América del Norte
  { value: "America/New_York", label: "Nueva York (UTC-5/-4)", region: "América" },
  { value: "America/Chicago", label: "Chicago (UTC-6/-5)", region: "América" },
  { value: "America/Denver", label: "Denver (UTC-7/-6)", region: "América" },
  { value: "America/Los_Angeles", label: "Los Ángeles (UTC-8/-7)", region: "América" },
  { value: "America/Toronto", label: "Toronto (UTC-5/-4)", region: "América" },
  { value: "America/Vancouver", label: "Vancouver (UTC-8/-7)", region: "América" },
  // Europa
  { value: "Europe/Madrid", label: "Madrid (UTC+1/+2)", region: "Europa" },
  { value: "Europe/London", label: "Londres (UTC+0/+1)", region: "Europa" },
  { value: "Europe/Paris", label: "París (UTC+1/+2)", region: "Europa" },
  { value: "Europe/Berlin", label: "Berlín (UTC+1/+2)", region: "Europa" },
  { value: "Europe/Rome", label: "Roma (UTC+1/+2)", region: "Europa" },
  { value: "Europe/Lisbon", label: "Lisboa (UTC+0/+1)", region: "Europa" },
  // Asia
  { value: "Asia/Dubai", label: "Dubái (UTC+4)", region: "Asia" },
  { value: "Asia/Kolkata", label: "Mumbai, Nueva Delhi (UTC+5:30)", region: "Asia" },
  { value: "Asia/Shanghai", label: "Pekín, Shanghái (UTC+8)", region: "Asia" },
  { value: "Asia/Tokyo", label: "Tokio (UTC+9)", region: "Asia" },
  // Oceanía
  { value: "Australia/Sydney", label: "Sídney (UTC+10/+11)", region: "Oceanía" },
  { value: "Pacific/Auckland", label: "Auckland (UTC+12/+13)", region: "Oceanía" },
  // África
  { value: "Africa/Cairo", label: "El Cairo (UTC+2)", region: "África" },
  { value: "Africa/Johannesburg", label: "Johannesburgo (UTC+2)", region: "África" },
];

/** Returns the best matching option for a given IANA key, or undefined */
export function findTimezone(value: string): TimezoneOption | undefined {
  return TIMEZONES.find(tz => tz.value === value);
}

/** Returns value if it's in the list, otherwise "America/Lima" */
export function resolveTimezone(value: string): string {
  return findTimezone(value) ? value : "America/Lima";
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/timezones.ts
git commit -m "feat: add IANA timezone list for selector"
```

---

## Task 6: Register form — timezone field

**Files:**
- Modify: `client/src/contexts/AuthContext.tsx`
- Modify: `client/src/pages/RegisterPage.tsx`

- [ ] **Step 1: Update AuthContext RegisterData and register function**

In `client/src/contexts/AuthContext.tsx`, add `timezone` to `RegisterData`:

```ts
interface RegisterData {
  nombreConsultorio: string;
  nombre: string;
  email: string;
  especialidad: string;
  password: string;
  timezone: string;
}
```

The `register` callback already passes `formData` to the API, so no other change is needed there.

- [ ] **Step 2: Add timezone field to RegisterPage**

In `client/src/pages/RegisterPage.tsx`:

Add import at top:

```ts
import { TIMEZONES, resolveTimezone } from '../lib/timezones';
```

Update `form` state initial value:

```ts
const [form, setForm] = useState({
  nombreConsultorio: '',
  nombre: '',
  email: '',
  especialidad: '',
  password: '',
  confirmPassword: '',
  timezone: resolveTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone),
});
```

Add the Zona Horaria field in JSX, after the Especialidad `<Field>` and before the Contraseña `<Field>`:

```tsx
<Field label="Zona horaria">
  <select
    value={form.timezone}
    onChange={set('timezone')}
    required
    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow bg-white"
  >
    {TIMEZONES.map(tz => (
      <option key={tz.value} value={tz.value}>
        {tz.label}
      </option>
    ))}
  </select>
</Field>
```

Update the `register(...)` call to include timezone:

```ts
await register({
  nombreConsultorio: form.nombreConsultorio,
  nombre: form.nombre,
  email: form.email,
  especialidad: form.especialidad,
  password: form.password,
  timezone: form.timezone,
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/contexts/AuthContext.tsx client/src/pages/RegisterPage.tsx
git commit -m "feat: add timezone field to register form with browser default"
```

---

## Task 7: ProfileView — backend + timezone

**Files:**
- Modify: `client/src/contexts/AuthContext.tsx`
- Modify: `client/src/components/ProfileView.tsx`

- [ ] **Step 1: Add updateUser to AuthContext**

In `client/src/contexts/AuthContext.tsx`, add `updateUser` to the `AuthContextValue` interface:

```ts
interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (partial: Partial<UserDTO>) => void;
}
```

Add the `updateUser` callback implementation inside `AuthProvider` (after `logout`):

```ts
const updateUser = useCallback((partial: Partial<UserDTO>) => {
  setState(s => ({
    ...s,
    user: s.user ? { ...s.user, ...partial } : null,
  }));
}, []);
```

Add `updateUser` to the context value:

```tsx
<AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
```

- [ ] **Step 2: Rewrite ProfileView**

Replace the entire content of `client/src/components/ProfileView.tsx` with:

```tsx
import React, { useState } from "react";
import { Camera, Save, User, Mail, Award, Building2, Globe, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { TIMEZONES, resolveTimezone } from "@/lib/timezones";

export default function ProfileView() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    nombre: user?.nombre ?? "",
    email: user?.email ?? "",
    especialidad: user?.especialidad ?? "",
    timezone: resolveTimezone(user?.timezone ?? "America/Lima"),
    logoUrl: "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setForm(f => ({ ...f, logoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { data } = await api.patch("/auth/me", {
        nombre: form.nombre,
        email: form.email,
        especialidad: form.especialidad,
        timezone: form.timezone,
      });
      updateUser({
        nombre: data.nombre,
        email: data.email,
        especialidad: data.especialidad,
        timezone: data.timezone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const initials = form.nombre
    ? form.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const ESPECIALIDADES = [
    { value: "clinica", label: "Psicología Clínica" },
    { value: "infantil", label: "Psicología Infantil" },
    { value: "educativa", label: "Psicología Educativa" },
    { value: "neuropsicologia", label: "Neuropsicología" },
    { value: "organizacional", label: "Psicología Organizacional" },
    { value: "otra", label: "Otra" },
  ];

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Mi Perfil</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Información personal y configuración de cuenta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Foto / Logo</h3>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary text-2xl font-bold">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              >
                <Camera size={13} strokeWidth={2.5} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Sube una foto o logo de tu consultorio.</p>
              <p className="text-xs">JPG, PNG o GIF · máx. 2 MB</p>
              {form.logoUrl && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, logoUrl: "" }))}
                  className="text-xs text-destructive hover:text-destructive/70 font-medium transition-colors"
                >
                  Eliminar imagen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Datos personales */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Datos Personales</h3>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <User size={12} />
              Nombre completo
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Dra. Ana García"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Mail size={12} />
              Correo electrónico
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Building2 size={12} />
              Especialidad
            </label>
            <select
              value={form.especialidad}
              onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow"
            >
              {ESPECIALIDADES.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Zona Horaria */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Zona Horaria</h3>
          <p className="text-xs text-muted-foreground -mt-2">
            Usada para sincronizar tus citas con Google Calendar correctamente.
          </p>
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              <Globe size={12} />
              Zona horaria
            </label>
            <select
              value={form.timezone}
              onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Save size={15} strokeWidth={2.5} />
            )}
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium">
              ¡Guardado correctamente!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Remove unused exports from old ProfileView**

The old file exported `loadProfile` and `ProfileData`. Check if anything imports them:

```bash
grep -r "loadProfile\|ProfileData" client/src --include="*.tsx" --include="*.ts"
```

If nothing imports them, nothing to do (the new file doesn't export them). If something does import them, remove those imports from the consuming file.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 5: Run all tests**

```bash
pnpm exec vitest run
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add client/src/contexts/AuthContext.tsx client/src/components/ProfileView.tsx
git commit -m "feat: connect ProfileView to backend and add timezone selector"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - `User.timezone` field → Task 1 ✓
  - Default `"America/Lima"` everywhere → Tasks 1, 4 ✓
  - Register accepts timezone → Task 2 ✓
  - Browser default on register form → Task 6 ✓
  - `PATCH /api/auth/me` → Task 3 ✓
  - ProfileView connects to backend → Task 7 ✓
  - ProfileView timezone editable → Task 7 ✓
  - GCal sync uses doctor.timezone with fallback → Task 4 ✓
  - `UserDTO.timezone` → Task 1 ✓
  - `updateUser` in AuthContext → Task 7 ✓

- [x] **No placeholders:** All steps have complete code

- [x] **Type consistency:**
  - `resolveTimezone` defined in Task 5, used in Tasks 6 and 7 ✓
  - `TIMEZONES` defined in Task 5, used in Tasks 6 and 7 ✓
  - `updateUser(partial: Partial<UserDTO>)` defined in Task 7 step 1, used in Task 7 step 2 ✓
  - `UserDTO.timezone` added in Task 1, consumed in Tasks 2, 3, 7 ✓
