import { google } from "googleapis";
import crypto from "crypto";
import { User, IUser } from "../models/User";
import { Cita, ICita } from "../models/Cita";

// ─── Cifrado / Descifrado ────────────────────────────────────────────────────

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY ?? "";
const IV_LENGTH = 16;

function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) throw new Error("TOKEN_ENCRYPTION_KEY no definida");
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) throw new Error("TOKEN_ENCRYPTION_KEY no definida");
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const [ivHex, encryptedHex] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedBuffer = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted.toString("utf8");
}

// ─── OAuth2 Client ───────────────────────────────────────────────────────────

export function createOAuth2Client(clientId: string, clientSecret: string) {
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getAuthUrl(state: string, clientId: string, clientSecret: string): string {
  const oauth2Client = createOAuth2Client(clientId, clientSecret);
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state,
  });
}

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

// ─── Guardar / Leer tokens ───────────────────────────────────────────────────

export async function saveTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    "googleCalendar.accessToken": encrypt(accessToken),
    "googleCalendar.refreshToken": encrypt(refreshToken),
    "googleCalendar.calendarId": "primary",
    "googleCalendar.syncEnabled": true,
    "googleCalendar.connectedAt": new Date(),
  });
}

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

// ─── Obtener cliente autenticado para un doctor ──────────────────────────────

async function getAuthenticatedClient(user: IUser) {
  if (
    !user.googleCalendar?.accessToken ||
    !user.googleCalendar?.refreshToken ||
    !user.googleCalendar?.googleClientId ||
    !user.googleCalendar?.googleClientSecret
  ) {
    return null;
  }

  const creds = getDecryptedCredentials(user);
  if (!creds) return null;

  const oauth2Client = createOAuth2Client(creds.clientId, creds.clientSecret);

  const accessToken = decrypt(user.googleCalendar.accessToken);
  const refreshToken = decrypt(user.googleCalendar.refreshToken);

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

// ─── Formatear fecha/hora para Google Calendar (RFC3339) ────────────────────

function buildDateTime(fecha: Date, hora: string, timezone: string): string {
  const fechaStr = fecha.toISOString().split("T")[0]; // YYYY-MM-DD
  return new Date(`${fechaStr}T${hora}:00`).toLocaleString("sv-SE", {
    timeZone: timezone,
    hour12: false,
  }).replace(" ", "T") + getTimezoneOffset(timezone);
}

function getTimezoneOffset(timezone: string): string {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const offsetMinutes = (tzDate.getTime() - utcDate.getTime()) / 60000;
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = String(Math.floor(abs / 60)).padStart(2, "0");
  const mins = String(abs % 60).padStart(2, "0");
  return `${sign}${hours}:${mins}`;
}

const TIPO_SESION_LABELS: Record<string, string> = {
  inicial: "Sesión inicial",
  seguimiento: "Sesión de seguimiento",
  evaluacion: "Evaluación",
  otra: "Sesión",
};

// ─── Operaciones CRUD en Google Calendar ────────────────────────────────────

export async function createCalendarEvent(
  doctor: IUser,
  cita: ICita,
  pacienteNombre: string,
  timezone: string,
): Promise<string | null> {
  if (!doctor.googleCalendar?.syncEnabled) return null;

  const auth = await getAuthenticatedClient(doctor);
  if (!auth) return null;

  const calendar = google.calendar({ version: "v3", auth });
  const tipoLabel = TIPO_SESION_LABELS[cita.tipoSesion] ?? "Sesión";

  try {
    const response = await calendar.events.insert({
      calendarId: doctor.googleCalendar.calendarId ?? "primary",
      requestBody: {
        summary: `${tipoLabel} — ${pacienteNombre}`,
        description: cita.notas ? `Notas: ${cita.notas}` : undefined,
        start: {
          dateTime: buildDateTime(cita.fecha, cita.horaInicio, timezone),
          timeZone: timezone,
        },
        end: {
          dateTime: buildDateTime(cita.fecha, cita.horaFin, timezone),
          timeZone: timezone,
        },
        status: "confirmed",
      },
    });

    return response.data.id ?? null;
  } catch (err) {
    console.error("[GCal] Error al crear evento:", err);
    return null;
  }
}

export async function updateCalendarEvent(
  doctor: IUser,
  cita: ICita,
  pacienteNombre: string,
  timezone: string,
): Promise<boolean> {
  if (!doctor.googleCalendar?.syncEnabled || !cita.googleCalendarEventId) return false;

  const auth = await getAuthenticatedClient(doctor);
  if (!auth) return false;

  const calendar = google.calendar({ version: "v3", auth });
  const tipoLabel = TIPO_SESION_LABELS[cita.tipoSesion] ?? "Sesión";

  try {
    await calendar.events.update({
      calendarId: doctor.googleCalendar.calendarId ?? "primary",
      eventId: cita.googleCalendarEventId,
      requestBody: {
        summary: `${tipoLabel} — ${pacienteNombre}`,
        description: cita.notas ? `Notas: ${cita.notas}` : undefined,
        start: {
          dateTime: buildDateTime(cita.fecha, cita.horaInicio, timezone),
          timeZone: timezone,
        },
        end: {
          dateTime: buildDateTime(cita.fecha, cita.horaFin, timezone),
          timeZone: timezone,
        },
        status: cita.estado === "cancelada" ? "cancelled" : "confirmed",
      },
    });
    return true;
  } catch (err) {
    console.error("[GCal] Error al actualizar evento:", err);
    return false;
  }
}

export async function deleteCalendarEvent(
  doctor: IUser,
  googleCalendarEventId: string,
): Promise<boolean> {
  if (!doctor.googleCalendar?.syncEnabled) return false;

  const auth = await getAuthenticatedClient(doctor);
  if (!auth) return false;

  const calendar = google.calendar({ version: "v3", auth });

  try {
    await calendar.events.delete({
      calendarId: doctor.googleCalendar.calendarId ?? "primary",
      eventId: googleCalendarEventId,
    });
    return true;
  } catch (err) {
    console.error("[GCal] Error al eliminar evento:", err);
    return false;
  }
}

// ─── Helper de sync usado desde rutas de citas ──────────────────────────────

export async function syncCitaToCalendar(
  cita: ICita,
  pacienteNombre: string,
  timezone: string,
): Promise<void> {
  const doctor = await User.findById(cita.doctorId);
  if (!doctor?.googleCalendar?.syncEnabled) {
    await Cita.findByIdAndUpdate(cita._id, { googleSyncStatus: "skipped" });
    return;
  }

  const isUpdate = !!cita.googleCalendarEventId;

  if (isUpdate) {
    const ok = await updateCalendarEvent(doctor, cita, pacienteNombre, timezone);
    await Cita.findByIdAndUpdate(cita._id, {
      googleSyncStatus: ok ? "synced" : "error",
    });
  } else {
    const eventId = await createCalendarEvent(doctor, cita, pacienteNombre, timezone);
    await Cita.findByIdAndUpdate(cita._id, {
      googleCalendarEventId: eventId ?? undefined,
      googleSyncStatus: eventId ? "synced" : "error",
    });
  }
}
