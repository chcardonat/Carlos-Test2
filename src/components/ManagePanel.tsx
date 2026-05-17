import React, { useEffect, useState } from 'react';
import type { Project, Task } from '../types';

const MAX = 50;

export default function ManagePanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Project form
  const [newProjectName, setNewProjectName] = useState('');
  const [projectError, setProjectError] = useState('');
  const [editingProject, setEditingProject] = useState<{ id: number; name: string } | null>(null);

  // Task form
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState<number | null>(null);
  const [taskError, setTaskError] = useState('');
  const [editingTask, setEditingTask] = useState<{
    id: number;
    name: string;
    project_id: number | null;
  } | null>(null);

  const reload = async () => {
    const [p, t] = await Promise.all([window.api.getProjects(), window.api.getTasks()]);
    setProjects(p);
    setTasks(t);
  };

  useEffect(() => { reload(); }, []);

  // ─── Project handlers ─────────────────────────────────────────────────────

  const addProject = async () => {
    const name = newProjectName.trim();
    if (!name) return;
    if (name.length > MAX) { setProjectError(`Max ${MAX} characters`); return; }
    try {
      await window.api.createProject(name);
      setNewProjectName('');
      setProjectError('');
      reload();
    } catch (e: unknown) {
      setProjectError(e instanceof Error ? e.message : 'Could not create project');
    }
  };

  const saveProject = async () => {
    if (!editingProject) return;
    const name = editingProject.name.trim();
    if (!name) return;
    if (name.length > MAX) { setProjectError(`Max ${MAX} characters`); return; }
    try {
      await window.api.updateProject(editingProject.id, name);
      setEditingProject(null);
      setProjectError('');
      reload();
    } catch (e: unknown) {
      setProjectError(e instanceof Error ? e.message : 'Could not update project');
    }
  };

  const archiveProject = async (id: number) => {
    if (!confirm('Archive this project? Its tasks will become unassigned but all time entries are preserved.')) return;
    await window.api.archiveProject(id);
    reload();
  };

  // ─── Task handlers ────────────────────────────────────────────────────────

  const addTask = async () => {
    const name = newTaskName.trim();
    if (!name) return;
    if (name.length > MAX) { setTaskError(`Max ${MAX} characters`); return; }
    try {
      await window.api.createTask(name, newTaskProjectId);
      setNewTaskName('');
      setNewTaskProjectId(null);
      setTaskError('');
      reload();
    } catch (e: unknown) {
      setTaskError(e instanceof Error ? e.message : 'Could not create task');
    }
  };

  const saveTask = async () => {
    if (!editingTask) return;
    const name = editingTask.name.trim();
    if (!name) return;
    if (name.length > MAX) { setTaskError(`Max ${MAX} characters`); return; }
    try {
      await window.api.updateTask(editingTask.id, name, editingTask.project_id);
      setEditingTask(null);
      setTaskError('');
      reload();
    } catch (e: unknown) {
      setTaskError(e instanceof Error ? e.message : 'Could not update task');
    }
  };

  const archiveTask = async (id: number) => {
    if (!confirm('Archive this task? It will be hidden from the task list but its time entries are preserved.')) return;
    await window.api.archiveTask(id);
    reload();
  };

  const deleteTask = async (task: Task) => {
    const hasEntries = await window.api.taskHasEntries(task.id);
    const msg = hasEntries
      ? `Delete "${task.name}"? This will also delete all its time entries. This cannot be undone.`
      : `Delete "${task.name}"?`;
    if (!confirm(msg)) return;
    await window.api.deleteTask(task.id);
    reload();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="manage-panel">
      {/* ── Projects ── */}
      <section className="manage-section">
        <h2 className="panel-title">Projects</h2>

        <div className="manage-add-row">
          <input
            className="manage-input"
            type="text"
            placeholder="New project name"
            value={newProjectName}
            maxLength={MAX}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addProject()}
          />
          <button className="btn btn--primary" onClick={addProject} disabled={!newProjectName.trim()}>
            Add
          </button>
        </div>
        {projectError && <div className="manage-error">{projectError}</div>}

        <ul className="manage-list">
          {projects.length === 0 && (
            <li className="manage-empty">No projects yet</li>
          )}
          {projects.map((project) =>
            editingProject?.id === project.id ? (
              <li key={project.id} className="manage-item">
                <div className="manage-edit-row">
                  <input
                    className="manage-input"
                    type="text"
                    value={editingProject.name}
                    maxLength={MAX}
                    autoFocus
                    onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveProject();
                      if (e.key === 'Escape') setEditingProject(null);
                    }}
                  />
                  <button className="btn btn--primary" onClick={saveProject}>Save</button>
                  <button className="btn btn--secondary" onClick={() => setEditingProject(null)}>Cancel</button>
                </div>
              </li>
            ) : (
              <li key={project.id} className="manage-item">
                <span className="manage-item-name">{project.name}</span>
                <div className="manage-item-actions">
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => setEditingProject({ id: project.id, name: project.name })}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => archiveProject(project.id)}
                  >
                    Archive
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>

      {/* ── Tasks ── */}
      <section className="manage-section">
        <h2 className="panel-title">Tasks</h2>

        <div className="manage-add-row">
          <input
            className="manage-input"
            type="text"
            placeholder="New task name"
            value={newTaskName}
            maxLength={MAX}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
          <select
            className="manage-select"
            value={newTaskProjectId ?? ''}
            onChange={(e) =>
              setNewTaskProjectId(e.target.value === '' ? null : parseInt(e.target.value))
            }
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button className="btn btn--primary" onClick={addTask} disabled={!newTaskName.trim()}>
            Add
          </button>
        </div>
        {taskError && <div className="manage-error">{taskError}</div>}

        <ul className="manage-list">
          {tasks.length === 0 && (
            <li className="manage-empty">No tasks yet</li>
          )}
          {tasks.map((task) =>
            editingTask?.id === task.id ? (
              <li key={task.id} className="manage-item">
                <div className="manage-edit-row">
                  <input
                    className="manage-input"
                    type="text"
                    value={editingTask.name}
                    maxLength={MAX}
                    autoFocus
                    onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTask();
                      if (e.key === 'Escape') setEditingTask(null);
                    }}
                  />
                  <select
                    className="manage-select"
                    value={editingTask.project_id ?? ''}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        project_id: e.target.value === '' ? null : parseInt(e.target.value),
                      })
                    }
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn--primary" onClick={saveTask}>Save</button>
                  <button className="btn btn--secondary" onClick={() => setEditingTask(null)}>Cancel</button>
                </div>
              </li>
            ) : (
              <li key={task.id} className="manage-item">
                <div className="manage-item-meta">
                  <span className="manage-item-name">{task.name}</span>
                  {task.project_name && (
                    <span className="manage-item-project">{task.project_name}</span>
                  )}
                </div>
                <div className="manage-item-actions">
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() =>
                      setEditingTask({ id: task.id, name: task.name, project_id: task.project_id })
                    }
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => archiveTask(task.id)}
                  >
                    Archive
                  </button>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => deleteTask(task)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  );
}
