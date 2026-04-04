function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Create a .env file based on .env.example and restart the app.`,
    );
  }

  return value;
}

export function validateServerEnv(): void {
  requireEnv("MONGODB_URI");
  requireEnv("JWT_SECRET");
}

export function getJwtSecret(): string {
  return requireEnv("JWT_SECRET");
}
