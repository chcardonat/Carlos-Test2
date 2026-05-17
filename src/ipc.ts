import { ipcMain } from 'electron';
import { getDb, persist } from './db';
import * as q from './queries';

export function registerIpcHandlers(): void {
  const db = getDb();

  // Projects
  ipcMain.handle('getProjects', () => q.getProjects(db));
  ipcMain.handle('createProject', (_e, name: string) => { const r = q.createProject(db, name); persist(); return r; });
  ipcMain.handle('updateProject', (_e, id: number, name: string) => { const r = q.updateProject(db, id, name); persist(); return r; });
  ipcMain.handle('archiveProject', (_e, id: number) => { q.archiveProject(db, id); persist(); });

  // Tasks
  ipcMain.handle('getTasks', () => q.getTasks(db));
  ipcMain.handle('createTask', (_e, name: string, projectId: number | null) => { const r = q.createTask(db, name, projectId); persist(); return r; });
  ipcMain.handle('updateTask', (_e, id: number, name: string, projectId: number | null) => { const r = q.updateTask(db, id, name, projectId); persist(); return r; });
  ipcMain.handle('archiveTask', (_e, id: number) => { q.archiveTask(db, id); persist(); });
  ipcMain.handle('deleteTask', (_e, id: number) => { q.deleteTask(db, id); persist(); });
  ipcMain.handle('taskHasEntries', (_e, id: number) => q.taskHasEntries(db, id));

  // Timer
  ipcMain.handle('startTask', (_e, taskId: number) => { const r = q.startTask(db, taskId); persist(); return r; });
  ipcMain.handle('stopCurrent', () => { q.stopCurrent(db); persist(); });
  ipcMain.handle('pauseCurrent', () => { q.pauseCurrent(db); persist(); });
  ipcMain.handle('resumeTask', (_e, taskId: number) => { const r = q.resumeTask(db, taskId); persist(); return r; });
  ipcMain.handle('getActiveEntry', () => q.getActiveEntry(db));
  ipcMain.handle('resolveOrphan', (_e, entryId: number, action: 'close' | 'discard') => { q.resolveOrphan(db, entryId, action); persist(); });

  // Summary
  ipcMain.handle('getTodaySummary', () => q.getTodaySummary(db));
}
