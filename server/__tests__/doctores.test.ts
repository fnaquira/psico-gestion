import { describe, it, expect, beforeEach } from "vitest";
import { request, createTestUser } from "./helpers.js";

describe("Doctores Routes", () => {
  let adminToken: string;
  let tenantId: string;

  beforeEach(async () => {
    const ctx = await createTestUser({ rol: "admin" });
    adminToken = ctx.token;
    tenantId = String(ctx.tenant._id);
  });

  describe("GET /api/doctores", () => {
    it("returns doctors list without passwordHash", async () => {
      const res = await request
        .get("/api/doctores")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Should include the admin user created in beforeEach
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      // No passwordHash leak
      res.body.forEach((doc: any) => {
        expect(doc.passwordHash).toBeUndefined();
      });
    });
  });

  describe("POST /api/doctores", () => {
    it("creates a doctor (admin only)", async () => {
      const res = await request
        .post("/api/doctores")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nombre: "Dr. New",
          email: "new-doctor@test.com",
          especialidad: "infantil",
          password: "NewDoctor123",
        });

      expect(res.status).toBe(201);
      expect(res.body.nombre).toBe("Dr. New");
      expect(res.body.rol).toBe("doctor");
      expect(res.body.passwordHash).toBeUndefined();
    });

    it("returns 403 for doctor role", async () => {
      const doctor = await createTestUser({
        rol: "doctor",
        email: "doc@test.com",
        tenantId,
      });

      const res = await request
        .post("/api/doctores")
        .set("Authorization", `Bearer ${doctor.token}`)
        .send({
          nombre: "Another Doc",
          email: "another@test.com",
          especialidad: "clinica",
        });

      expect(res.status).toBe(403);
    });

    it("returns 409 on duplicate email within tenant", async () => {
      await request
        .post("/api/doctores")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nombre: "Dr. First",
          email: "duplicate@test.com",
          especialidad: "clinica",
        });

      const res = await request
        .post("/api/doctores")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nombre: "Dr. Second",
          email: "duplicate@test.com",
          especialidad: "clinica",
        });

      expect(res.status).toBe(409);
    });
  });

  describe("PUT /api/doctores/:id", () => {
    it("updates doctor fields (admin only)", async () => {
      const createRes = await request
        .post("/api/doctores")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nombre: "Dr. Update",
          email: "update@test.com",
          especialidad: "clinica",
        });

      const res = await request
        .put(`/api/doctores/${createRes.body._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ nombre: "Dr. Updated" });

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe("Dr. Updated");
    });
  });
});
