import React, { useEffect, useState } from 'react';
import type { Task, TimeEntry } from '../types';

interface Props {
  activeEntry: TimeEntry | null;
  onTaskStarted: (entry: TimeEntry) => void;
}

interface TaskGroup {
  project_id: number | null;
  project_name: string;
  tasks: Task[];
}

function groupTasks(tasks: Task[]): TaskGroup[] {
  const map = new Map<number | null, TaskGroup>();
  const order: (number | null)[] = [];

  for (const task of tasks) {
    const key = task.project_id;
    if (!map.has(key)) {
      map.set(key, {
        project_id: key,
        project_name: task.project_name ?? '(No Project)',
        tasks: [],
      });
      order.push(key);
    }
    map.get(key)!.tasks.push(task);
  }

  // Named projects first (alphabetical), then the no-project group.
  return order
    .map((k) => map.get(k)!)
    .sort((a, b) => {
      if (a.project_id === null) return 1;
      if (b.project_id === null) return -1;
      return a.project_name.localeCompare(b.project_name);
    });
}

export default function TaskList({ activeEntry, onTaskStarted }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    window.api.getTasks().then(setTasks);
  }, []);

  const handleClick = async (task: Task) => {
    if (activeEntry?.task_id === task.id) return; // already running
    const entry = await window.api.startTask(task.id);
    onTaskStarted(entry);
  };

  const groups = groupTasks(tasks);

  if (tasks.length === 0) {
    return (
      <div className="task-list task-list--empty">
        <p>
          No tasks yet. Go to <strong>Manage</strong> to add tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="task-list">
      <h2 className="panel-title">Tasks</h2>
      {groups.map((group) => (
        <div key={group.project_id ?? 'none'} className="task-group">
          <div className="task-group-header">{group.project_name}</div>
          {group.tasks.map((task) => {
            const isActive = activeEntry?.task_id === task.id;
            return (
              <button
                key={task.id}
                className={`task-item ${isActive ? 'task-item--active' : ''}`}
                onClick={() => handleClick(task)}
              >
                <span className="task-item-name">{task.name}</span>
                {isActive && <span className="task-item-dot" aria-label="active" />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
