# Doctor Timezone — Design Spec

**Date:** 2026-04-10  
**Status:** Approved

## Overview

Add a per-doctor `timezone` field to the `User` model. The timezone defaults to the browser's detected timezone at registration and can always be changed from the doctor's profile. The Google Calendar sync uses the doctor's timezone instead of the tenant's timezone (with fallback).

## Goals

- Each doctor stores their own IANA timezone string.
- Registration form pre-fills with browser timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`), editable before submitting.
- ProfileView connects to the backend (replaces localStorage) and includes a timezone selector.
- Google Calendar sync picks `doctor.timezone` first, falls back to `tenant.settings.timezone`.

## Non-Goals

- Tenant-level timezone is not removed — it remains as fallback.
- No timezone conversion on appointment display (out of scope).
- No multi-doctor admin management screen.

---

## Backend

### 1. `server/models/User.ts`

Add field:

```ts
timezone: { type: String, default: "America/Lima" }
```

Update `IUser` interface:

```ts
timezone: string;
```

### 2. `shared/types.ts`

Add to `UserDTO`:

```ts
timezone: string;
```

### 3. `POST /api/auth/register`

- Zod schema: add `timezone: z.string().optional()`
- Pass `timezone` to `User.create(...)` (Mongoose uses default if omitted)
- Include `timezone` in the response `user` object

### 4. `PATCH /api/auth/me` (new endpoint in `server/routes/auth.ts`)

- Protected by `authenticate` middleware (any authenticated user)
- Zod schema: `nombre?, email?, especialidad?, timezone?` — all optional
- Updates the calling user's own document
- Returns updated user (without `passwordHash`)
- Returns 409 if `email` already belongs to another user in the same tenant

### 5. `GET /api/auth/me`

- Include `timezone` in the response alongside existing fields

### 6. Calendar sync (`server/routes/citas.ts`)

Replace the current pattern:

```ts
const timezone = tenant?.settings?.timezone ?? "America/Lima";
```

With:

```ts
const doctor = await User.findById(cita.doctorId).select("timezone").lean();
const timezone = doctor?.timezone ?? tenant?.settings?.timezone ?? "America/Lima";
```

Apply this change in all three places in `citas.ts` (POST, PUT, DELETE handlers).

### 7. Default updates

- `server/models/Tenant.ts`: change default from `"America/Argentina/Buenos_Aires"` to `"America/Lima"`
- `server/seed.ts`: update seed timezone to `"America/Lima"`

---

## Frontend

### 8. `client/src/lib/timezones.ts` (new file)

Array of `{ value: string; label: string }` entries for IANA timezone strings. Grouped by region (América, Europa, Asia/Pacífico, África). No external dependencies. Covers full IANA list with readable labels.

### 9. `client/src/pages/RegisterPage.tsx`

- Add `timezone` to form state, initialized as:
  ```ts
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  ```
- Add a **Zona Horaria** field (after Especialidad, before Contraseña) using a `<select>` populated from `timezones.ts`
- Send `timezone` in the register API call

### 10. `client/src/contexts/AuthContext.tsx`

- Ensure `timezone` is included in the `UserDTO` consumed from login/register/me responses
- Add `updateUser(partial: Partial<UserDTO>): void` function that merges changes into the auth state (for ProfileView to call after a successful PATCH)

### 11. `client/src/components/ProfileView.tsx`

- Remove all localStorage logic
- Initialize form state from `AuthContext` user (nombre, email, especialidad, timezone)
- On submit: call `PATCH /api/auth/me` with form data
- On success: call `updateUser(...)` from AuthContext to keep app state in sync
- Add a **Zona Horaria** card section with the same `<select>` from `timezones.ts`
- Keep the avatar/logo card as-is (it's not user data, just UI state — localStorage is fine for logo)

---

## Tests

### `server/__tests__/auth.test.ts`

- Register tests: `timezone` is optional, no breaking changes
- Add one test: register with explicit timezone, verify it's returned in the response
- Add tests for `PATCH /api/auth/me`: update nombre, update timezone, reject duplicate email

### `server/__tests__/citas.test.ts`

- Update doctor mocks to include `timezone: "America/Lima"`
- Verify sync uses doctor timezone, not tenant timezone

---

## Data Migration

None required. Mongoose applies the `"America/Lima"` default when reading existing `User` documents that lack the field.

---

## Fallback Chain

```
doctor.timezone
  ?? tenant.settings.timezone
  ?? "America/Lima"
```
