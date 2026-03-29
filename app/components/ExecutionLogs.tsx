'use client';

import { useEffect, useRef } from 'react';
import type { LogEntry, ExecutionState, NodeExecStatus } from './useExecutionEngine';

// ─── Status Badge ───────────────────────────────────────────────

const statusConfig: Record<NodeExecStatus, { icon: string; className: string }> = {
  idle: { icon: '⚪', className: 'log-badge-idle' },
  running: { icon: '⏳', className: 'log-badge-running' },
  completed: { icon: '✅', className: 'log-badge-completed' },
  error: { icon: '❌', className: 'log-badge-error' },
  skipped: { icon: '⏭', className: 'log-badge-skipped' },
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ─── Component ──────────────────────────────────────────────────

interface ExecutionLogsProps {
  logs: LogEntry[];
  executionState: ExecutionState;
  progress: { completed: number; total: number };
  onClear: () => void;
}

export default function ExecutionLogs({
  logs,
  executionState,
  progress,
  onClear,
}: ExecutionLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const stateLabel: Record<ExecutionState, { text: string; color: string }> = {
    idle: { text: 'IDLE', color: '#94a3b8' },
    running: { text: 'RUNNING', color: '#22c55e' },
    paused: { text: 'PAUSED', color: '#f59e0b' },
    completed: { text: 'COMPLETED', color: '#22c55e' },
    error: { text: 'ERROR', color: '#ef4444' },
  };

  const current = stateLabel[executionState];

  return (
    <div className="exec-logs-panel">
      {/* Header */}
      <div className="exec-logs-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 700, fontSize: '13px', color: '#e2e8f0' }}>
            Execution Logs
          </span>
          <span
            className="exec-state-badge"
            style={{ background: current.color }}
          >
            {current.text}
          </span>
          {progress.total > 0 && (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {progress.completed}/{progress.total} nodes
            </span>
          )}
        </div>
        <button
          type="button"
          className="exec-logs-clear-btn"
          onClick={onClear}
          title="Clear logs"
        >
          Clear
        </button>
      </div>

      {/* Progress bar */}
      {progress.total > 0 && (
        <div className="exec-progress-bar-track">
          <div
            className="exec-progress-bar-fill"
            style={{
              width: `${(progress.completed / progress.total) * 100}%`,
              background:
                executionState === 'error'
                  ? '#ef4444'
                  : executionState === 'completed'
                  ? '#22c55e'
                  : '#3b82f6',
            }}
          />
        </div>
      )}

      {/* Log entries */}
      <div className="exec-logs-scroll" ref={scrollRef}>
        {logs.length === 0 ? (
          <div className="exec-logs-empty">
            No logs yet. Click <strong>▶ Run</strong> to execute the workflow.
          </div>
        ) : (
          logs.map((entry) => {
            const cfg = statusConfig[entry.status];
            return (
              <div key={entry.id} className={`exec-log-entry ${cfg.className}`}>
                <span className="exec-log-time">{formatTime(entry.timestamp)}</span>
                <span className="exec-log-icon">{cfg.icon}</span>
                <span className="exec-log-node">{entry.nodeLabel}</span>
                <span className="exec-log-msg">{entry.message}</span>
                {entry.duration != null && (
                  <span className="exec-log-duration">{entry.duration}ms</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
