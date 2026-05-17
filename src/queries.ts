import type { Database } from 'sql.js';
import type { Project, Task, TimeEntry, TaskSummary, ProjectSummary, TaskPerProjectSummary, TodaySummary } from './types';

// ─── sql.js helpers ────────────────────────────────────────────────────────
// sql.js keeps data in memory; callers must call persist() after writes.

function sqlAll<T>(db: Database, sql: string, params: (string | number | null)[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

function sqlGet<T>(db: Database, sql: string, params: (string | number | null)[] = []): T | null {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject() as unknown as T;
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function sqlInsert(db: Database, sql: string, params: (string | number | null)[] = []): number {
  db.run(sql, params);
  const result = db.exec('SELECT last_insert_rowid()');
  return (result[0]?.values[0]?.[0] as number) ?? 0;
}

// Returns current time truncated to the minute as ISO 8601 UTC.
function nowMinute(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

const TASK_JOIN = `
  tasks t LEFT JOIN projects p ON t.project_id = p.id
`;

const ENTRY_JOIN = `
  time_entries e
  JOIN tasks t ON e.task_id = t.id
  LEFT JOIN projects p ON t.project_id = p.id
`;

// ─── Projects ──────────────────────────────────────────────────────────────

export function getProjects(db: Database): Project[] {
  return sqlAll<Project>(db, 'SELECT * FROM projects WHERE archived_at IS NULL ORDER BY name');
}

export function createProject(db: Database, name: string): Project {
  const id = sqlInsert(db, `INSERT INTO projects (name, created_at) VALUES (?, strftime('%Y-%m-%dT%H:%M:00Z', 'now'))`, [name.trim()]);
  return sqlGet<Project>(db, 'SELECT * FROM projects WHERE id = ?', [id])!;
}

export function updateProject(db: Database, id: number, name: string): Project {
  db.run('UPDATE projects SET name = ? WHERE id = ?', [name.trim(), id]);
  return sqlGet<Project>(db, 'SELECT * FROM projects WHERE id = ?', [id])!;
}

export function archiveProject(db: Database, id: number): void {
  db.run('UPDATE tasks SET project_id = NULL WHERE project_id = ?', [id]);
  db.run(`UPDATE projects SET archived_at = strftime('%Y-%m-%dT%H:%M:00Z', 'now') WHERE id = ?`, [id]);
}

// ─── Tasks ─────────────────────────────────────────────────────────────────

export function getTasks(db: Database): Task[] {
  return sqlAll<Task>(
    db,
    `SELECT t.*, p.name AS project_name FROM ${TASK_JOIN} WHERE t.archived_at IS NULL ORDER BY p.name NULLS LAST, t.name`,
  );
}

export function createTask(db: Database, name: string, projectId: number | null): Task {
  const id = sqlInsert(
    db,
    `INSERT INTO tasks (name, project_id, created_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:00Z', 'now'))`,
    [name.trim(), projectId ?? null],
  );
  return sqlGet<Task>(db, `SELECT t.*, p.name AS project_name FROM ${TASK_JOIN} WHERE t.id = ?`, [id])!;
}

export function updateTask(db: Database, id: number, name: string, projectId: number | null): Task {
  db.run('UPDATE tasks SET name = ?, project_id = ? WHERE id = ?', [name.trim(), projectId ?? null, id]);
  return sqlGet<Task>(db, `SELECT t.*, p.name AS project_name FROM ${TASK_JOIN} WHERE t.id = ?`, [id])!;
}

export function archiveTask(db: Database, id: number): void {
  db.run(`UPDATE tasks SET archived_at = strftime('%Y-%m-%dT%H:%M:00Z', 'now') WHERE id = ?`, [id]);
}

export function deleteTask(db: Database, id: number): void {
  db.run('DELETE FROM tasks WHERE id = ?', [id]);
}

export function taskHasEntries(db: Database, id: number): boolean {
  const row = sqlGet<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM time_entries WHERE task_id = ?', [id]);
  return (row?.count ?? 0) > 0;
}

// ─── Time Entries ──────────────────────────────────────────────────────────

const ENTRY_SELECT = `SELECT e.*, t.name AS task_name, t.project_id, p.name AS project_name FROM ${ENTRY_JOIN}`;

export function getActiveEntry(db: Database): TimeEntry | null {
  return sqlGet<TimeEntry>(db, `${ENTRY_SELECT} WHERE e.end_time IS NULL LIMIT 1`);
}

function closeActive(db: Database, now: string): void {
  db.run('UPDATE time_entries SET end_time = ? WHERE end_time IS NULL', [now]);
}

export function startTask(db: Database, taskId: number): TimeEntry {
  const now = nowMinute();
  closeActive(db, now);
  const id = sqlInsert(
    db,
    `INSERT INTO time_entries (task_id, start_time, created_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:00Z', 'now'))`,
    [taskId, now],
  );
  return sqlGet<TimeEntry>(db, `${ENTRY_SELECT} WHERE e.id = ?`, [id])!;
}

export function stopCurrent(db: Database): void {
  closeActive(db, nowMinute());
}

export function pauseCurrent(db: Database): void {
  closeActive(db, nowMinute());
}

// Resume: same as startTask — close any running entry, open a new one.
export function resumeTask(db: Database, taskId: number): TimeEntry {
  return startTask(db, taskId);
}

export function resolveOrphan(db: Database, entryId: number, action: 'close' | 'discard'): void {
  if (action === 'close') {
    db.run('UPDATE time_entries SET end_time = ? WHERE id = ? AND end_time IS NULL', [nowMinute(), entryId]);
  } else {
    db.run('DELETE FROM time_entries WHERE id = ?', [entryId]);
  }
}

// ─── Summary ───────────────────────────────────────────────────────────────

const DURATION = `CAST((julianday(e.end_time) - julianday(e.start_time)) * 1440 AS INTEGER)`;
const TODAY = `date(e.start_time, 'localtime') = date('now', 'localtime')`;

export function getTodaySummary(db: Database): TodaySummary {
  const byTask = sqlAll<TaskSummary>(
    db,
    `SELECT
      t.id  AS task_id,
      t.name AS task_name,
      t.project_id,
      COALESCE(p.name, '') AS project_name,
      SUM(${DURATION}) AS total_minutes
    FROM ${ENTRY_JOIN}
    WHERE ${TODAY} AND e.end_time IS NOT NULL AND ${DURATION} >= 1
    GROUP BY t.id
    ORDER BY total_minutes DESC`,
  );

  const byProject = sqlAll<ProjectSummary>(
    db,
    `SELECT
      t.project_id,
      COALESCE(p.name, '(No Project)') AS project_name,
      SUM(${DURATION}) AS total_minutes
    FROM ${ENTRY_JOIN}
    WHERE ${TODAY} AND e.end_time IS NOT NULL AND ${DURATION} >= 1
    GROUP BY t.project_id
    ORDER BY total_minutes DESC`,
  );

  // Group tasks by project from byTask results.
  const projectMap = new Map<number | null, TaskPerProjectSummary>();
  const orderedKeys: (number | null)[] = [];

  for (const task of byTask) {
    const key = task.project_id;
    if (!projectMap.has(key)) {
      projectMap.set(key, {
        project_id: key,
        project_name: task.project_name || '(No Project)',
        tasks: [],
      });
      orderedKeys.push(key);
    }
    projectMap.get(key)!.tasks.push(task);
  }

  const byTaskPerProject = orderedKeys.map((k) => projectMap.get(k)!).filter(Boolean);

  return { byTask, byProject, byTaskPerProject };
}

