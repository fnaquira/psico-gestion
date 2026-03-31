import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import { connectDB } from "./db.js";
import { authenticate } from "./middleware/auth.js";

import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import pacientesRoutes from "./routes/pacientes.js";
import tutoresRoutes from "./routes/tutores.js";
import citasRoutes from "./routes/citas.js";
import pagosRoutes from "./routes/pagos.js";
import doctoresRoutes from "./routes/doctores.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await connectDB();

  const app = express();
  const server = createServer(app);

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

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, env: process.env.NODE_ENV });
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // SPA fallback — must be AFTER all API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
