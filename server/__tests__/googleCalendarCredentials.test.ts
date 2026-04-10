import { describe, it, expect, beforeAll } from "vitest";
import { request, createTestUser } from "./helpers.js";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = "a".repeat(64); // 32 bytes as hex for AES-256
  process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/api/google-calendar/callback";
});

describe("GET /api/google-calendar/credentials", () => {
  it("returns { configured: false } when no credentials saved", async () => {
    const { token } = await createTestUser();
    const res = await request
      .get("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ configured: false });
  });

  it("returns 401 without token", async () => {
    const res = await request.get("/api/google-calendar/credentials");
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/google-calendar/credentials", () => {
  it("saves credentials and returns { ok: true }", async () => {
    const { token } = await createTestUser();
    const res = await request
      .put("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId: "my-client-id", clientSecret: "my-client-secret" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("returns { configured: true } after saving", async () => {
    const { token } = await createTestUser();
    await request
      .put("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId: "my-client-id", clientSecret: "my-client-secret" });

    const res = await request
      .get("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ configured: true });
  });

  it("returns 400 when clientId is missing", async () => {
    const { token } = await createTestUser();
    const res = await request
      .put("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientSecret: "secret-only" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when clientSecret is missing", async () => {
    const { token } = await createTestUser();
    const res = await request
      .put("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId: "id-only" });
    expect(res.status).toBe(400);
  });

  it("returns 401 without token", async () => {
    const res = await request
      .put("/api/google-calendar/credentials")
      .send({ clientId: "id", clientSecret: "secret" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/google-calendar/auth-url", () => {
  it("returns 400 when no credentials configured", async () => {
    const { token } = await createTestUser();
    const res = await request
      .get("/api/google-calendar/auth-url")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/credenciales/i);
  });

  it("returns { url } pointing to Google when credentials are configured", async () => {
    const { token } = await createTestUser();
    await request
      .put("/api/google-calendar/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: "test-client-id.apps.googleusercontent.com",
        clientSecret: "GOCSPX-test-secret",
      });

    const res = await request
      .get("/api/google-calendar/auth-url")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.url).toContain("accounts.google.com");
  });
});
