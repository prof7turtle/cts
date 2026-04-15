'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { BuilderNodeData } from '../hookSchema';
import type { NodeExecStatus } from '../useExecutionEngine';
import NodeStatusBadge from './NodeStatusBadge';
import { PASTEL } from './pastelPalette';

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

function CustomHookNode({ data, selected }: NodeProps) {
  const typedData = (data ?? {}) as BuilderNodeData & { executionStatus?: NodeExecStatus };
  const label = typedData.label ?? 'Custom Hook';
  const subtitle = 'Custom Hook';
  const execClass = getExecClassName(typedData.executionStatus);
  const p = PASTEL.custom;

  return (
    <div
      className={`workflow-node custom-hook-node ${selected ? 'selected' : ''} ${execClass}`}
      style={{ position: 'relative' }}
    >
      <NodeStatusBadge status={typedData.executionStatus} />
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-white !shadow-sm"
        style={{ background: p.handle }}
      />

      <div
        className="node-header flex min-h-[3rem] items-center gap-3 rounded-t-[13px] border-b px-5 py-3 text-[13px] font-semibold leading-snug"
        style={{
          background: p.bg,
          color: p.fg,
          borderColor: p.border,
        }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-solid text-[11px] font-extrabold leading-none shadow-sm"
          style={{
            backgroundColor: p.bg,
            color: p.fg,
            borderColor: p.border,
          }}
        >
          CH
        </span>
        <span className="min-w-0 truncate tracking-tight" style={{ color: p.fg }}>
          {subtitle}
        </span>
      </div>

      <div className="node-body px-5 py-4">
        <div
          className="text-center text-[15px] font-semibold leading-snug tracking-tight"
          style={{ color: p.fg }}
        >
          {label}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-white !shadow-sm"
        style={{ background: p.handle }}
      />
    </div>
  );
}

export default memo(CustomHookNode);
