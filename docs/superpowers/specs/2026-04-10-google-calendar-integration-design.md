# Google Calendar Integration — Design Spec

**Date:** 2026-04-10  
**Status:** Approved  
**Scope:** Per-user OAuth2 credentials + in-app manual

---

## Overview

Each psychologist configures their own Google Cloud OAuth2 credentials (Client ID + Client Secret) through the app UI. The credentials are stored encrypted in the database. Once configured, the user authorizes the app via Google's OAuth2 consent flow, and appointments (citas) are automatically synced to their Google Calendar.

---

## 1. Data Model

### `User.googleCalendar` subdocument additions

```ts
googleClientId: String      // AES-256 encrypted
googleClientSecret: String  // AES-256 encrypted
```

These join the existing fields: `accessToken`, `refreshToken`, `calendarId`, `syncEnabled`, `connectedAt`.

---

## 2. Backend Changes

### New API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `PUT` | `/api/google-calendar/credentials` | Save user's Client ID + Client Secret (encrypted). Requires auth. |
| `GET` | `/api/google-calendar/credentials` | Returns `{ configured: boolean }` — never exposes the values. |

### Modified: `googleCalendarService.ts`

- `createOAuth2Client(user: IUser)` — uses the user's decrypted `googleClientId` and `googleClientSecret` instead of env vars.
- `getAuthUrl(state, user: IUser)` — creates the OAuth2 client with user credentials before generating the auth URL.
- All other functions that call `createOAuth2Client()` are updated to pass the user object.

### Modified: `server/routes/googleCalendar.ts`

- `GET /auth-url` — loads the full user (including credentials), passes to `getAuthUrl`. Returns `400` if no credentials are configured yet.
- `GET /callback` — loads user by `userId` from state, uses their credentials to exchange the authorization code for tokens.
- `GET /status` — unchanged.
- `PATCH /toggle-sync` — unchanged.
- `DELETE /disconnect` — unchanged.

### Modified: `server/env.ts`

- Remove `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from required env vars (now per-user).
- `GOOGLE_REDIRECT_URI` remains a server-level env var (shared callback URL, same for all users).

---

## 3. Frontend Changes

### Sidebar (`Sidebar.tsx`)

- Rename current "Perfil / Config." item to "Perfil".
- Add new item **"Configuración"** (icon: `Settings2`) between "Pagos" and "Perfil".
- Add new item **"Manual GCal"** (icon: `BookOpen`) below "Configuración".

### `Home.tsx`

- Add `configuracion` and `manual-gcal` to `ViewType`.
- Add to `VIEW_TITLES` map.
- Add to `renderView()` switch.
- On mount, read `?view=configuracion&gcal=success|error` query params:
  - If present, navigate to the `configuracion` view.
  - Pass the `gcal` status to `ConfiguracionView` so it shows the success/error banner.
  - Clear the query params from the URL with `history.replaceState`.

### New: `ConfiguracionView.tsx`

Two cards stacked vertically:

**Card 1 — Google OAuth Credentials**
- Input: Client ID (text)
- Input: Client Secret (password with show/hide toggle)
- Button: "Guardar credenciales" → `PUT /api/google-calendar/credentials`
- State indicator: "Configuradas ✓" (green) if already set, "No configuradas" (muted) otherwise
- Hint link: "Cómo obtener tus credenciales →" navigates to `manual-gcal` view

**Card 2 — Google Calendar Connection**
- Renders `<GoogleCalendarSettings />` if credentials are configured.
- Renders a disabled state card ("Primero configurá tus credenciales de Google") if not.
- Receives `gcalStatus` prop (`'success' | 'error' | null`) from `Home.tsx` to display the OAuth result banner.

### New: `ManualGCalView.tsx`

A dedicated read-only view with step-by-step instructions:

1. **Crear un proyecto en Google Cloud Console**  
   Link: `https://console.cloud.google.com/`

2. **Habilitar la API de Google Calendar**  
   Menú: APIs y Servicios → Biblioteca → buscar "Google Calendar API" → Habilitar

3. **Crear credenciales OAuth 2.0**  
   Menú: APIs y Servicios → Credenciales → Crear credenciales → ID de cliente OAuth  
   Tipo de aplicación: **Aplicación web**

4. **Agregar la URI de redirección autorizada**  
   En "URIs de redireccionamiento autorizados" agregar:  
   `{GOOGLE_REDIRECT_URI}` (el administrador del sistema provee esta URL)

5. **Copiar las credenciales a la app**  
   Copiar "ID de cliente" → campo Client ID en Configuración  
   Copiar "Secreto de cliente" → campo Client Secret en Configuración

Style: uses the existing card/border/muted-foreground design tokens. Steps are numbered with a visual indicator (circle + number). No external images.

### Modified: `GoogleCalendarSettings.tsx`

- Remove the `useEffect` that reads `?gcal=` from `window.location.search` (this logic moves to `Home.tsx`).
- Accept an optional prop `gcalStatus?: 'success' | 'error' | null` to display the result banner (replacing the self-managed query param logic).

---

## 4. OAuth Redirect Flow

```
User clicks "Conectar con Google Calendar"
  → GET /api/google-calendar/auth-url
    → Server loads user credentials from DB
    → If no credentials: returns 400 → frontend shows error
    → Creates OAuth2 client with user's Client ID + Secret
    → Returns { url: "https://accounts.google.com/o/oauth2/auth?..." }
  → Browser redirects to Google consent screen
  → User authorizes
  → Google redirects to: GET /api/google-calendar/callback?code=...&state=...
    → Server decodes state → gets userId
    → Loads user + their credentials from DB
    → Exchanges code for tokens
    → Saves tokens encrypted to user.googleCalendar
    → Redirects to: /?view=configuracion&gcal=success
  → Home.tsx reads query params → navigates to configuracion → shows banner
```

---

## 5. Security Considerations

- `googleClientId` and `googleClientSecret` are encrypted with AES-256-CBC (same mechanism as existing tokens) before storage.
- The `GET /credentials` endpoint never returns the credential values — only `{ configured: boolean }`.
- The `PUT /credentials` endpoint requires authentication via the existing `authenticate` middleware.
- The OAuth state parameter carries `userId` encoded as base64url (not encrypted, but not sensitive — it's only used server-side to look up the user's own credentials).

---

## 6. Environment Variables

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `GOOGLE_REDIRECT_URI` | Server | Yes | Callback URL registered in each user's Google Cloud project |
| `TOKEN_ENCRYPTION_KEY` | Server | Yes | AES-256 key for encrypting OAuth tokens and credentials |
| `GOOGLE_CLIENT_ID` | Server | No (removed) | Was global; now per-user in DB |
| `GOOGLE_CLIENT_SECRET` | Server | No (removed) | Was global; now per-user in DB |

---

## 7. Out of Scope

- Bulk sync of existing appointments to Google Calendar (only new/updated citas sync going forward).
- Selecting a specific calendar (always uses `primary`).
- Import from Google Calendar into PsicoGestión.
- Admin-level credential management (each user manages their own).
