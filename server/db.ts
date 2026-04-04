import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined");

  await mongoose.connect(uri);
  console.log("MongoDB connected:", uri.split("@").pop() ?? uri);
}

export async function getDBHealth(): Promise<{
  ok: boolean;
  readyState: number;
}> {
  const { connection } = mongoose;

  if (connection.readyState !== 1 || !connection.db) {
    return {
      ok: false,
      readyState: connection.readyState,
    };
  }

  await connection.db.admin().ping();

  return {
    ok: true,
    readyState: connection.readyState,
  };
}
