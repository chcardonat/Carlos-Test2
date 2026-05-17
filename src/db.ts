import type { SqlJsStatic, Database } from 'sql.js';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

let db: Database | null = null;
let dbPath = '';

export async function initDb(): Promise<void> {
  // Locate the sql.js WASM file next to the sql.js entry module.
  const sqlJsDir = path.dirname(require.resolve('sql.js'));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const initSqlJs: (config?: object) => Promise<SqlJsStatic> = require('sql.js');
  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(sqlJsDir, file),
  });

  dbPath = path.join(app.getPath('userData'), 'timetracker.db');

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  runSchema();
  persist(); // write initial empty DB to disk if new
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

/** Flush in-memory database to disk. Call after every write. */
export function persist(): void {
  if (!db || !dbPath) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function runSchema(): void {
  if (!db) return;
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL UNIQUE CHECK(length(name) <= 50),
      archived_at TEXT    NULL,
      created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL CHECK(length(name) <= 50),
      project_id  INTEGER NULL REFERENCES projects(id) ON DELETE SET NULL,
      archived_at TEXT    NULL,
      created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now')),
      UNIQUE(name, project_id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      start_time  TEXT    NOT NULL,
      end_time    TEXT    NULL,
      created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:00Z', 'now'))
    )
  `);
}
