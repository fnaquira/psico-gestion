import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  // Set required env vars for tests
  process.env.JWT_SECRET = "test-secret-key-for-vitest";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.NODE_ENV = "test";

  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
