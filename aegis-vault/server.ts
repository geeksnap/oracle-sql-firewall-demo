import { config } from "dotenv";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketServer } from "socket.io";
import { closePool } from "./lib/db/pool";
import { registerPollerSocket } from "./lib/poller-registry";
import { startViolationPoller } from "./lib/poller";

config({ path: ".env" });

const dbUser = (process.env.DB_USER ?? "AEGIS_APP").toUpperCase();
if (dbUser !== "AEGIS_APP") {
  console.error(
    `[aegis-vault] DB_USER must be AEGIS_APP (has SQL_FIREWALL_VIEWER). Got: ${process.env.DB_USER}`,
  );
  process.exit(1);
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    void handle(req, res, parsedUrl);
  });

  const io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });
  registerPollerSocket(io);

  io.on("connection", (socket) => {
    console.log(`[aegis-vault] client connected: ${socket.id}`);
    socket.emit("server-ready", {
      pdb: process.env.DB_CONTAINER ?? "AHDB2605_PDB1",
      user: process.env.DB_USER ?? "AEGIS_APP",
    });
  });

  let stopPoller: (() => void) | undefined;

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[aegis-vault] Port ${port} is already in use. Stop the other process:\n` +
          `  lsof -ti:${port} | xargs kill`,
      );
      process.exit(1);
    }
    throw err;
  });

  httpServer.listen(port, () => {
    console.log(`[aegis-vault] SOC dashboard → http://${hostname}:${port}`);
    console.log(
      `[aegis-vault] PDB ${process.env.DB_CONTAINER ?? "AHDB2605_PDB1"} | user ${process.env.DB_USER ?? "AEGIS_APP"}`,
    );
    stopPoller = startViolationPoller(io);
  });

  const shutdown = async () => {
    stopPoller?.();
    io.close();
    httpServer.close();
    await closePool();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((err) => {
  console.error("[aegis-vault] server failed to start:", err);
  process.exit(1);
});
