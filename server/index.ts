import "dotenv/config";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";

import { connectDB } from "./db.js";
import { createApp } from "./app.js";
import { validateServerEnv } from "./env.js";
import { startInboundSyncCron } from "./jobs/inboundSyncCron.js";
import { SuperAdmin } from "./models/SuperAdmin.js";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureSuperAdmin(): Promise<void> {
  const email = (process.env.SUPERADMIN_EMAIL ?? "admin@psicogestion.com").toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD ?? "Admin1234!";

  const existing = await SuperAdmin.findOne({ email });
  if (existing) return; // already seeded — never overwrite password

  const passwordHash = await bcrypt.hash(password, 12);
  await SuperAdmin.create({ nombre: "Super Admin", email, passwordHash });
  console.log(`✓ SuperAdmin creado: ${email}`);
}

async function startServer() {
  validateServerEnv();
  await connectDB();
  await ensureSuperAdmin();

  const app = createApp();
  const server = createServer(app);

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

  // Start inbound GCal sync cron (every 15 min)
  if (process.env.ENABLE_INBOUND_SYNC !== "false") {
    startInboundSyncCron();
  }

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
