import { google } from "googleapis";
import { IUser, User } from "../models/User";
import { Bloqueo } from "../models/Bloqueo";
import { Cita } from "../models/Cita";
import { getAuthenticatedClient } from "./googleCalendarService";

// ─── Parse GCal event times → fecha / horaInicio / horaFin ─────────────────

const DEFAULT_TIMEZONE = "America/Santiago";

function parseEventTimes(ev: {
  start?: { dateTime?: string | null; date?: string | null; timeZone?: string | null };
  end?: { dateTime?: string | null; date?: string | null };
}): { fecha: Date; horaInicio: string; horaFin: string } | null {
  if (!ev.start || !ev.end) return null;

  // All-day event
  if (ev.start.date && !ev.start.dateTime) {
    const fecha = new Date(`${ev.start.date}T00:00:00`);
    return { fecha, horaInicio: "00:00", horaFin: "23:59" };
  }

  if (!ev.start.dateTime || !ev.end.dateTime) return null;

  const timezone = ev.start.timeZone ?? DEFAULT_TIMEZONE;

  const startLocal = new Date(ev.start.dateTime).toLocaleString("sv-SE", {
    timeZone: timezone,
    hour12: false,
  });
  const endLocal = new Date(ev.end.dateTime).toLocaleString("sv-SE", {
    timeZone: timezone,
    hour12: false,
  });

  // startLocal: "YYYY-MM-DD HH:MM:SS"
  const [datePart, startTimePart] = startLocal.split(" ");
  const [, endTimePart] = endLocal.split(" ");

  const fecha = new Date(`${datePart}T00:00:00`);
  const horaInicio = startTimePart.slice(0, 5); // "HH:MM"
  const horaFin = endTimePart.slice(0, 5);      // "HH:MM"

  return { fecha, horaInicio, horaFin };
}

// ─── Sync entrante para un doctor ────────────────────────────────────────────

export async function syncInboundForUser(user: IUser): Promise<void> {
  const auth = await getAuthenticatedClient(user);
  if (!auth) return;

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const listParams: Record<string, string | boolean | number> = {
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: sevenDaysLater.toISOString(),
    singleEvents: true,
    maxResults: 250,
  };

  if (user.googleCalendar?.lastInboundSyncAt) {
    listParams.updatedMin = user.googleCalendar.lastInboundSyncAt.toISOString();
  }

  const calendar = google.calendar({ version: "v3", auth });

  try {
    const res = await calendar.events.list(listParams);
    const items = res.data.items ?? [];

    for (const ev of items) {
      if (!ev.id) continue;

      // Evento eliminado en GCal → borrar bloqueo
      if (ev.status === "cancelled") {
        await Bloqueo.deleteOne({ doctorId: user._id, googleCalendarEventId: ev.id });
        continue;
      }

      // Evento creado por el sync saliente (cita propia) → skip para evitar ciclo
      const esCitaPropia = await Cita.exists({ googleCalendarEventId: ev.id });
      if (esCitaPropia) continue;

      const times = parseEventTimes(ev);
      if (!times) continue;

      await Bloqueo.findOneAndUpdate(
        { doctorId: user._id, googleCalendarEventId: ev.id },
        {
          tenantId: user.tenantId,
          fecha: times.fecha,
          horaInicio: times.horaInicio,
          horaFin: times.horaFin,
          updatedAt: now,
        },
        { upsert: true },
      );
    }

    await User.findByIdAndUpdate(user._id, {
      "googleCalendar.lastInboundSyncAt": now,
    });
  } catch (err: unknown) {
    const status = (err as { status?: number; code?: number })?.status
      ?? (err as { status?: number; code?: number })?.code;

    if (status === 401) {
      console.warn("[GCal inbound] Token inválido para doctor", user._id, "— desactivando sync");
      await User.findByIdAndUpdate(user._id, { "googleCalendar.syncEnabled": false });
      return;
    }

    console.error("[GCal inbound] Error sincronizando doctor", user._id, err);
  }
}
