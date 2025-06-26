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

  // Create hosts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create services table with unique constraint on ip + port
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      port INTEGER NOT NULL,
      name TEXT NOT NULL,
      host_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ip) REFERENCES hosts(ip) ON DELETE CASCADE
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

    const insertHost = db.prepare(`
      INSERT OR REPLACE INTO hosts (name, ip) 
      VALUES (?, ?)
    `);

    const insertService = db.prepare(`
      INSERT OR REPLACE INTO services (ip, port, name, host_name) 
      VALUES (?, ?, ?, ?)
    `);

    Object.entries(config.tailnet_hosts).forEach(
      ([ip, host]: [string, any]) => {
        // Insert host first
        insertHost.run(host.name, ip);

        // Then insert services for this host
        Object.entries(host.ports).forEach(
          ([port, serviceName]: [string, any]) => {
            insertService.run(ip, parseInt(port), serviceName, host.name);
          },
        );
      },
    );

    console.log("✅ Successfully migrated config.json to database");
  } catch (error) {
    console.log("ℹ️ No config.json found or migration not needed");
  }
}

// Load configuration from SQLite database
function loadConfig(db: Database): Config {
  const hosts = db.prepare("SELECT * FROM hosts ORDER BY name").all() as Array<{
    name: string;
    ip: string;
  }>;

  const services = db
    .prepare("SELECT * FROM services ORDER BY host_name, ip, port")
    .all() as Service[];

  const config: Config = {
    tailnet_hosts: {},
  };

  // First, add all hosts (even those without services)
  hosts.forEach((host) => {
    config.tailnet_hosts[host.ip] = {
      name: host.name,
      ports: {},
    };
  });

  // Then, add services to their respective hosts
  services.forEach((service) => {
    if (config.tailnet_hosts[service.ip]) {
      config.tailnet_hosts[service.ip].ports[service.port.toString()] =
        service.name;
    }
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
  }),
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

// API endpoint to add a service
app.post("/api/services", async (c) => {
  try {
    const { ip, port, name, host_name } = await c.req.json();

    // Ensure the host exists
    const hostExists = db.prepare("SELECT 1 FROM hosts WHERE ip = ?").get(ip);
    if (!hostExists) {
      // Create the host if it doesn't exist
      const insertHost = db.prepare(`
        INSERT OR REPLACE INTO hosts (name, ip) 
        VALUES (?, ?)
      `);
      insertHost.run(host_name, ip);
    }

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
      "DELETE FROM services WHERE ip = ? AND port = ?",
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
  const currentConfig = loadConfig(db);
  return c.json(currentConfig);
});

// API endpoint to check if a specific service exists
app.get("/api/services/:ip/:port", (c) => {
  try {
    const ip = c.req.param("ip");
    const port = c.req.param("port");

    const service = db
      .prepare("SELECT * FROM services WHERE ip = ? AND port = ?")
      .get(ip, parseInt(port));

    if (service) {
      return c.json(service);
    } else {
      return c.json({ error: "Service not found" }, 404);
    }
  } catch (error) {
    return c.json({ error: "Failed to check service" }, 500);
  }
});

// API endpoint to add a host
app.post("/api/hosts", async (c) => {
  try {
    const { name, ip } = await c.req.json();

    const insertHost = db.prepare(`
      INSERT OR REPLACE INTO hosts (name, ip) 
      VALUES (?, ?)
    `);

    insertHost.run(name, ip);

    return c.json({ success: true, message: "Host added successfully" });
  } catch (error) {
    return c.json({ success: false, error: "Failed to add host" }, 400);
  }
});

// API endpoint to get all hosts
app.get("/api/hosts", (c) => {
  try {
    const hosts = db.prepare("SELECT * FROM hosts ORDER BY name").all();
    return c.json(hosts);
  } catch (error) {
    return c.json({ success: false, error: "Failed to get hosts" }, 500);
  }
});

// API endpoint to delete a host (and all its services)
app.delete("/api/hosts/:ip", (c) => {
  try {
    const ip = c.req.param("ip");

    const deleteHost = db.prepare("DELETE FROM hosts WHERE ip = ?");
    const result = deleteHost.run(ip);

    if (result.changes === 0) {
      return c.json({ success: false, error: "Host not found" }, 404);
    }

    return c.json({ success: true, message: "Host deleted successfully" });
  } catch (error) {
    return c.json({ success: false, error: "Failed to delete host" }, 400);
  }
});

console.log("🚀 Tailnet Discovery Server starting on http://localhost:3000");

export default {
  port: 3000,
  fetch: app.fetch,
};
