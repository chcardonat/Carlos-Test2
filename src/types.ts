export interface Project {
  id: number;
  name: string;
  archived_at: string | null;
  created_at: string;
}

export interface Task {
  id: number;
  name: string;
  project_id: number | null;
  project_name: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface TimeEntry {
  id: number;
  task_id: number;
  task_name: string;
  project_id: number | null;
  project_name: string | null;
  start_time: string;
  end_time: string | null;
  created_at: string;
}

export interface TaskSummary {
  task_id: number;
  task_name: string;
  project_id: number | null;
  project_name: string;
  total_minutes: number;
}

export interface ProjectSummary {
  project_id: number | null;
  project_name: string;
  total_minutes: number;
}

export interface TaskPerProjectSummary {
  project_id: number | null;
  project_name: string;
  tasks: TaskSummary[];
}

export interface TodaySummary {
  byTask: TaskSummary[];
  byProject: ProjectSummary[];
  byTaskPerProject: TaskPerProjectSummary[];
}

export interface Api {
  getProjects: () => Promise<Project[]>;
  createProject: (name: string) => Promise<Project>;
  updateProject: (id: number, name: string) => Promise<Project>;
  archiveProject: (id: number) => Promise<void>;

  getTasks: () => Promise<Task[]>;
  createTask: (name: string, projectId: number | null) => Promise<Task>;
  updateTask: (id: number, name: string, projectId: number | null) => Promise<Task>;
  archiveTask: (id: number) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  taskHasEntries: (id: number) => Promise<boolean>;

  startTask: (taskId: number) => Promise<TimeEntry>;
  stopCurrent: () => Promise<void>;
  pauseCurrent: () => Promise<void>;
  resumeTask: (taskId: number) => Promise<TimeEntry>;
  getActiveEntry: () => Promise<TimeEntry | null>;
  resolveOrphan: (entryId: number, action: 'close' | 'discard') => Promise<void>;

  getTodaySummary: () => Promise<TodaySummary>;
}

declare global {
  interface Window {
    api: Api;
  }
}
