import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "../models/User.js";
import { Bloqueo } from "../models/Bloqueo.js";
import { Cita } from "../models/Cita.js";
import { Tenant } from "../models/Tenant.js";
import { syncInboundForUser } from "../services/inboundSyncService.js";

// ─── Mock googleapis ─────────────────────────────────────────────────────────

const { mockEventsList } = vi.hoisted(() => ({ mockEventsList: vi.fn() }));

vi.mock("googleapis", () => ({
  google: {
    calendar: vi.fn().mockReturnValue({
      events: { list: mockEventsList },
    }),
  },
}));

// ─── Mock getAuthenticatedClient (bypass token decryption) ───────────────────

vi.mock("../services/googleCalendarService.js", () => ({
  getAuthenticatedClient: vi.fn().mockResolvedValue({}),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createDoctorWithSync() {
  const tenant = await Tenant.create({ name: "Test Consultorio", slug: `test-${Date.now()}` });
  const user = await User.create({
    tenantId: tenant._id,
    nombre: "Dr. Test",
    email: `dr-${Date.now()}@test.com`,
    passwordHash: "hash",
    rol: "doctor",
    especialidad: "clinica",
    googleCalendar: {
      accessToken: "enc-access",
      refreshToken: "enc-refresh",
      syncEnabled: true,
    },
  });
  return { tenant, user };
}

function gcalEvent(id: string, overrides: Record<string, unknown> = {}) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const dateStr = tomorrow.toISOString().split("T")[0];
  // Use explicit UTC so the test is unaffected by DST in America/Santiago
  return {
    id,
    status: "confirmed",
    start: { dateTime: `${dateStr}T10:00:00+00:00`, timeZone: "UTC" },
    end: { dateTime: `${dateStr}T11:00:00+00:00`, timeZone: "UTC" },
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("syncInboundForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Bloqueo for a new GCal event", async () => {
    const { user } = await createDoctorWithSync();
    mockEventsList.mockResolvedValue({ data: { items: [gcalEvent("evt-001")] } });

    await syncInboundForUser(user as any);

    const bloqueos = await Bloqueo.find({ doctorId: user._id });
    expect(bloqueos).toHaveLength(1);
    expect(bloqueos[0].googleCalendarEventId).toBe("evt-001");
    expect(bloqueos[0].horaInicio).toBe("10:00");
    expect(bloqueos[0].horaFin).toBe("11:00");
  });

  it("updates an existing Bloqueo when the event changes", async () => {
    const { tenant, user } = await createDoctorWithSync();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await Bloqueo.create({
      doctorId: user._id,
      tenantId: tenant._id,
      googleCalendarEventId: "evt-002",
      fecha: tomorrow,
      horaInicio: "09:00",
      horaFin: "10:00",
    });

    // GCal now returns 10:00–11:00 for the same event
    mockEventsList.mockResolvedValue({ data: { items: [gcalEvent("evt-002")] } });

    await syncInboundForUser(user as any);

    const updated = await Bloqueo.findOne({ googleCalendarEventId: "evt-002" });
    expect(updated?.horaInicio).toBe("10:00");
    expect(updated?.horaFin).toBe("11:00");
    const all = await Bloqueo.find({ doctorId: user._id });
    expect(all).toHaveLength(1); // no duplicates
  });

  it("deletes the Bloqueo when the GCal event is cancelled", async () => {
    const { tenant, user } = await createDoctorWithSync();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await Bloqueo.create({
      doctorId: user._id,
      tenantId: tenant._id,
      googleCalendarEventId: "evt-003",
      fecha: tomorrow,
      horaInicio: "10:00",
      horaFin: "11:00",
    });

    mockEventsList.mockResolvedValue({
      data: { items: [gcalEvent("evt-003", { status: "cancelled" })] },
    });

    await syncInboundForUser(user as any);

    const remaining = await Bloqueo.findOne({ googleCalendarEventId: "evt-003" });
    expect(remaining).toBeNull();
  });

  it("skips events that are outbound citas (circular sync prevention)", async () => {
    const { tenant, user } = await createDoctorWithSync();
    // Pretend a cita was synced outbound with this GCal event ID
    await Cita.create({
      tenantId: tenant._id,
      pacienteId: user._id,
      doctorId: user._id,
      fecha: new Date(),
      horaInicio: "10:00",
      horaFin: "11:00",
      googleCalendarEventId: "evt-cita-own",
    });

    mockEventsList.mockResolvedValue({
      data: { items: [gcalEvent("evt-cita-own")] },
    });

    await syncInboundForUser(user as any);

    const bloqueos = await Bloqueo.find({ doctorId: user._id });
    expect(bloqueos).toHaveLength(0); // must NOT create a block for own cita
  });

  it("disables syncEnabled when Google returns 401", async () => {
    const { user } = await createDoctorWithSync();
    mockEventsList.mockRejectedValue({ status: 401 });

    await syncInboundForUser(user as any);

    const updated = await User.findById(user._id);
    expect(updated?.googleCalendar?.syncEnabled).toBe(false);
  });

  it("updates lastInboundSyncAt after a successful sync", async () => {
    const { user } = await createDoctorWithSync();
    mockEventsList.mockResolvedValue({ data: { items: [] } });

    const before = new Date();
    await syncInboundForUser(user as any);

    const updated = await User.findById(user._id);
    expect(updated?.googleCalendar?.lastInboundSyncAt).toBeDefined();
    expect(updated!.googleCalendar!.lastInboundSyncAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
