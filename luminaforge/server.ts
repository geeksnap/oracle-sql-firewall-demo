import { config } from "dotenv";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { closePool } from "./src/lib/db/pool";

config({ path: ".env" });

const dbUser = (process.env.DB_USER ?? "luminaforge").toUpperCase();
if (dbUser !== "LUMINAFORGE") {
  console.error(
    `[luminaforge] DB_USER must be luminaforge. Got: ${process.env.DB_USER}`,
  );
  process.exit(1);
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = Number(process.env.PORT ?? 3001);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    void handle(req, res, parsedUrl);
  });

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[luminaforge] Port ${port} is already in use. Stop the other process:\n` +
          `  lsof -ti:${port} | xargs kill`,
      );
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(port, () => {
    console.log(`[luminaforge] Dark Luxury app → http://${hostname}:${port}`);
    console.log(
      `[luminaforge] PDB ${process.env.DB_CONTAINER ?? "AHDB2605_PDB1"} | user luminaforge`,
    );
    console.warn(
      `[luminaforge] ⚠  INTENTIONALLY VULNERABLE DEMO APP — DO NOT EXPOSE TO PRODUCTION`,
    );
  });

  const shutdown = async () => {
    httpServer.close();
    await closePool();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((err) => {
  console.error("[luminaforge] server failed to start:", err);
  process.exit(1);
});
