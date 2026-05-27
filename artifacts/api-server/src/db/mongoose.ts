import mongoose from "mongoose";
import { logger } from "../lib/logger";
import dotenv from "dotenv";

// Load env vars from the workspace root `.env` for local development.
// (Does not override real environment variables, so Replit Secrets still win.)
dotenv.config({ path: "../../.env" });
dotenv.config();

/**
 * Establish a connection to MongoDB using the MONGODB_URI environment variable.
 * This must resolve before the HTTP server starts accepting requests.
 */
export async function connectMongoDB(): Promise<void> {
  const uri = process.env["MONGODB_URI"];

  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is required but was not provided."
    );
  }

  try {
    await mongoose.connect(uri);
    logger.info("Connected to MongoDB");
  } catch (err) {
    const anyErr = err as any;
    const isSrvLookupFailure =
      typeof uri === "string" &&
      uri.startsWith("mongodb+srv://") &&
      (anyErr?.code === "ECONNREFUSED" || anyErr?.code === "ENOTFOUND") &&
      anyErr?.syscall === "querySrv";

    if (isSrvLookupFailure) {
      logger.error(
        {
          err,
          hint:
            "DNS SRV lookup failed. This is often caused by VPN/corporate DNS blocking SRV queries. Try switching MONGODB_URI to Atlas 'Standard connection string' (mongodb://...) or change your DNS (e.g., 1.1.1.1 / 8.8.8.8).",
        },
        "Failed to connect to MongoDB (SRV lookup)",
      );
    } else {
      logger.error({ err }, "Failed to connect to MongoDB");
    }
    throw err;
  }
}
