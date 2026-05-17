import { contextBridge, ipcRenderer } from 'electron';
import type { Api } from './types';

const api: Api = {
  // Projects
  getProjects: () => ipcRenderer.invoke('getProjects'),
  createProject: (name) => ipcRenderer.invoke('createProject', name),
  updateProject: (id, name) => ipcRenderer.invoke('updateProject', id, name),
  archiveProject: (id) => ipcRenderer.invoke('archiveProject', id),

  // Tasks
  getTasks: () => ipcRenderer.invoke('getTasks'),
  createTask: (name, projectId) => ipcRenderer.invoke('createTask', name, projectId),
  updateTask: (id, name, projectId) => ipcRenderer.invoke('updateTask', id, name, projectId),
  archiveTask: (id) => ipcRenderer.invoke('archiveTask', id),
  deleteTask: (id) => ipcRenderer.invoke('deleteTask', id),
  taskHasEntries: (id) => ipcRenderer.invoke('taskHasEntries', id),

  // Timer
  startTask: (taskId) => ipcRenderer.invoke('startTask', taskId),
  stopCurrent: () => ipcRenderer.invoke('stopCurrent'),
  pauseCurrent: () => ipcRenderer.invoke('pauseCurrent'),
  resumeTask: (taskId) => ipcRenderer.invoke('resumeTask', taskId),
  getActiveEntry: () => ipcRenderer.invoke('getActiveEntry'),
  resolveOrphan: (entryId, action) => ipcRenderer.invoke('resolveOrphan', entryId, action),

  // Summary
  getTodaySummary: () => ipcRenderer.invoke('getTodaySummary'),
};

contextBridge.exposeInMainWorld('api', api);

