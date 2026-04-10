# Inbound Google Calendar Sync (Bloqueos) — Design Spec

**Date:** 2026-04-10  
**Status:** Approved  
**Scope:** Cron-based inbound sync from GCal → PsicoGestión, renders personal events as "No disponible" blocks in AgendaView

---

## Overview

A Node cron job runs every 15 minutes and fetches events from each connected doctor's Google Calendar. Events that are not PsicoGestión-originated citas are stored as `Bloqueo` documents, which the AgendaView renders as non-clickable "No disponible" cells. Sync is incremental: each run uses `updatedMin` to fetch only events changed since the last sync.

---

## 1. Data Model

### New collection: `Bloqueo`

```ts
{
  doctorId:              ObjectId   // ref: User — required
  tenantId:             ObjectId   // ref: Tenant — required
  googleCalendarEventId: string    // GCal event ID — required
  fecha:                Date       // date of the block — required
  horaInicio:           string     // "HH:MM" — required
  horaFin:              string     // "HH:MM" — required
  updatedAt:            Date       // last time cron updated this document
}
```

**Indexes:**
- `{ doctorId: 1, googleCalendarEventId: 1 }` — unique, used for upsert
- `{ tenantId: 1, doctorId: 1, fecha: 1 }` — used for agenda queries

### Modified: `User.googleCalendar`

```ts
lastInboundSyncAt?: Date   // timestamp of last successful inbound sync (base for updatedMin)
```

---

## 2. Backend

### Files created or modified

| File | Action |
|------|--------|
| `server/models/Bloqueo.ts` | New Mongoose model |
| `server/services/inboundSyncService.ts` | Per-doctor sync logic |
| `server/jobs/inboundSyncCron.ts` | node-cron job, every 15 min |
| `server/routes/bloqueos.ts` | `GET /api/bloqueos` endpoint |
| `server/models/User.ts` | Add `lastInboundSyncAt` field |
| `server/index.ts` | Start cron on server boot |
| `shared/types.ts` | Add `BloqueoDTO` |

### `inboundSyncService.ts` — per-doctor logic

```
syncInboundForUser(user: IUser): Promise<void>
  1. getAuthenticatedClient(user) → if null, return
  2. calendar.events.list({
       timeMin: now (ISO),
       timeMax: now + 7 days (ISO),
       updatedMin: user.googleCalendar.lastInboundSyncAt (ISO) | undefined,
       singleEvents: true,
       maxResults: 250,
     })
  3. For each event in response.data.items:
     a. status === "cancelled"
        → Bloqueo.deleteOne({ doctorId: user._id, googleCalendarEventId: event.id })
     b. Cita.exists({ doctorId: user._id, googleCalendarEventId: event.id })
        → skip (own outbound event, avoid circular sync)
     c. otherwise:
        → parse start/end (handle dateTime and all-day date)
        → Bloqueo.findOneAndUpdate(
             { doctorId: user._id, googleCalendarEventId: event.id },
             { tenantId, fecha, horaInicio, horaFin, updatedAt: now },
             { upsert: true }
           )
  4. User.findByIdAndUpdate(user._id, {
       "googleCalendar.lastInboundSyncAt": now
     })
```

**Error handling:**
- 401 from Google → set `syncEnabled = false`, log warning, return
- Network error / timeout → log error, return (next cycle retries)
- 429 rate limit → log warning, return (next cycle retries)

**All-day events:** If `event.start.date` exists (no `dateTime`), treat as `horaInicio: "00:00"`, `horaFin: "23:59"`.

### `inboundSyncCron.ts`

```ts
// Runs every 15 minutes
cron.schedule("*/15 * * * *", async () => {
  const users = await User.find({ "googleCalendar.syncEnabled": true });
  for (const user of users) {
    await syncInboundForUser(user);
  }
});
```

Sequential iteration (not parallel) to avoid Google API rate limits.

### `GET /api/bloqueos`

- Auth: requires `authenticate` middleware
- Query params: `desde` (YYYY-MM-DD), `hasta` (YYYY-MM-DD)
- Filters by `tenantId` of the authenticated user + date range
- Returns `BloqueoDTO[]`

---

## 3. Frontend

### `shared/types.ts` addition

```ts
export interface BloqueoDTO {
  _id: string;
  doctorId: string;
  fecha: string;       // ISO date string
  horaInicio: string;  // "HH:MM"
  horaFin: string;     // "HH:MM"
}
```

### `AgendaView.tsx` changes

1. New state: `const [bloqueos, setBloqueos] = useState<BloqueoDTO[]>([])`
2. In `loadData()`, fetch bloqueos in parallel with citas:
   ```ts
   const [citasData, bloqueosData] = await Promise.all([
     fetchCitasRange(desde, hasta),
     api.get<BloqueoDTO[]>("/bloqueos", { params: { desde, hasta } }).then(r => r.data),
   ]);
   setCitas(citasData);
   setBloqueos(bloqueosData);
   ```
3. Helper function:
   ```ts
   const isBlocked = (d: Date, doctorId: string, time: string): boolean =>
     bloqueos.some(b =>
       b.fecha.slice(0, 10) === toDateStr(d) &&
       b.doctorId === doctorId &&
       b.horaInicio <= time &&
       b.horaFin > time
     );
   ```
4. In the week/day grid cell render: if `isBlocked()` is true and no cita exists for that slot, render a non-clickable block cell:
   - Tailwind classes: `bg-slate-100 border border-slate-200 rounded text-slate-400 text-xs cursor-not-allowed select-none`
   - Content: "No disponible"
5. In month view: if a day has bloqueos, render a small gray badge "Bloqueado" alongside cita chips.

---

## 4. Sync Flow Summary

```
Every 15 minutes (node-cron):
  → Find all User where googleCalendar.syncEnabled = true
  → For each doctor (sequential):
      → Build authenticated GCal client
      → Fetch events: timeMin=now, timeMax=now+7d, updatedMin=lastInboundSyncAt
      → For each event:
          cancelled       → delete Bloqueo by googleCalendarEventId
          own cita        → skip
          new/updated     → upsert Bloqueo
      → Update lastInboundSyncAt = now
      → On 401: set syncEnabled = false
      → On other error: log, skip, continue
```

---

## 5. Security Considerations

- The `GET /api/bloqueos` endpoint filters by `tenantId` — doctors cannot see bloqueos of other tenants.
- Event titles from Google Calendar are **not stored** — only fecha, horaInicio, horaFin.
- The cron uses the same encrypted credential/token pipeline as outbound sync.

---

## 6. Out of Scope

- Syncing bloqueos beyond 7 days.
- Manual trigger for inbound sync from the UI.
- Showing the GCal event title in the block cell.
- Two-way conflict detection (e.g., blocking a slot that already has a cita).
- Configurable sync frequency per doctor.
