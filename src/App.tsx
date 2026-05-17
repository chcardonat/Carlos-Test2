import React, { useState, useEffect } from 'react';
import type { TimeEntry } from './types';
import TodayView from './components/TodayView';
import ManagePanel from './components/ManagePanel';

type View = 'today' | 'manage';

export default function App() {
  const [view, setView] = useState<View>('today');
  const [orphan, setOrphan] = useState<TimeEntry | null>(null);
  const [orphanChecked, setOrphanChecked] = useState(false);

  useEffect(() => {
    window.api.getActiveEntry().then((entry) => {
      if (entry) setOrphan(entry);
      setOrphanChecked(true);
    });
  }, []);

  const handleResolveOrphan = async (action: 'close' | 'discard') => {
    if (!orphan) return;
    await window.api.resolveOrphan(orphan.id, action);
    setOrphan(null);
  };

  return (
    <div className="app">
      <nav className="app-nav">
        <span className="app-title">Time Tracker</span>
        <div className="nav-links">
          <button
            className={`nav-btn ${view === 'today' ? 'nav-btn--active' : ''}`}
            onClick={() => setView('today')}
          >
            Today
          </button>
          <button
            className={`nav-btn ${view === 'manage' ? 'nav-btn--active' : ''}`}
            onClick={() => setView('manage')}
          >
            Manage
          </button>
        </div>
      </nav>

      {orphanChecked && orphan && (
        <div className="orphan-banner">
          <p>
            The timer for <strong>{orphan.task_name}</strong>
            {orphan.project_name ? ` (${orphan.project_name})` : ''} was still
            running since{' '}
            <strong>
              {new Date(orphan.start_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </strong>
            . What would you like to do?
          </p>
          <div className="orphan-actions">
            <button className="btn btn--primary" onClick={() => handleResolveOrphan('close')}>
              Close it now
            </button>
            <button className="btn btn--danger" onClick={() => handleResolveOrphan('discard')}>
              Discard entry
            </button>
          </div>
        </div>
      )}

      <main className="app-main">
        {view === 'today' && orphanChecked && !orphan && <TodayView />}
        {view === 'manage' && <ManagePanel />}
      </main>
    </div>
  );
}
