import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const serverRoot = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(serverRoot, "..", "..", ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Copy server/.env.example to server/.env and fill it in ' +
        '(or set MONGODB_URI in your hosting provider\'s environment variables).'
    );
  }
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    console.log(
      `MongoDB connected -> ${mongoose.connection.host}/${mongoose.connection.name}`,
    );
  });
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  const conn = await mongoose.connect(MONGODB_URI);
  return conn;
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
