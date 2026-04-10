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
    res.redirect(`/?view=configuracion&gcal=error&reason=${encodeURIComponent(error as string)}`);
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
