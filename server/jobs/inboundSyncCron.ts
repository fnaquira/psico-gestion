import cron from "node-cron";
import { User } from "../models/User";
import { syncInboundForUser } from "../services/inboundSyncService";

export function startInboundSyncCron(): void {
  // Runs every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      const users = await User.find({ "googleCalendar.syncEnabled": true });
      for (const user of users) {
        try {
          await syncInboundForUser(user);
        } catch (err) {
          console.error("[InboundSyncCron] Error usuario", user._id, err);
        }
      }
    } catch (err) {
      console.error("[InboundSyncCron] Error al obtener usuarios:", err);
    }
  });

  console.log("[InboundSyncCron] Cron de sync entrante iniciado (cada 15 min)");
}
