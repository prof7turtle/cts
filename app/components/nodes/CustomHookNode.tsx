'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { BuilderNodeData } from '../hookSchema';
import type { NodeExecStatus } from '../useExecutionEngine';

function getExecClassName(status: NodeExecStatus | undefined): string {
  switch (status) {
    case 'running':
      return 'node-executing';
    case 'completed':
      return 'node-completed';
    case 'error':
      return 'node-error';
    default:
      return '';
  }
}

function StatusIndicator({ status }: { status?: NodeExecStatus }) {
  if (!status || status === 'idle') return null;

  const config: Record<string, { bg: string; icon: string }> = {
    running: { bg: '#3b82f6', icon: '⏳' },
    completed: { bg: '#22c55e', icon: '✓' },
    error: { bg: '#ef4444', icon: '✕' },
    skipped: { bg: '#f59e0b', icon: '⏭' },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <div
      className="node-status-indicator"
      style={{ background: c.bg }}
    >
      {c.icon}
    </div>
  );
}

function CustomHookNode({ data, selected }: NodeProps) {
  const typedData = (data ?? {}) as BuilderNodeData & { executionStatus?: NodeExecStatus };
  const label = typedData.label ?? 'Custom Hook';
  const execClass = getExecClassName(typedData.executionStatus);

  return (
    <div className={`workflow-node custom-hook-node ${selected ? 'selected' : ''} ${execClass}`} style={{ position: 'relative' }}>
      <StatusIndicator status={typedData.executionStatus} />
      <Handle type="target" position={Position.Top} style={{ background: '#8b5cf6' }} />

      <div className="node-header" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
        <span className="node-icon-badge">CH</span>
        <span>{label}</span>
      </div>

      <div className="node-body">
        <div className="custom-hook-subtitle">Custom Hook</div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#8b5cf6' }} />
    </div>
  );
}

export default memo(CustomHookNode);