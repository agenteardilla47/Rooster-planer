import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("roster.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    preferred_start TEXT,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS coverage_rules (
    role TEXT NOT NULL,
    day_type TEXT NOT NULL, -- 'weekday' or 'weekend'
    min_staff INTEGER NOT NULL,
    PRIMARY KEY (role, day_type)
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    shift_start TEXT,
    status TEXT NOT NULL, -- 'working', 'libre', 'vacation', 'unavailable'
    UNIQUE(employee_id, date),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- 'LIBRE', 'unavailable', 'VACATION'
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );
`);

// Seed default rules if empty
const ruleCount = db.prepare("SELECT COUNT(*) as count FROM coverage_rules").get() as { count: number };
if (ruleCount.count === 0) {
  const insertRule = db.prepare("INSERT INTO coverage_rules (role, day_type, min_staff) VALUES (?, ?, ?)");
  const defaultRules = [
    ['WAIT', 'weekday', 10], ['WAIT', 'weekend', 13],
    ['BRUN', 'weekday', 3], ['BRUN', 'weekend', 4],
    ['KRUN', 'weekday', 4], ['KRUN', 'weekend', 5],
    ['BART', 'weekday', 4], ['BART', 'weekend', 4],
    ['HOST', 'weekday', 2], ['HOST', 'weekend', 2],
    ['MGR', 'weekday', 1], ['MGR', 'weekend', 2],
  ];
  defaultRules.forEach(rule => insertRule.run(...rule));
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/employees", (req, res) => {
    const employees = db.prepare("SELECT * FROM employees").all();
    res.json(employees);
  });

  app.post("/api/employees", (req, res) => {
    const { name, role, preferred_start } = req.body;
    const info = db.prepare("INSERT INTO employees (name, role, preferred_start) VALUES (?, ?, ?)").run(name, role, preferred_start);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/employees/:id", (req, res) => {
    db.prepare("DELETE FROM employees WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/rules", (req, res) => {
    const rules = db.prepare("SELECT * FROM coverage_rules").all();
    res.json(rules);
  });

  app.post("/api/rules", (req, res) => {
    const { role, day_type, min_staff } = req.body;
    db.prepare("INSERT OR REPLACE INTO coverage_rules (role, day_type, min_staff) VALUES (?, ?, ?)").run(role, day_type, min_staff);
    res.json({ success: true });
  });

  app.get("/api/schedule/:weekStart", (req, res) => {
    const { weekStart } = req.params;
    // Get 7 days from weekStart
    const schedule = db.prepare(`
      SELECT s.*, e.name, e.role 
      FROM schedules s 
      JOIN employees e ON s.employee_id = e.id 
      WHERE s.date >= ? AND s.date <= date(?, '+6 days')
    `).all(weekStart, weekStart);
    res.json(schedule);
  });

  app.get("/api/requests", (req, res) => {
    const requests = db.prepare(`
      SELECT r.*, e.name, e.role 
      FROM requests r 
      JOIN employees e ON r.employee_id = e.id
    `).all();
    res.json(requests);
  });

  app.post("/api/requests", (req, res) => {
    const { employee_id, date, type } = req.body;
    db.prepare("INSERT INTO requests (employee_id, date, type) VALUES (?, ?, ?)").run(employee_id, date, type);
    res.json({ success: true });
  });

  app.delete("/api/requests/:id", (req, res) => {
    db.prepare("DELETE FROM requests WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/schedule/generate", (req, res) => {
    const { weekStart } = req.body;
    
    db.transaction(() => {
      db.prepare("DELETE FROM schedules WHERE date >= ? AND date <= date(?, '+6 days')").run(weekStart, weekStart);

      const employees = db.prepare("SELECT * FROM employees WHERE status = 'active'").all() as any[];
      const rules = db.prepare("SELECT * FROM coverage_rules").all() as any[];
      const requests = db.prepare("SELECT * FROM requests WHERE date >= ? AND date <= date(?, '+6 days')").all(weekStart, weekStart) as any[];
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        days.push(d.toISOString().split('T')[0]);
      }

      const weekendIndices = [4, 5, 6]; // Fri, Sat, Sun
      const insertSchedule = db.prepare("INSERT INTO schedules (employee_id, date, shift_start, status) VALUES (?, ?, ?, ?)");

      // 1. Apply Requests First
      requests.forEach(req => {
        if (req.type === 'VACATION') {
          // Apply to whole week if it's a vacation request
          days.forEach(date => {
            insertSchedule.run(req.employee_id, date, null, 'VACATION');
          });
        } else {
          insertSchedule.run(req.employee_id, req.date, null, req.type);
        }
      });

      // 2. Fill Weekends
      weekendIndices.forEach(dayIdx => {
        const date = days[dayIdx];
        const dayType = 'weekend';
        
        const roles = [...new Set(employees.map(e => e.role))];
        roles.forEach(role => {
          const rule = rules.find(r => r.role === role && r.day_type === dayType);
          const minNeeded = rule ? rule.min_staff : 0;
          
          // Count already assigned (from requests)
          const assignedCount = db.prepare("SELECT COUNT(*) as count FROM schedules WHERE date = ? AND status = 'working' AND employee_id IN (SELECT id FROM employees WHERE role = ?)").get(date, role) as any;
          let needed = minNeeded - assignedCount.count;
          if (needed <= 0) return;

          const available = employees.filter(e => {
            const hasAssignment = db.prepare("SELECT * FROM schedules WHERE employee_id = ? AND date = ?").get(e.id, date);
            return e.role === role && !hasAssignment;
          });
          
          const shuffled = available.sort(() => Math.random() - 0.5);
          for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
            const emp = shuffled[i];
            insertSchedule.run(emp.id, date, emp.preferred_start || '5 PM', 'working');
          }
        });
      });

      // 3. Fill Weekdays
      [0, 1, 2, 3].forEach(dayIdx => {
        const date = days[dayIdx];
        const dayType = 'weekday';
        
        const roles = [...new Set(employees.map(e => e.role))];
        roles.forEach(role => {
          const rule = rules.find(r => r.role === role && r.day_type === dayType);
          const minNeeded = rule ? rule.min_staff : 0;
          
          const assignedCount = db.prepare("SELECT COUNT(*) as count FROM schedules WHERE date = ? AND status = 'working' AND employee_id IN (SELECT id FROM employees WHERE role = ?)").get(date, role) as any;
          let needed = minNeeded - assignedCount.count;
          if (needed <= 0) return;

          const available = employees.filter(e => {
            const hasAssignment = db.prepare("SELECT * FROM schedules WHERE employee_id = ? AND date = ?").get(e.id, date);
            return e.role === role && !hasAssignment;
          });
          
          const shuffled = available.sort(() => Math.random() - 0.5);
          for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
            const emp = shuffled[i];
            insertSchedule.run(emp.id, date, emp.preferred_start || '5 PM', 'working');
          }
        });
      });

      // 4. Fill remaining slots with LIBRE
      employees.forEach(emp => {
        days.forEach(date => {
          const existing = db.prepare("SELECT * FROM schedules WHERE employee_id = ? AND date = ?").get(emp.id, date);
          if (!existing) {
            insertSchedule.run(emp.id, date, null, 'LIBRE');
          }
        });
      });
    })();

    res.json({ success: true });
  });

  app.post("/api/schedule/update", (req, res) => {
    const { employee_id, date, status, shift_start } = req.body;
    db.prepare(`
      INSERT INTO schedules (employee_id, date, status, shift_start) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(employee_id, date) DO UPDATE SET status=excluded.status, shift_start=excluded.shift_start
    `).run(employee_id, date, status, shift_start);
    // Note: Need a unique constraint for ON CONFLICT to work properly in this schema
    // Let's adjust the schema or just delete and insert
    db.prepare("DELETE FROM schedules WHERE employee_id = ? AND date = ?").run(employee_id, date);
    db.prepare("INSERT INTO schedules (employee_id, date, status, shift_start) VALUES (?, ?, ?, ?)").run(employee_id, date, status, shift_start);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
