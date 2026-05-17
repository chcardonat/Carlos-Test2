import React, { useState, useCallback } from 'react';
import type { TimeEntry, Task } from '../types';
import ActiveTimer from './ActiveTimer';
import TaskList from './TaskList';
import DailySummary from './DailySummary';

export default function TodayView() {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  // Tracks the last paused task so the user can resume it.
  const [pausedTask, setPausedTask] = useState<{ id: number; name: string; project_name: string | null } | null>(null);
  const [summaryVersion, setSummaryVersion] = useState(0);

  const refreshSummary = useCallback(() => setSummaryVersion((v) => v + 1), []);

  const handleTimerStarted = useCallback(
    (entry: TimeEntry) => {
      setActiveEntry(entry);
      setPausedTask(null);
      refreshSummary();
    },
    [refreshSummary],
  );

  const handleTimerStopped = useCallback(() => {
    setActiveEntry(null);
    setPausedTask(null);
    refreshSummary();
  }, [refreshSummary]);

  const handleTimerPaused = useCallback(
    (task: Task) => {
      setActiveEntry(null);
      setPausedTask({ id: task.id, name: task.name, project_name: task.project_name ?? null });
      refreshSummary();
    },
    [refreshSummary],
  );

  const handleResume = useCallback(async () => {
    if (!pausedTask) return;
    const entry = await window.api.resumeTask(pausedTask.id);
    setActiveEntry(entry);
    setPausedTask(null);
    refreshSummary();
  }, [pausedTask, refreshSummary]);

  return (
    <div className="today-view">
      <ActiveTimer
        activeEntry={activeEntry}
        pausedTask={pausedTask}
        onStop={handleTimerStopped}
        onPause={handleTimerPaused}
        onResume={handleResume}
      />
      <div className="today-columns">
        <div className="today-left">
          <TaskList
            activeEntry={activeEntry}
            onTaskStarted={handleTimerStarted}
          />
        </div>
        <div className="today-right">
          <DailySummary version={summaryVersion} />
        </div>
      </div>
    </div>
  );
}
