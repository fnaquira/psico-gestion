import { describe, it, expect } from "vitest";
import { request, createTestUser } from "./helpers.js";
import { Bloqueo } from "../models/Bloqueo.js";

describe("GET /api/bloqueos", () => {
  it("returns 401 without authentication token", async () => {
    const res = await request.get("/api/bloqueos?desde=2026-04-10&hasta=2026-04-17");
    expect(res.status).toBe(401);
  });

  it("returns 400 when desde/hasta params are missing", async () => {
    const { token } = await createTestUser();
    const res = await request
      .get("/api/bloqueos")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("returns bloqueos within the date range for the same tenant", async () => {
    const { token, tenant, user } = await createTestUser();

    await Bloqueo.create({
      doctorId: user._id,
      tenantId: tenant._id,
      googleCalendarEventId: "evt-in-range",
      fecha: new Date("2026-04-12"),
      horaInicio: "10:00",
      horaFin: "11:00",
    });
    // Outside range
    await Bloqueo.create({
      doctorId: user._id,
      tenantId: tenant._id,
      googleCalendarEventId: "evt-out-of-range",
      fecha: new Date("2026-04-20"),
      horaInicio: "10:00",
      horaFin: "11:00",
    });

    const res = await request
      .get("/api/bloqueos?desde=2026-04-10&hasta=2026-04-17")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].googleCalendarEventId).toBeUndefined(); // not exposed
    expect(res.body[0].horaInicio).toBe("10:00");
  });

  it("does not return bloqueos from a different tenant", async () => {
    const { token, user } = await createTestUser();
    const { tenant: otherTenant, user: otherUser } = await createTestUser();

    await Bloqueo.create({
      doctorId: otherUser._id,
      tenantId: otherTenant._id,
      googleCalendarEventId: "evt-other-tenant",
      fecha: new Date("2026-04-12"),
      horaInicio: "10:00",
      horaFin: "11:00",
    });
    // One for the requesting user
    await Bloqueo.create({
      doctorId: user._id,
      tenantId: (await import("../models/User.js").then(m => m.User.findById(user._id)))!.tenantId,
      googleCalendarEventId: "evt-my-tenant",
      fecha: new Date("2026-04-12"),
      horaInicio: "14:00",
      horaFin: "15:00",
    });

    const res = await request
      .get("/api/bloqueos?desde=2026-04-10&hasta=2026-04-17")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Only the one belonging to the user's tenant
    expect(res.body.every((b: { horaInicio: string }) => b.horaInicio === "14:00")).toBe(true);
  });
});
