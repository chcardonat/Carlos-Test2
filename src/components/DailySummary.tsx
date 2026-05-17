import React, { useEffect, useState } from 'react';
import type { TodaySummary } from '../types';

interface Props {
  version: number; // increment to trigger a refresh
}

function fmt(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export default function DailySummary({ version }: Props) {
  const [summary, setSummary] = useState<TodaySummary | null>(null);

  useEffect(() => {
    window.api.getTodaySummary().then(setSummary);
  }, [version]);

  if (!summary) {
    return <div className="summary"><p>Loading…</p></div>;
  }

  if (summary.byTask.length === 0) {
    return (
      <div className="summary summary--empty">
        <h2 className="panel-title">Today's Summary</h2>
        <p className="summary-empty-text">No completed entries yet today.</p>
      </div>
    );
  }

  return (
    <div className="summary">
      <h2 className="panel-title">Today's Summary</h2>

      <section className="summary-section">
        <h3 className="summary-section-title">By Project</h3>
        <table className="summary-table">
          <tbody>
            {summary.byProject.map((p) => (
              <tr key={p.project_id ?? 'none'}>
                <td>{p.project_name}</td>
                <td className="summary-duration">{fmt(p.total_minutes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="summary-section">
        <h3 className="summary-section-title">By Task</h3>
        <table className="summary-table">
          <tbody>
            {summary.byTask.map((t) => (
              <tr key={t.task_id}>
                <td>{t.task_name}</td>
                <td className="summary-project-cell">{t.project_name || '—'}</td>
                <td className="summary-duration">{fmt(t.total_minutes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="summary-section">
        <h3 className="summary-section-title">By Task per Project</h3>
        {summary.byTaskPerProject.map((group) => (
          <div key={group.project_id ?? 'none'} className="summary-group">
            <div className="summary-group-header">{group.project_name}</div>
            <table className="summary-table">
              <tbody>
                {group.tasks.map((t) => (
                  <tr key={t.task_id}>
                    <td>{t.task_name}</td>
                    <td className="summary-duration">{fmt(t.total_minutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </div>
  );
}
