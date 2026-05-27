import path from "node:path";
import { fileURLToPath } from "node:url";
import dns from "node:dns";
import dotenv from "dotenv";
import app from "./app";
import { logger } from "./lib/logger";
import { connectMongoDB } from "./db/mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });
dotenv.config();

const dnsServersFromEnv = process.env["DNS_SERVERS"]
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (dnsServersFromEnv && dnsServersFromEnv.length > 0) {
  dns.setServers(dnsServersFromEnv);
  logger.info({ dnsServers: dns.getServers() }, "Using DNS_SERVERS override");
} else {
  const currentServers = dns.getServers();
  if (currentServers.length === 1 && currentServers[0] === "127.0.0.1") {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
    logger.info(
      { dnsServers: dns.getServers() },
      "Node DNS was localhost; switched to public resolvers",
    );
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

connectMongoDB()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to connect to MongoDB — shutting down");
    process.exit(1);
  });
