import { describe, it, expect } from "vitest";
import { request, createTestUser, createSuperAdminToken } from "./helpers.js";
import { Tenant } from "../models/Tenant.js";
import { Paciente } from "../models/Paciente.js";
import { Cita } from "../models/Cita.js";
import { Pago } from "../models/Pago.js";

describe("Admin Routes — Authorization", () => {
  it("returns 401 without token", async () => {
    const res = await request.get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("returns 403 for regular admin", async () => {
    const { token } = await createTestUser({ rol: "admin" });
    const res = await request.get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("returns 403 for doctor", async () => {
    const { token } = await createTestUser({ rol: "doctor" });
    const res = await request.get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe("GET /api/admin/tenants", () => {
  it("returns tenants list with total", async () => {
    const { token } = await createSuperAdminToken();
    await Tenant.create({ name: "Clinica A", slug: "clinica-a-test" });
    await Tenant.create({ name: "Clinica B", slug: "clinica-b-test" });

    const res = await request
      .get("/api/admin/tenants")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  it("filters tenants by name", async () => {
    const { token } = await createSuperAdminToken();
    await Tenant.create({ name: "Clinica Unica XYZ", slug: "clinica-unica-xyz" });

    const res = await request
      .get("/api/admin/tenants?name=Unica+XYZ")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].name).toMatch(/Unica XYZ/);
  });
});

describe("GET /api/admin/users", () => {
  it("returns all users across tenants without passwordHash", async () => {
    const { token } = await createSuperAdminToken();
    await createTestUser({ email: "user-a@admin-test.com" });
    await createTestUser({ email: "user-b@admin-test.com" });

    const res = await request
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    expect(res.body.items[0].passwordHash).toBeUndefined();
  });

  it("filters by email", async () => {
    const { token } = await createSuperAdminToken();
    await createTestUser({ email: "searchable-xyz@test.com" });

    const res = await request
      .get("/api/admin/users?email=searchable-xyz")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].email).toContain("searchable-xyz");
  });

  it("filters by rol", async () => {
    const { token } = await createSuperAdminToken();
    await createTestUser({ rol: "doctor", email: "doc-filter@test.com" });

    const res = await request
      .get("/api/admin/users?rol=doctor")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.every((u: any) => u.rol === "doctor")).toBe(true);
  });
});

describe("PATCH /api/admin/users/:id", () => {
  it("updates user nombre", async () => {
    const { token } = await createSuperAdminToken();
    const { user } = await createTestUser({ nombre: "Nombre Original" });

    const res = await request
      .patch(`/api/admin/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Nombre Actualizado" });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Nombre Actualizado");
    expect(res.body.passwordHash).toBeUndefined();
  });

  it("resets password when password field provided", async () => {
    const { token } = await createSuperAdminToken();
    const { user } = await createTestUser({ email: "passreset@test.com" });

    await request
      .patch(`/api/admin/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "NewPassword123!" });

    const loginRes = await request.post("/api/auth/login").send({
      email: "passreset@test.com",
      password: "NewPassword123!",
    });
    expect(loginRes.status).toBe(200);
  });

  it("returns 404 for non-existent user", async () => {
    const { token } = await createSuperAdminToken();
    const res = await request
      .patch("/api/admin/users/000000000000000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "Ghost" });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid payload", async () => {
    const { token } = await createSuperAdminToken();
    const { user } = await createTestUser();
    const res = await request
      .patch(`/api/admin/users/${user._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ nombre: "x" }); // too short
    expect(res.status).toBe(400);
  });
});

describe("GET /api/admin/pacientes", () => {
  it("returns pacientes with total", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant } = await createTestUser();
    await Paciente.create({
      tenantId: tenant._id,
      nombre: "AdminTest",
      apellido: "Paciente",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });

    const res = await request
      .get("/api/admin/pacientes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.total).toBe("number");
  });

  it("filters by estado", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant } = await createTestUser();
    await Paciente.create({
      tenantId: tenant._id,
      nombre: "Deuda",
      apellido: "Test",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
      estado: "en_deuda",
    });

    const res = await request
      .get("/api/admin/pacientes?estado=en_deuda")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.every((p: any) => p.estado === "en_deuda")).toBe(true);
  });
});

describe("PATCH /api/admin/pacientes/:id", () => {
  it("updates paciente estado", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "Activo",
      apellido: "Test",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
      estado: "activo",
    });

    const res = await request
      .patch(`/api/admin/pacientes/${paciente._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "inactivo" });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("inactivo");
  });
});

describe("GET /api/admin/citas", () => {
  it("returns citas with total", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant, user } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "P",
      apellido: "Q",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });
    await Cita.create({
      tenantId: tenant._id,
      pacienteId: paciente._id,
      doctorId: user._id,
      fecha: new Date(),
      horaInicio: "09:00",
      horaFin: "10:00",
      montoCita: 1000,
    });

    const res = await request
      .get("/api/admin/citas")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });
});

describe("PATCH /api/admin/citas/:id", () => {
  it("updates cita estado", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant, user } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "P",
      apellido: "Q",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });
    const cita = await Cita.create({
      tenantId: tenant._id,
      pacienteId: paciente._id,
      doctorId: user._id,
      fecha: new Date(),
      horaInicio: "09:00",
      horaFin: "10:00",
      montoCita: 1000,
      estado: "programada",
    });

    const res = await request
      .patch(`/api/admin/citas/${cita._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ estado: "realizada" });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("realizada");
  });
});

describe("GET /api/admin/pagos", () => {
  it("returns pagos with total", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant, user } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "P",
      apellido: "Q",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });
    await Pago.create({
      tenantId: tenant._id,
      pacienteId: paciente._id,
      monto: 5000,
      fechaPago: new Date(),
      metodo: "efectivo",
      tipoPago: "al_llegar",
      creadoPor: user._id,
    });

    const res = await request
      .get("/api/admin/pagos")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by metodo", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant, user } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "P",
      apellido: "Q",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });
    await Pago.create({
      tenantId: tenant._id,
      pacienteId: paciente._id,
      monto: 5000,
      metodo: "transferencia",
      tipoPago: "al_llegar",
      creadoPor: user._id,
    });

    const res = await request
      .get("/api/admin/pagos?metodo=transferencia")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.every((p: any) => p.metodo === "transferencia")).toBe(true);
  });
});

describe("PATCH /api/admin/pagos/:id", () => {
  it("updates pago notas", async () => {
    const { token } = await createSuperAdminToken();
    const { tenant, user } = await createTestUser();
    const paciente = await Paciente.create({
      tenantId: tenant._id,
      nombre: "P",
      apellido: "Q",
      fechaNacimiento: new Date("1990-01-01"),
      genero: "M",
    });
    const pago = await Pago.create({
      tenantId: tenant._id,
      pacienteId: paciente._id,
      monto: 5000,
      metodo: "efectivo",
      tipoPago: "al_llegar",
      creadoPor: user._id,
      notas: "",
    });

    const res = await request
      .patch(`/api/admin/pagos/${pago._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ notas: "Corregido por admin" });

    expect(res.status).toBe(200);
    expect(res.body.notas).toBe("Corregido por admin");
  });
});
