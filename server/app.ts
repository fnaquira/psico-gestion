import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";

import { getDBHealth } from "./db.js";
import { authenticate } from "./middleware/auth.js";

import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import pacientesRoutes from "./routes/pacientes.js";
import tutoresRoutes from "./routes/tutores.js";
import citasRoutes from "./routes/citas.js";
import pagosRoutes from "./routes/pagos.js";
import doctoresRoutes from "./routes/doctores.js";
import googleCalendarRoutes from "./routes/googleCalendar.js";

export function createApp() {
  const app = express();

  // Trust the first reverse proxy hop (Nginx) so req.ip and rate limiting
  // work correctly when X-Forwarded-For is present.
  app.set("trust proxy", 1);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // disabled to allow Vite HMR in dev
    }),
  );
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? "*",
      credentials: true,
    }),
  );

  app.get("/api/health", async (_req, res) => {
    try {
      const db = await getDBHealth();

      res.json({
        ok: true,
        env: process.env.NODE_ENV,
        db,
      });
    } catch {
      res.status(503).json({
        ok: false,
        env: process.env.NODE_ENV,
        db: {
          ok: false,
          readyState: 0,
        },
      });
    }
  });

  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  // Rate limiting
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 min
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", authenticate, dashboardRoutes);
  app.use("/api/pacientes", authenticate, pacientesRoutes);
  app.use("/api/tutores", authenticate, tutoresRoutes);
  app.use("/api/citas", authenticate, citasRoutes);
  app.use("/api/pagos", authenticate, pagosRoutes);
  app.use("/api/doctores", authenticate, doctoresRoutes);
  app.use("/api/google-calendar", googleCalendarRoutes);

  return app;
}
