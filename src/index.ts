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
    
    Object.entries(config.tailnet_hosts).forEach(([ip, host]: [string, any]) => {
      Object.entries(host.ports).forEach(([port, serviceName]: [string, any]) => {
        insertService.run(ip, parseInt(port), serviceName, host.name);
      });
    });
    
    console.log("✅ Successfully migrated config.json to database");
  } catch (error) {
    console.log("ℹ️ No config.json found or migration not needed");
  }
}

// Load configuration from SQLite database
function loadConfig(db: Database): Config {
  const services = db.prepare("SELECT * FROM services ORDER BY host_name, ip, port").all() as Service[];
  
  const config: Config = {
    tailnet_hosts: {}
  };
  
  services.forEach(service => {
    if (!config.tailnet_hosts[service.ip]) {
      config.tailnet_hosts[service.ip] = {
        name: service.host_name,
        ports: {}
      };
    }
    config.tailnet_hosts[service.ip].ports[service.port.toString()] = service.name;
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
app.use("/static/*", serveStatic({ root: "./dist", rewriteRequestPath: (path) => path.replace(/^\/static/, '') }));

// Main page - serve React app
app.get("/", serveStatic({ path: "./public/index.html" }));

// Legacy HTML endpoint (for reference)
app.get("/legacy", (c) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Tailnet Application Discovery</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .host {
            background: white;
            margin: 20px 0;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .host-header {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .host-ip {
            color: #6b7280;
            font-size: 14px;
        }
        .ports {
            margin-top: 15px;
        }
        .port {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .port:last-child {
            border-bottom: none;
        }
        .port-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .port-number {
            font-family: monospace;
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
        }
        .port-name {
            font-weight: 500;
        }
        .port-name a {
            color: #2563eb;
            text-decoration: none;
        }
        .port-name a:hover {
            text-decoration: underline;
        }
        .status {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }
        .status.up {
            background: #dcfce7;
            color: #166534;
        }
        .status.down {
            background: #fef2f2;
            color: #991b1b;
        }
        .status.checking {
            background: #fef3c7;
            color: #92400e;
        }
        h1 {
            text-align: center;
            color: #1f2937;
            margin-bottom: 30px;
        }
        .refresh-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 20px;
        }
        .refresh-btn:hover {
            background: #1d4ed8;
        }
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .add-service-btn {
            background: #16a34a;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-top: 10px;
        }
        .add-service-btn:hover {
            background: #15803d;
        }
        .edit-btn {
            background: #f59e0b;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-left: 10px;
        }
        .edit-btn:hover {
            background: #d97706;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
        }
        .modal-content {
            background: white;
            margin: 15% auto;
            padding: 20px;
            border-radius: 8px;
            width: 400px;
            max-width: 90%;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        .form-group input {
            width: 100%;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .form-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .btn-cancel {
            background: #6b7280;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        .btn-save {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>Tailnet Application Discovery</h1>
    <div class="action-buttons">
        <button class="refresh-btn" onclick="checkAllPorts()">Refresh Status</button>
    </div>
    
    <div id="hosts"></div>
    
    <!-- Service Modal -->
    <div id="serviceModal" class="modal">
        <div class="modal-content">
            <h3 id="modalTitle">Add New Service</h3>
            <form id="serviceForm">
                <div class="form-group">
                    <label for="hostName">Host Name:</label>
                    <input type="text" id="hostName" required>
                </div>
                <div class="form-group">
                    <label for="ipAddress">IP Address:</label>
                    <input type="text" id="ipAddress" required readonly>
                </div>
                <div class="form-group">
                    <label for="portNumber">Port:</label>
                    <input type="number" id="portNumber" required>
                </div>
                <div class="form-group">
                    <label for="serviceName">Service Name:</label>
                    <input type="text" id="serviceName" required>
                </div>
                <div class="form-buttons">
                    <button type="button" class="btn-cancel" onclick="hideServiceModal()">Cancel</button>
                    <button type="button" class="btn-cancel" id="deleteBtn" onclick="deleteService()" style="background: #dc2626; display: none;">Delete</button>
                    <button type="submit" class="btn-save" id="saveBtn">Add Service</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        let config = ${JSON.stringify(config)};
        
        async function refreshConfig() {
            try {
                const response = await fetch('/api/config');
                config = await response.json();
                renderHosts();
                checkAllPorts();
            } catch (error) {
                console.error('Failed to refresh config:', error);
            }
        }
        
        let isEditMode = false;
        let originalPort = null;
        
        function showAddServiceModal(ip = '', hostName = '') {
            isEditMode = false;
            originalPort = null;
            document.getElementById('modalTitle').textContent = 'Add New Service';
            document.getElementById('saveBtn').textContent = 'Add Service';
            document.getElementById('deleteBtn').style.display = 'none';
            document.getElementById('portNumber').readOnly = false;
            
            document.getElementById('serviceModal').style.display = 'block';
            if (ip) {
                document.getElementById('ipAddress').value = ip;
                document.getElementById('hostName').value = hostName;
            }
        }
        
        function editService(ip, port, name, hostName) {
            isEditMode = true;
            originalPort = port;
            document.getElementById('modalTitle').textContent = 'Edit Service';
            document.getElementById('saveBtn').textContent = 'Update Service';
            document.getElementById('deleteBtn').style.display = 'inline-block';
            document.getElementById('portNumber').readOnly = true;
            
            document.getElementById('serviceModal').style.display = 'block';
            document.getElementById('ipAddress').value = ip;
            document.getElementById('hostName').value = hostName;
            document.getElementById('portNumber').value = port;
            document.getElementById('serviceName').value = name;
        }
        
        function hideServiceModal() {
            document.getElementById('serviceModal').style.display = 'none';
            document.getElementById('serviceForm').reset();
            isEditMode = false;
            originalPort = null;
        }
        
        async function saveService(event) {
            event.preventDefault();
            
            const hostName = document.getElementById('hostName').value;
            const ipAddress = document.getElementById('ipAddress').value;
            const portNumber = document.getElementById('portNumber').value;
            const serviceName = document.getElementById('serviceName').value;
            
            try {
                const response = await fetch('/api/services', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ip: ipAddress,
                        port: parseInt(portNumber),
                        name: serviceName,
                        host_name: hostName
                    })
                });
                
                if (response.ok) {
                    hideServiceModal();
                    await refreshConfig();
                } else {
                    alert(isEditMode ? 'Failed to update service' : 'Failed to add service');
                }
            } catch (error) {
                console.error('Error saving service:', error);
                alert('Error saving service');
            }
        }
        
        async function deleteService() {
            const ipAddress = document.getElementById('ipAddress').value;
            const portNumber = originalPort;
            
            if (!confirm(\`Are you sure you want to delete the service on \${ipAddress}:\${portNumber}?\`)) {
                return;
            }
            
            try {
                const response = await fetch(\`/api/services/\${ipAddress}/\${portNumber}\`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    hideServiceModal();
                    await refreshConfig();
                } else {
                    alert('Failed to delete service');
                }
            } catch (error) {
                console.error('Error deleting service:', error);
                alert('Error deleting service');
            }
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('serviceModal');
            if (event.target === modal) {
                hideServiceModal();
            }
        }
        
        function renderHosts() {
            const hostsDiv = document.getElementById('hosts');
            hostsDiv.innerHTML = '';
            
            Object.entries(config.tailnet_hosts).forEach(([ip, host]) => {
                const hostDiv = document.createElement('div');
                hostDiv.className = 'host';
                hostDiv.innerHTML = \`
                    <div class="host-header">\${host.name}</div>
                    <div class="host-ip">\${ip}</div>
                    <div class="ports">
                        \${Object.entries(host.ports).map(([port, name]) => \`
                            <div class="port">
                                <div class="port-info">
                                    <span class="port-number">\${port}</span>
                                    <span class="port-name">
                                        <a href="http://\${ip}:\${port}" target="_blank">\${name}</a>
                                        <button class="edit-btn" onclick="editService('\${ip}', '\${port}', '\${name}', '\${host.name}')">Edit</button>
                                    </span>
                                </div>
                                <span class="status checking" id="status-\${ip}-\${port}">Checking...</span>
                            </div>
                        \`).join('')}
                        <button class="add-service-btn" onclick="showAddServiceModal('\${ip}', '\${host.name}')">+ Add Service</button>
                    </div>
                \`;
                hostsDiv.appendChild(hostDiv);
            });
        }
        
        async function checkAllPorts() {
            document.querySelectorAll('.status').forEach(el => {
                el.textContent = 'Checking...';
                el.className = 'status checking';
            });
            
            const promises = [];
            Object.entries(config.tailnet_hosts).forEach(([ip, host]) => {
                Object.keys(host.ports).forEach(port => {
                    promises.push(checkPortStatus(ip, port));
                });
            });
            
            await Promise.all(promises);
        }
        
        async function checkPortStatus(ip, port) {
            try {
                const response = await fetch(\`/check/\${ip}/\${port}\`);
                const result = await response.json();
                const statusEl = document.getElementById(\`status-\${ip}-\${port}\`);
                
                if (result.reachable) {
                    statusEl.textContent = 'Up';
                    statusEl.className = 'status up';
                } else {
                    statusEl.textContent = 'Down';
                    statusEl.className = 'status down';
                }
            } catch (error) {
                const statusEl = document.getElementById(\`status-\${ip}-\${port}\`);
                statusEl.textContent = 'Error';
                statusEl.className = 'status down';
            }
        }
        
        renderHosts();
        checkAllPorts();
        
        // Initialize form handler after DOM is loaded
        setTimeout(() => {
            document.getElementById('serviceForm').addEventListener('submit', saveService);
        }, 100);
    </script>
</body>
</html>
  `;
  return c.html(html);
});

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
    
    const deleteService = db.prepare("DELETE FROM services WHERE ip = ? AND port = ?");
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
  const services = db.prepare("SELECT * FROM services ORDER BY host_name, ip, port").all();
  return c.json(services);
});

console.log("🚀 Tailnet Discovery Server starting on http://localhost:3000");

export default {
  port: 3000,
  fetch: app.fetch,
};
