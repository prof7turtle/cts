'use client';

import type { NodeExecStatus } from '../useExecutionEngine';

const LABELS: Record<Exclude<NodeExecStatus, 'idle'>, string> = {
  running: 'Running',
  completed: 'Done',
  error: 'Error',
  skipped: 'Skipped',
};

const STYLES: Record<Exclude<NodeExecStatus, 'idle'>, string> = {
  running: 'border-blue-200 bg-blue-50 text-blue-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-red-200 bg-red-50 text-red-700',
  skipped: 'border-amber-200 bg-amber-50 text-amber-800',
};

type ActiveStatus = Exclude<NodeExecStatus, 'idle'>;

export default function NodeStatusBadge({ status }: { status?: NodeExecStatus }) {
  if (!status || status === 'idle') return null;
  const active: ActiveStatus = status;

  return (
    <span
      className={`pointer-events-none absolute -right-1 -top-1 z-10 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase leading-none tracking-wide shadow-sm ${STYLES[active]}`}
    >
      {LABELS[active]}
    </span>
  );
}
