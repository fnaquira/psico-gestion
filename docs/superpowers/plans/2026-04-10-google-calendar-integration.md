# Google Calendar Integration (Per-User Credentials) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow each psychologist to configure their own Google OAuth credentials (Client ID + Client Secret) through the app UI, connect their Google Calendar, and sync appointments automatically.

**Architecture:** Credentials (Client ID + Client Secret) are stored AES-256 encrypted per user in MongoDB. The backend service uses the user's own credentials to build the OAuth2 client for all Google API operations. Two new frontend views are added: "Configuración" (credentials form + OAuth connection) and "Manual GCal" (step-by-step setup guide). The OAuth callback redirect is fixed from `/configuracion` (non-existent route) to `/?view=configuracion&gcal=success|error` which Home.tsx interprets.

**Tech Stack:** Express, Mongoose, googleapis, AES-256-CBC (Node.js crypto), React 19, Tailwind CSS 4, Vitest + Supertest

---

## File Map

### Backend — Modified
- `server/models/User.ts` — add `googleClientId?: string`, `googleClientSecret?: string` to `IGoogleCalendar`
- `server/services/googleCalendarService.ts` — update `createOAuth2Client`, `getAuthUrl`, `getAuthenticatedClient`; add `saveCredentials`, `getDecryptedCredentials`; fix `disconnectCalendar`
- `server/routes/googleCalendar.ts` — add `PUT/GET /credentials`; update `/auth-url` + `/callback` to use per-user creds; fix OAuth redirect URL
- `server/env.ts` — add `TOKEN_ENCRYPTION_KEY` and `GOOGLE_REDIRECT_URI` to required env vars

### Backend — New
- `server/__tests__/googleCalendarCredentials.test.ts` — tests for credentials endpoints and auth-url behavior

### Frontend — Modified
- `client/src/components/GoogleCalendarSettings.tsx` — remove query param logic; add `gcalStatus` + `gcalErrorReason` props
- `client/src/components/Sidebar.tsx` — add "Configuración" and "Manual GCal" nav items; rename "Perfil / Config." to "Perfil"
- `client/src/pages/Home.tsx` — add `configuracion` and `manual-gcal` view types; read `?view=configuracion&gcal=` on mount

### Frontend — New
- `client/src/components/ConfiguracionView.tsx` — credentials form + GoogleCalendarSettings card
- `client/src/components/ManualGCalView.tsx` — step-by-step Google Cloud Console guide

---

## Task 1: User model — add googleClientId and googleClientSecret

**Files:**
- Modify: `server/models/User.ts`

- [ ] **Step 1: Update IGoogleCalendar interface**

In `server/models/User.ts`, replace:
```ts
export interface IGoogleCalendar {
  accessToken: string;
  refreshToken: string;
  calendarId: string;
  syncEnabled: boolean;
  connectedAt: Date;
}
```
With:
```ts
export interface IGoogleCalendar {
  googleClientId?: string;     // AES-256 encrypted
  googleClientSecret?: string; // AES-256 encrypted
  accessToken?: string;        // AES-256 encrypted
  refreshToken?: string;       // AES-256 encrypted
  calendarId?: string;
  syncEnabled: boolean;
  connectedAt?: Date;
}
```

- [ ] **Step 2: Update the Mongoose schema to add the new fields**

In `server/models/User.ts`, replace the entire `googleCalendar` block inside `UserSchema` with:
```ts
googleCalendar: {
  googleClientId: { type: String },
  googleClientSecret: { type: String },
  accessToken: { type: String },
  refreshToken: { type: String },
  calendarId: { type: String, default: "primary" },
  syncEnabled: { type: Boolean, default: true },
  connectedAt: { type: Date },
},
```

- [ ] **Step 3: Run TypeScript check**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/models/User.ts
git commit -m "feat: add googleClientId and googleClientSecret to User model"
```

---

## Task 2: Service — per-user OAuth2 client + new helpers + fix disconnectCalendar

**Files:**
- Modify: `server/services/googleCalendarService.ts`

- [ ] **Step 1: Update createOAuth2Client to accept per-user credentials**

Replace:
```ts
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}
```
With:
```ts
export function createOAuth2Client(clientId: string, clientSecret: string) {
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI,
  );
}
```

- [ ] **Step 2: Update getAuthUrl to accept credentials**

Replace:
```ts
export function getAuthUrl(state: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state,
  });
}
```
With:
```ts
export function getAuthUrl(state: string, clientId: string, clientSecret: string): string {
  const oauth2Client = createOAuth2Client(clientId, clientSecret);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state,
  });
}
```

- [ ] **Step 3: Add getDecryptedCredentials helper (after getAuthUrl)**

```ts
export function getDecryptedCredentials(
  user: IUser,
): { clientId: string; clientSecret: string } | null {
  if (!user.googleCalendar?.googleClientId || !user.googleCalendar?.googleClientSecret) {
    return null;
  }
  return {
    clientId: decrypt(user.googleCalendar.googleClientId),
    clientSecret: decrypt(user.googleCalendar.googleClientSecret),
  };
}
```

- [ ] **Step 4: Add saveCredentials function (after getDecryptedCredentials)**

```ts
export async function saveCredentials(
  userId: string,
  clientId: string,
  clientSecret: string,
): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    "googleCalendar.googleClientId": encrypt(clientId),
    "googleCalendar.googleClientSecret": encrypt(clientSecret),
  });
}
```

- [ ] **Step 5: Update getAuthenticatedClient to use per-user credentials**

Replace the private `getAuthenticatedClient` function:
```ts
async function getAuthenticatedClient(user: IUser) {
  if (
    !user.googleCalendar?.accessToken ||
    !user.googleCalendar?.googleClientId ||
    !user.googleCalendar?.googleClientSecret
  ) {
    return null;
  }

  const creds = getDecryptedCredentials(user);
  if (!creds) return null;

  const oauth2Client = createOAuth2Client(creds.clientId, creds.clientSecret);

  const accessToken = decrypt(user.googleCalendar.accessToken);
  const refreshToken = decrypt(user.googleCalendar.refreshToken!);

  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  oauth2Client.on("tokens", async tokens => {
    if (tokens.access_token) {
      await User.findByIdAndUpdate(user._id, {
        "googleCalendar.accessToken": encrypt(tokens.access_token),
      });
    }
  });

  return oauth2Client;
}
```

- [ ] **Step 6: Fix disconnectCalendar to preserve credentials**

Replace:
```ts
export async function disconnectCalendar(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    $unset: { googleCalendar: "" },
  });
}
```
With:
```ts
export async function disconnectCalendar(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    $unset: {
      "googleCalendar.accessToken": "",
      "googleCalendar.refreshToken": "",
      "googleCalendar.calendarId": "",
      "googleCalendar.syncEnabled": "",
      "googleCalendar.connectedAt": "",
    },
  });
}
```

This preserves `googleClientId` and `googleClientSecret` so the user doesn't need to re-enter them after disconnecting Google Calendar.

- [ ] **Step 7: Run TypeScript check**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add server/services/googleCalendarService.ts
git commit -m "feat: update googleCalendarService for per-user OAuth credentials"
```

---

## Task 3: Routes — credentials endpoints + updated auth-url/callback + fix redirect

**Files:**
- Modify: `server/routes/googleCalendar.ts`
- Create: `server/__tests__/googleCalendarCredentials.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/__tests__/googleCalendarCredentials.test.ts`:
```ts
import { describe, it, expect, beforeAll } from "vitest";
import { request, createTestUser } from "./helpers.js";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = "a".repeat(64); // 32 bytes as hex for AES-256
  process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/api/google-calendar/callback";
});

describe("GET /api/google-calendar/credentials", () => {
  it("returns { configured: false } when no credentials saved", async () => {
    const { token } = await createTestUser();
    const res = await request
      .get("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ configured: false });
  });

  it("returns 401 without token", async () => {
    const res = await request.get("/api/google-calendar/credentials");
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/google-calendar/credentials", () => {
  it("saves credentials and returns { ok: true }", async () => {
    const { token } = await createTestUser();
    const res = await request
      .put("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId: "my-client-id", clientSecret: "my-client-secret" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("returns { configured: true } after saving", async () => {
    const { token } = await createTestUser();
    await request
      .put("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId: "my-client-id", clientSecret: "my-client-secret" });

    const res = await request
      .get("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ configured: true });
  });

  it("returns 400 when clientId is missing", async () => {
    const { token } = await createTestUser();
    const res = await request
      .put("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientSecret: "secret-only" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when clientSecret is missing", async () => {
    const { token } = await createTestUser();
    const res = await request
      .put("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId: "id-only" });
    expect(res.status).toBe(400);
  });

  it("returns 401 without token", async () => {
    const res = await request
      .put("/api/google-calendar/credentials")
      .send({ clientId: "id", clientSecret: "secret" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/google-calendar/auth-url", () => {
  it("returns 400 when no credentials configured", async () => {
    const { token } = await createTestUser();
    const res = await request
      .get("/api/google-calendar/auth-url")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/credenciales/i);
  });

  it("returns { url } pointing to Google when credentials are configured", async () => {
    const { token } = await createTestUser();
    await request
      .put("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: "test-client-id.apps.googleusercontent.com",
        clientSecret: "GOCSPX-test-secret",
      });

    const res = await request
      .get("/api/google-calendar/auth-url")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.url).toContain("accounts.google.com");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- --reporter=verbose server/__tests__/googleCalendarCredentials.test.ts
```

Expected: FAIL — new routes don't exist yet.

- [ ] **Step 3: Replace the entire googleCalendar route file**

Replace `server/routes/googleCalendar.ts` with:
```ts
import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { User } from "../models/User";
import {
  getAuthUrl,
  createOAuth2Client,
  saveTokens,
  disconnectCalendar,
  saveCredentials,
  getDecryptedCredentials,
} from "../services/googleCalendarService";

const router = Router();

// GET /api/google-calendar/status
router.get("/status", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user!.userId).select("googleCalendar");
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    if (!user.googleCalendar?.accessToken) {
      res.json({ connected: false });
      return;
    }

    res.json({
      connected: true,
      syncEnabled: user.googleCalendar.syncEnabled,
      calendarId: user.googleCalendar.calendarId,
      connectedAt: user.googleCalendar.connectedAt,
    });
  } catch {
    res.status(500).json({ error: "Error al obtener estado" });
  }
});

// GET /api/google-calendar/credentials
router.get("/credentials", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user!.userId).select("googleCalendar");
    const configured = !!(
      user?.googleCalendar?.googleClientId && user?.googleCalendar?.googleClientSecret
    );
    res.json({ configured });
  } catch {
    res.status(500).json({ error: "Error al obtener estado de credenciales" });
  }
});

// PUT /api/google-calendar/credentials
router.put("/credentials", authenticate, async (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    res.status(400).json({ error: "clientId y clientSecret son requeridos" });
    return;
  }
  try {
    await saveCredentials(req.user!.userId, clientId, clientSecret);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error al guardar credenciales" });
  }
});

// GET /api/google-calendar/auth-url
router.get("/auth-url", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user!.userId).select("googleCalendar");
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const creds = getDecryptedCredentials(user);
    if (!creds) {
      res.status(400).json({ error: "Primero configurá tus credenciales de Google" });
      return;
    }

    const state = Buffer.from(
      JSON.stringify({ userId: req.user!.userId, tenantId: req.user!.tenantId }),
    ).toString("base64url");

    const url = getAuthUrl(state, creds.clientId, creds.clientSecret);
    res.json({ url });
  } catch {
    res.status(500).json({ error: "Error al generar URL de autorización" });
  }
});

// GET /api/google-calendar/callback
router.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    res.redirect(`/?view=configuracion&gcal=error&reason=${error}`);
    return;
  }

  if (!code || !state) {
    res.status(400).json({ error: "Parámetros inválidos" });
    return;
  }

  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state as string, "base64url").toString());
    userId = decoded.userId;
    if (!userId) throw new Error("userId vacío");
  } catch {
    res.status(400).json({ error: "State inválido" });
    return;
  }

  try {
    const user = await User.findById(userId).select("googleCalendar");
    if (!user) {
      res.redirect("/?view=configuracion&gcal=error&reason=user_not_found");
      return;
    }

    const creds = getDecryptedCredentials(user);
    if (!creds) {
      res.redirect("/?view=configuracion&gcal=error&reason=no_credentials");
      return;
    }

    const oauth2Client = createOAuth2Client(creds.clientId, creds.clientSecret);
    const { tokens } = await oauth2Client.getToken(code as string);

    if (!tokens.access_token || !tokens.refresh_token) {
      res.redirect("/?view=configuracion&gcal=error&reason=no_tokens");
      return;
    }

    await saveTokens(userId, tokens.access_token, tokens.refresh_token);
    res.redirect("/?view=configuracion&gcal=success");
  } catch (err) {
    console.error("[GCal] Error en callback:", err);
    res.redirect("/?view=configuracion&gcal=error&reason=server");
  }
});

// PATCH /api/google-calendar/toggle-sync
router.patch("/toggle-sync", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user?.googleCalendar?.accessToken) {
      res.status(400).json({ error: "Google Calendar no vinculado" });
      return;
    }

    const newState = !user.googleCalendar.syncEnabled;
    await User.findByIdAndUpdate(req.user!.userId, {
      "googleCalendar.syncEnabled": newState,
    });

    res.json({ syncEnabled: newState });
  } catch {
    res.status(500).json({ error: "Error al cambiar estado de sync" });
  }
});

// DELETE /api/google-calendar/disconnect
router.delete("/disconnect", authenticate, async (req, res) => {
  try {
    await disconnectCalendar(req.user!.userId);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error al desconectar" });
  }
});

export default router;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- --reporter=verbose server/__tests__/googleCalendarCredentials.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add server/routes/googleCalendar.ts server/__tests__/googleCalendarCredentials.test.ts
git commit -m "feat: add per-user Google credentials endpoints and fix OAuth redirect"
```

---

## Task 4: env.ts — validate TOKEN_ENCRYPTION_KEY and GOOGLE_REDIRECT_URI

**Files:**
- Modify: `server/env.ts`

- [ ] **Step 1: Add the two required vars to validateServerEnv**

Replace the contents of `server/env.ts`:
```ts
function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Create a .env file based on .env.example and restart the app.`,
    );
  }

  return value;
}

export function validateServerEnv(): void {
  requireEnv("MONGODB_URI");
  requireEnv("JWT_SECRET");
  requireEnv("TOKEN_ENCRYPTION_KEY");
  requireEnv("GOOGLE_REDIRECT_URI");
}

export function getJwtSecret(): string {
  return requireEnv("JWT_SECRET");
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/env.ts
git commit -m "feat: require TOKEN_ENCRYPTION_KEY and GOOGLE_REDIRECT_URI in server env"
```

---

## Task 5: GoogleCalendarSettings — add gcalStatus prop, remove query param logic

**Files:**
- Modify: `client/src/components/GoogleCalendarSettings.tsx`

- [ ] **Step 1: Replace the component**

Replace the entire contents of `client/src/components/GoogleCalendarSettings.tsx`:
```tsx
import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Unlink,
  AlertCircle,
  Info,
} from "lucide-react";
import api from "@/lib/api";

interface GCalStatus {
  connected: boolean;
  syncEnabled?: boolean;
  calendarId?: string;
  connectedAt?: string;
}

interface Props {
  gcalStatus?: "success" | "error" | null;
  gcalErrorReason?: string | null;
}

export function GoogleCalendarSettings({ gcalStatus, gcalErrorReason }: Props) {
  const [status, setStatus] = useState<GCalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const { data } = await api.get<GCalStatus>("/google-calendar/status");
      setStatus(data);
    } catch {
      setError("Error al obtener estado de Google Calendar");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ url: string }>("/google-calendar/auth-url");
      window.location.href = data.url;
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ?? "No se pudo iniciar la vinculación con Google";
      setError(msg);
      setActionLoading(false);
    }
  }

  async function handleToggleSync() {
    setActionLoading(true);
    setError(null);
    try {
      const { data } = await api.patch<{ syncEnabled: boolean }>(
        "/google-calendar/toggle-sync",
      );
      setStatus(prev => (prev ? { ...prev, syncEnabled: data.syncEnabled } : prev));
    } catch {
      setError("Error al cambiar el estado de sincronización");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    if (
      !confirm(
        "¿Desconectar Google Calendar? Las citas existentes no se eliminarán del calendario.",
      )
    )
      return;
    setActionLoading(true);
    setError(null);
    try {
      await api.delete("/google-calendar/disconnect");
      setStatus({ connected: false });
    } catch {
      setError("Error al desconectar");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando estado de Google Calendar…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Google Calendar</h3>
          <p className="text-xs text-muted-foreground">Sincroniza tus citas automáticamente</p>
        </div>
      </div>

      {/* OAuth result banner */}
      {gcalStatus === "success" && (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-emerald-600 dark:text-emerald-400 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Google Calendar vinculado correctamente.</span>
        </div>
      )}
      {gcalStatus === "error" && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            No se pudo vincular Google Calendar
            {gcalErrorReason ? `: ${gcalErrorReason}` : ""}
          </span>
        </div>
      )}

      {/* Internal error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {status?.connected ? (
        <>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Vinculado</span>
            {status.connectedAt && (
              <span className="text-muted-foreground">
                desde {new Date(status.connectedAt).toLocaleDateString("es-AR")}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Sincronización automática</p>
              <p className="text-xs text-muted-foreground">
                {status.syncEnabled
                  ? "Las citas se sincronizan al crearlas o modificarlas"
                  : "Pausada — las nuevas citas no se sincronizarán"}
              </p>
            </div>
            <button
              onClick={handleToggleSync}
              disabled={actionLoading}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                status.syncEnabled ? "bg-primary" : "bg-input"
              }`}
              role="switch"
              aria-checked={status.syncEnabled}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  status.syncEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={actionLoading}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            <Unlink className="h-4 w-4" />
            Desconectar Google Calendar
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" />
            <span>No vinculado</span>
          </div>

          <p className="text-sm text-muted-foreground">
            Conecta tu cuenta de Google para que cada cita que crees o modifiques se agregue
            automáticamente a tu Google Calendar.
          </p>

          <button
            onClick={handleConnect}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {actionLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Conectar con Google Calendar
          </button>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/GoogleCalendarSettings.tsx
git commit -m "feat: add gcalStatus prop to GoogleCalendarSettings, remove query-param logic"
```

---

## Task 6: Create ConfiguracionView

**Files:**
- Create: `client/src/components/ConfiguracionView.tsx`

- [ ] **Step 1: Create the component**

Create `client/src/components/ConfiguracionView.tsx`:
```tsx
import { useState, useEffect, type FormEvent } from "react";
import {
  Settings2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Save,
  ExternalLink,
} from "lucide-react";
import api from "@/lib/api";
import { GoogleCalendarSettings } from "@/components/GoogleCalendarSettings";

interface Props {
  gcalStatus?: "success" | "error" | null;
  gcalErrorReason?: string | null;
  onNavigateToManual: () => void;
}

export default function ConfiguracionView({
  gcalStatus,
  gcalErrorReason,
  onNavigateToManual,
}: Props) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [credentialsConfigured, setCredentialsConfigured] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    api
      .get<{ configured: boolean }>("/google-calendar/credentials")
      .then(r => setCredentialsConfigured(r.data.configured))
      .catch(() => {})
      .finally(() => setLoadingCredentials(false));
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.put("/google-calendar/credentials", { clientId, clientSecret });
      setCredentialsConfigured(true);
      setClientId("");
      setClientSecret("");
      setSaveMsg({ type: "success", text: "Credenciales guardadas correctamente" });
    } catch {
      setSaveMsg({ type: "error", text: "Error al guardar las credenciales" });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  return (
    <div className="p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Configuración</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Integraciones y ajustes del sistema
        </p>
      </div>

      {/* Card 1: Credentials */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Settings2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Credenciales de Google OAuth
            </h3>
            <p className="text-xs text-muted-foreground">
              Requeridas para conectar Google Calendar
            </p>
          </div>
        </div>

        {!loadingCredentials && credentialsConfigured && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Credenciales configuradas</span>
            <span className="text-muted-foreground">
              — podés actualizarlas ingresando nuevos valores
            </span>
          </div>
        )}

        {saveMsg && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              saveMsg.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {saveMsg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="123456789-abc.apps.googleusercontent.com"
              className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Client Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={clientSecret}
                onChange={e => setClientSecret(e.target.value)}
                placeholder="GOCSPX-…"
                className="w-full px-3.5 py-2.5 pr-10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background transition-shadow font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showSecret ? "Ocultar secreto" : "Mostrar secreto"}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !clientId.trim() || !clientSecret.trim()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Guardando…" : "Guardar credenciales"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground">
          ¿No sabés cómo obtener estas credenciales?{" "}
          <button
            type="button"
            onClick={onNavigateToManual}
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
          >
            Ver el Manual de integración
            <ExternalLink className="h-3 w-3" />
          </button>
        </p>
      </div>

      {/* Card 2: GCal connection */}
      {!loadingCredentials &&
        (credentialsConfigured ? (
          <GoogleCalendarSettings
            gcalStatus={gcalStatus}
            gcalErrorReason={gcalErrorReason}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Primero guardá tus credenciales de Google para poder conectar tu calendario.
            </p>
          </div>
        ))}
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ConfiguracionView.tsx
git commit -m "feat: add ConfiguracionView with credentials form and GCal connection"
```

---

## Task 7: Create ManualGCalView

**Files:**
- Create: `client/src/components/ManualGCalView.tsx`

- [ ] **Step 1: Create the component**

Create `client/src/components/ManualGCalView.tsx`:
```tsx
import type { ReactNode } from "react";
import { ExternalLink, CheckCircle2 } from "lucide-react";

interface Step {
  number: number;
  title: string;
  body: ReactNode;
}

const steps: Step[] = [
  {
    number: 1,
    title: "Crear un proyecto en Google Cloud Console",
    body: (
      <>
        <p>
          Ingresá a{" "}
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            console.cloud.google.com
            <ExternalLink className="h-3 w-3" />
          </a>{" "}
          y creá un proyecto nuevo (o usá uno existente).
        </p>
        <p className="mt-2">
          En la barra superior hacé clic en el selector de proyectos →{" "}
          <strong>Nuevo proyecto</strong> → ingresá un nombre (ej: "PsicoGestión") →{" "}
          <strong>Crear</strong>.
        </p>
      </>
    ),
  },
  {
    number: 2,
    title: "Habilitar la API de Google Calendar",
    body: (
      <>
        <p>
          En el menú lateral: <strong>APIs y Servicios</strong> →{" "}
          <strong>Biblioteca</strong>.
        </p>
        <p className="mt-2">
          Buscá <strong>Google Calendar API</strong> → hacé clic en el resultado →{" "}
          <strong>Habilitar</strong>.
        </p>
      </>
    ),
  },
  {
    number: 3,
    title: "Configurar la pantalla de consentimiento OAuth",
    body: (
      <>
        <p>
          En el menú lateral: <strong>APIs y Servicios</strong> →{" "}
          <strong>Pantalla de consentimiento OAuth</strong>.
        </p>
        <p className="mt-2">
          Seleccioná <strong>Externo</strong> → <strong>Crear</strong>. Completá el nombre
          de la app y tu email de soporte. En "Usuarios de prueba" agregá tu cuenta de Gmail.
          Guardá y continuá hasta completar todos los pasos.
        </p>
      </>
    ),
  },
  {
    number: 4,
    title: "Crear credenciales OAuth 2.0",
    body: (
      <>
        <p>
          En el menú lateral: <strong>APIs y Servicios</strong> →{" "}
          <strong>Credenciales</strong> → <strong>Crear credenciales</strong> →{" "}
          <strong>ID de cliente OAuth</strong>.
        </p>
        <p className="mt-2">
          Tipo de aplicación: <strong>Aplicación web</strong>.
        </p>
        <p className="mt-2">
          En <strong>URIs de redireccionamiento autorizados</strong>, agregá la URL que te
          indicó el administrador del sistema. Es la URL pública del servidor de PsicoGestión
          seguida de{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
            /api/google-calendar/callback
          </code>
          .
        </p>
        <p className="mt-2">
          Hacé clic en <strong>Crear</strong>.
        </p>
      </>
    ),
  },
  {
    number: 5,
    title: "Copiar las credenciales a PsicoGestión",
    body: (
      <>
        <p>
          Google te mostrará una ventana con el <strong>ID de cliente</strong> y el{" "}
          <strong>Secreto de cliente</strong>.
        </p>
        <p className="mt-2">
          Copiá ambos valores y pegálos en los campos correspondientes de{" "}
          <strong>Configuración → Credenciales de Google OAuth</strong> en esta aplicación.
        </p>
        <p className="mt-2">
          Hacé clic en <strong>Guardar credenciales</strong> y después en{" "}
          <strong>Conectar con Google Calendar</strong>.
        </p>
      </>
    ),
  },
];

export default function ManualGCalView() {
  return (
    <div className="p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Manual de integración
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cómo obtener tus credenciales de Google para sincronizar el calendario
        </p>
      </div>

      {/* Intro */}
      <div className="rounded-xl border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground space-y-2">
        <p>
          PsicoGestión se conecta a tu Google Calendar usando tu propio proyecto de Google
          Cloud. Esto significa que vos controlás completamente el acceso: podés revocar el
          permiso en cualquier momento desde tu cuenta de Google.
        </p>
        <p>
          El proceso toma aproximadamente <strong>5 minutos</strong> y solo necesitás hacerlo
          una vez.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map(step => (
          <div
            key={step.number}
            className="bg-card rounded-xl border border-border shadow-sm p-5"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold mt-0.5">
                {step.number}
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Done banner */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Una vez conectado, tus citas se sincronizarán automáticamente con Google Calendar
          cada vez que las crees o modifiques.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ManualGCalView.tsx
git commit -m "feat: add ManualGCalView with step-by-step Google Cloud setup guide"
```

---

## Task 8: Sidebar — add Configuración and Manual GCal nav items

**Files:**
- Modify: `client/src/components/Sidebar.tsx`

- [ ] **Step 1: Update imports**

In `client/src/components/Sidebar.tsx`, replace the lucide-react import line:
```tsx
import { Calendar, Users, CreditCard, BarChart3, Settings, LogOut, HeartPulse } from 'lucide-react';
```
With:
```tsx
import { Calendar, Users, CreditCard, BarChart3, Settings, Settings2, BookOpen, LogOut, HeartPulse } from 'lucide-react';
```

- [ ] **Step 2: Update menuItems**

Replace the `menuItems` array:
```tsx
const menuItems = [
  { id: 'dashboard', label: 'Tablero', icon: BarChart3 },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'pacientes', label: 'Pacientes', icon: Users },
  { id: 'pagos', label: 'Pagos', icon: CreditCard },
  { id: 'configuracion', label: 'Configuración', icon: Settings2 },
  { id: 'manual-gcal', label: 'Manual GCal', icon: BookOpen },
];
```

- [ ] **Step 3: Rename the Perfil footer button label**

Find and replace:
```tsx
<span className="text-sm font-medium">Perfil / Config.</span>
```
With:
```tsx
<span className="text-sm font-medium">Perfil</span>
```

- [ ] **Step 4: Run TypeScript check**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Sidebar.tsx
git commit -m "feat: add Configuración and Manual GCal items to sidebar"
```

---

## Task 9: Home.tsx — new view types + gcal query param handling on mount

**Files:**
- Modify: `client/src/pages/Home.tsx`

- [ ] **Step 1: Update React import to include useEffect**

In `client/src/pages/Home.tsx`, replace:
```tsx
import React, { useState } from 'react';
```
With:
```tsx
import React, { useState, useEffect } from 'react';
```

- [ ] **Step 2: Add imports for new views**

After the `ProfileView` import line, add:
```tsx
import ConfiguracionView from '@/components/ConfiguracionView';
import ManualGCalView from '@/components/ManualGCalView';
```

- [ ] **Step 3: Update ViewType**

Replace:
```tsx
type ViewType = 'dashboard' | 'agenda' | 'pacientes' | 'pagos' | 'perfil';
```
With:
```tsx
type ViewType = 'dashboard' | 'agenda' | 'pacientes' | 'pagos' | 'perfil' | 'configuracion' | 'manual-gcal';
```

- [ ] **Step 4: Update VIEW_TITLES**

Replace the `VIEW_TITLES` constant:
```tsx
const VIEW_TITLES: Record<ViewType, { title: string; subtitle: string }> = {
  dashboard: { title: 'Tablero', subtitle: 'Resumen del día' },
  agenda: { title: 'Agenda', subtitle: 'Citas y disponibilidad' },
  pacientes: { title: 'Pacientes', subtitle: 'Gestión de pacientes' },
  pagos: { title: 'Pagos', subtitle: 'Transacciones y deudas' },
  perfil: { title: 'Mi Perfil', subtitle: 'Configuración de cuenta' },
  configuracion: { title: 'Configuración', subtitle: 'Integraciones y ajustes' },
  'manual-gcal': { title: 'Manual GCal', subtitle: 'Cómo conectar Google Calendar' },
};
```

- [ ] **Step 5: Add gcalStatus state inside the Home component**

Inside the `Home` component body, after the `summaryStats` useState, add:
```tsx
const [gcalStatus, setGcalStatus] = useState<"success" | "error" | null>(null);
const [gcalErrorReason, setGcalErrorReason] = useState<string | null>(null);
```

- [ ] **Step 6: Add useEffects for query param handling and auto-clear**

After the state declarations, add:
```tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  const gcal = params.get("gcal") as "success" | "error" | null;
  const reason = params.get("reason");

  if (view === "configuracion") {
    setCurrentView("configuracion");
    if (gcal === "success" || gcal === "error") {
      setGcalStatus(gcal);
      setGcalErrorReason(reason);
    }
    window.history.replaceState({}, "", window.location.pathname);
  }
}, []);

useEffect(() => {
  if (!gcalStatus) return;
  const t = setTimeout(() => {
    setGcalStatus(null);
    setGcalErrorReason(null);
  }, 6000);
  return () => clearTimeout(t);
}, [gcalStatus]);
```

- [ ] **Step 7: Update renderView to include new views**

Replace the `renderView` function:
```tsx
const renderView = () => {
  switch (currentView) {
    case 'agenda': return <AgendaView />;
    case 'pacientes': return <PacientesView />;
    case 'pagos': return <PagosView />;
    case 'perfil': return <ProfileView />;
    case 'configuracion':
      return (
        <ConfiguracionView
          gcalStatus={gcalStatus}
          gcalErrorReason={gcalErrorReason}
          onNavigateToManual={() => setCurrentView('manual-gcal')}
        />
      );
    case 'manual-gcal': return <ManualGCalView />;
    default: return <DashboardView />;
  }
};
```

- [ ] **Step 8: Run TypeScript check**

```bash
pnpm run check
```

Expected: no errors.

- [ ] **Step 9: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 10: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat: add configuracion and manual-gcal views, handle gcal OAuth redirect on mount"
```
