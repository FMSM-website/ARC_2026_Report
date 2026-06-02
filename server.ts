import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const RECORDS_FILE = path.join(DATA_DIR, "records.json");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure default files exist
if (!fs.existsSync(RECORDS_FILE)) {
  fs.writeFileSync(RECORDS_FILE, JSON.stringify([], null, 2), "utf-8");
}

const defaultAdmin = [
  {
    username: "admin",
    fullName: "مسؤول المصلحة (المدير)",
    role: "admin",
    avatar: "🏛️",
    matsaleh: "مديرية الميزانية - ورقلة",
    passwordHash: "admin"
  }
];

if (!fs.existsSync(ACCOUNTS_FILE)) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(defaultAdmin, null, 2), "utf-8");
}

async function startServer() {
  const app = express();

  // Allow parsing JSON requests
  app.use(express.json({ limit: "50mb" }));

  // CORS headers for LAN clients
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    next();
  });

  // --- API Endpoints ---
  
  // Status check
  app.get("/api/status", (req, res) => {
    res.json({ 
      status: "ok", 
      mode: "lan_server",
      time: new Date().toISOString()
    });
  });

  // Get all archive records
  app.get("/api/records", (req, res) => {
    try {
      if (fs.existsSync(RECORDS_FILE)) {
        const data = fs.readFileSync(RECORDS_FILE, "utf-8");
        return res.json(JSON.parse(data));
      }
      res.json([]);
    } catch (error) {
      console.error("Error reading records file:", error);
      res.status(500).json({ error: "Failed to read records database." });
    }
  });

  // Save all archive records (overwrite/sync)
  app.post("/api/records/save", (req, res) => {
    try {
      const records = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ error: "Invalid records format. Must be an array." });
      }
      fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), "utf-8");
      res.json({ success: true, count: records.length });
    } catch (error) {
      console.error("Error writing records file:", error);
      res.status(500).json({ error: "Failed to save records." });
    }
  });

  // Get archivist accounts
  app.get("/api/accounts", (req, res) => {
    try {
      if (fs.existsSync(ACCOUNTS_FILE)) {
        const data = fs.readFileSync(ACCOUNTS_FILE, "utf-8");
        return res.json(JSON.parse(data));
      }
      res.json(defaultAdmin);
    } catch (error) {
      console.error("Error reading accounts file:", error);
      res.status(500).json({ error: "Failed to read accounts database." });
    }
  });

  // Save archivist accounts (overwrite/sync)
  app.post("/api/accounts/save", (req, res) => {
    try {
      const accounts = req.body;
      if (!Array.isArray(accounts)) {
        return res.status(400).json({ error: "Invalid accounts format. Must be an array." });
      }
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), "utf-8");
      res.json({ success: true, count: accounts.length });
    } catch (error) {
      console.error("Error writing accounts file:", error);
      res.status(500).json({ error: "Failed to save accounts." });
    }
  });


  // Serve frontend files
  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`--------------------------------------------------------`);
    console.log(`🚀 SERENE ARCHIVE CENTRAL SERVER STARTED SUCCESSFULY`);
    console.log(`🌐 LAN Server mode: ACTIVE`);
    console.log(`📍 Local access: http://localhost:${PORT}`);
    console.log(`--------------------------------------------------------`);
  });
}

startServer();
