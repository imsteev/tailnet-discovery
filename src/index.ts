import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { readFileSync } from "fs";
import { join } from "path";
import { Database } from "bun:sqlite";

const app = new Hono();

interface TailnetHost {
  name: string;
  ports: Record<string, string>;
}

interface Config {
  tailnet_hosts: Record<string, TailnetHost>;
}

interface Service {
  ip: string;
  port: number;
  name: string;
  host_name: string;
}

// Initialize SQLite database
function initDatabase(): Database {
  const db = new Database("services.db");

  // Create services table with unique constraint on ip + port
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      port INTEGER NOT NULL,
      name TEXT NOT NULL,
      host_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ip_port ON services(ip, port)
  `);

  return db;
}

// Migrate data from config.json to SQLite (one-time operation)
function migrateConfigToDatabase(db: Database): void {
  try {
    const configPath = join(process.cwd(), "config.json");
    const configFile = readFileSync(configPath, "utf-8");
    const config = JSON.parse(configFile);

    const insertService = db.prepare(`
      INSERT OR REPLACE INTO services (ip, port, name, host_name) 
      VALUES (?, ?, ?, ?)
    `);

    Object.entries(config.tailnet_hosts).forEach(
      ([ip, host]: [string, any]) => {
        Object.entries(host.ports).forEach(
          ([port, serviceName]: [string, any]) => {
            insertService.run(ip, parseInt(port), serviceName, host.name);
          }
        );
      }
    );

    console.log("✅ Successfully migrated config.json to database");
  } catch (error) {
    console.log("ℹ️ No config.json found or migration not needed");
  }
}

// Load configuration from SQLite database
function loadConfig(db: Database): Config {
  const services = db
    .prepare("SELECT * FROM services ORDER BY host_name, ip, port")
    .all() as Service[];

  const config: Config = {
    tailnet_hosts: {},
  };

  services.forEach((service) => {
    if (!config.tailnet_hosts[service.ip]) {
      config.tailnet_hosts[service.ip] = {
        name: service.host_name,
        ports: {},
      };
    }
    config.tailnet_hosts[service.ip].ports[service.port.toString()] =
      service.name;
  });

  return config;
}

const db = initDatabase();
migrateConfigToDatabase(db);
const config: Config = loadConfig(db);

// Check if port is reachable
async function checkPort(ip: string, port: string): Promise<boolean> {
  try {
    const socket = await Bun.connect({
      hostname: ip,
      port: parseInt(port),
      socket: {
        data() {},
        error() {},
        close() {},
      },
    });
    socket.end();
    return true;
  } catch {
    return false;
  }
}

// Serve static files
app.use(
  "/static/*",
  serveStatic({
    root: "./dist",
    rewriteRequestPath: (path) => path.replace(/^\/static/, ""),
  })
);

// Main page - serve React app
app.get("/", serveStatic({ path: "./public/index.html" }));

// API endpoint to check port status
app.get("/check/:ip/:port", async (c) => {
  const ip = c.req.param("ip");
  const port = c.req.param("port");

  const reachable = await checkPort(ip, port);

  return c.json({ reachable });
});

// API endpoint to get configuration
app.get("/api/config", (c) => {
  const currentConfig = loadConfig(db);
  return c.json(currentConfig);
});

// API endpoint to add a service
app.post("/api/services", async (c) => {
  try {
    const { ip, port, name, host_name } = await c.req.json();

    const insertService = db.prepare(`
      INSERT OR REPLACE INTO services (ip, port, name, host_name) 
      VALUES (?, ?, ?, ?)
    `);

    insertService.run(ip, parseInt(port), name, host_name);

    return c.json({ success: true, message: "Service added successfully" });
  } catch (error) {
    return c.json({ success: false, error: "Failed to add service" }, 400);
  }
});

// API endpoint to delete a service
app.delete("/api/services/:ip/:port", (c) => {
  try {
    const ip = c.req.param("ip");
    const port = c.req.param("port");

    const deleteService = db.prepare(
      "DELETE FROM services WHERE ip = ? AND port = ?"
    );
    const result = deleteService.run(ip, parseInt(port));

    if (result.changes === 0) {
      return c.json({ success: false, error: "Service not found" }, 404);
    }

    return c.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    return c.json({ success: false, error: "Failed to delete service" }, 400);
  }
});

// API endpoint to get all services
app.get("/api/services", (c) => {
  const services = db
    .prepare("SELECT * FROM services ORDER BY host_name, ip, port")
    .all();
  return c.json(services);
});

console.log("🚀 Tailnet Discovery Server starting on http://localhost:3000");

export default {
  port: 3000,
  fetch: app.fetch,
};
