import React, { useEffect, useState } from 'react';
import type { TimeEntry, Task } from '../types';

interface Props {
  activeEntry: TimeEntry | null;
  pausedTask: { id: number; name: string; project_name: string | null } | null;
  onStop: () => void;
  onPause: (task: Task) => void;
  onResume: () => void;
}

function formatElapsed(startIso: string): string {
  const diffMs = Date.now() - new Date(startIso).getTime();
  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export default function ActiveTimer({ activeEntry, pausedTask, onStop, onPause, onResume }: Props) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!activeEntry) {
      setElapsed('');
      return;
    }
    const update = () => setElapsed(formatElapsed(activeEntry.start_time));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [activeEntry]);

  const handleStop = async () => {
    await window.api.stopCurrent();
    onStop();
  };

  const handlePause = async () => {
    if (!activeEntry) return;
    await window.api.pauseCurrent();
    // Reconstruct a minimal Task shape for the callback.
    const task: Task = {
      id: activeEntry.task_id,
      name: activeEntry.task_name,
      project_id: activeEntry.project_id,
      project_name: activeEntry.project_name,
      archived_at: null,
      created_at: '',
    };
    onPause(task);
  };

  // ── Running state ──
  if (activeEntry) {
    return (
      <div className="active-timer active-timer--running">
        <div className="timer-info">
          <span className="timer-label">NOW TRACKING</span>
          <span className="timer-task">{activeEntry.task_name}</span>
          {activeEntry.project_name && (
            <span className="timer-project">{activeEntry.project_name}</span>
          )}
          <span className="timer-elapsed">{elapsed}</span>
        </div>
        <div className="timer-controls">
          <button className="btn btn--secondary" onClick={handlePause}>
            Pause
          </button>
          <button className="btn btn--danger" onClick={handleStop}>
            Stop
          </button>
        </div>
      </div>
    );
  }

  // ── Paused state ──
  if (pausedTask) {
    return (
      <div className="active-timer active-timer--paused">
        <div className="timer-info">
          <span className="timer-label">PAUSED</span>
          <span className="timer-task">{pausedTask.name}</span>
          {pausedTask.project_name && (
            <span className="timer-project">{pausedTask.project_name}</span>
          )}
        </div>
        <div className="timer-controls">
          <button className="btn btn--primary" onClick={onResume}>
            Resume
          </button>
          <button className="btn btn--danger" onClick={onStop}>
            Stop
          </button>
        </div>
      </div>
    );
  }

  // ── Idle state ──
  return (
    <div className="active-timer active-timer--idle">
      <span className="timer-idle-text">No task running — click a task to start</span>
    </div>
  );
}
