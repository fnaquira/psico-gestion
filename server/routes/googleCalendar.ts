import { Router } from "express";
import jwt from "jsonwebtoken";
import { authenticate } from "../middleware/auth";
import { User } from "../models/User";
import { Tenant } from "../models/Tenant";
import {
  getAuthUrl,
  createOAuth2Client,
  saveTokens,
  disconnectCalendar,
  getDecryptedCredentials,
} from "../services/googleCalendarService";

const router = Router();

// GET /api/google-calendar/status
// Devuelve si el doctor actual tiene GCal vinculado
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

// GET /api/google-calendar/auth-url
// Genera URL de consentimiento OAuth de Google
router.get("/auth-url", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user!.userId).select("googleCalendar");
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    const creds = getDecryptedCredentials(user);
    if (!creds) {
      res.status(400).json({ error: "Credenciales de Google no configuradas" });
      return;
    }

    // El state incluye el JWT del usuario para identificarlo en el callback
    const state = Buffer.from(
      JSON.stringify({ userId: req.user!.userId, tenantId: req.user!.tenantId }),
    ).toString("base64url");

    const url = getAuthUrl(state, creds.clientId, creds.clientSecret);
    res.json({ url });
  } catch {
    res.status(500).json({ error: "Error al generar URL de autenticación" });
  }
});

// GET /api/google-calendar/callback
// Recibe el código de autorización de Google y guarda los tokens
router.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    res.redirect(`/configuracion?gcal=error&reason=${error}`);
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
    const creds = user ? getDecryptedCredentials(user) : null;
    if (!creds) {
      res.redirect("/configuracion?gcal=error&reason=no_credentials");
      return;
    }

    const oauth2Client = createOAuth2Client(creds.clientId, creds.clientSecret);
    const { tokens } = await oauth2Client.getToken(code as string);

    if (!tokens.access_token || !tokens.refresh_token) {
      res.redirect("/configuracion?gcal=error&reason=no_tokens");
      return;
    }

    await saveTokens(userId, tokens.access_token, tokens.refresh_token);
    res.redirect("/configuracion?gcal=success");
  } catch (err) {
    console.error("[GCal] Error en callback:", err);
    res.redirect("/configuracion?gcal=error&reason=server");
  }
});

// PATCH /api/google-calendar/toggle-sync
// Activa o desactiva la sincronización sin desconectar
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
// Revoca y elimina la vinculación
router.delete("/disconnect", authenticate, async (req, res) => {
  try {
    await disconnectCalendar(req.user!.userId);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error al desconectar" });
  }
});

export default router;
