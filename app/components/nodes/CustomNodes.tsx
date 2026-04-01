'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { nodeDefinitionByType } from './nodeTypes';
import type { BuilderNodeData } from '../hookSchema';
import type { NodeExecStatus } from '../useExecutionEngine';
import CustomHookNode from './CustomHookNode';
import NodeStatusBadge from './NodeStatusBadge';
import { getPastelForCategory } from './pastelPalette';

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

function BaseNode({ data, selected, type }: NodeProps) {
  const typedData = (data ?? {}) as BuilderNodeData & { executionStatus?: NodeExecStatus };
  const definition = nodeDefinitionByType[type ?? ''];
  const pastel = getPastelForCategory(definition?.category);
  const label = typedData.label ?? definition?.label ?? type ?? 'Action';
  const isDecision = type === 'ifCondition';
  const condition =
    typeof typedData.condition === 'string'
      ? typedData.condition
      : "Transaction.Type = 'Application'";

  const execClass = getExecClassName(typedData.executionStatus);

  return (
    <div
      className={`workflow-node ${selected ? 'selected' : ''} ${execClass}`}
      style={{ position: 'relative' }}
    >
      <NodeStatusBadge status={typedData.executionStatus} />
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !border-2 !border-white !shadow-sm"
        style={{ background: pastel.handle }}
      />

      <div
        className="node-header flex min-h-[3rem] items-center gap-3 rounded-t-[13px] border-b px-5 py-3.5 text-[13px] font-semibold leading-snug"
        style={{
          background: pastel.bg,
          color: pastel.fg,
          borderColor: pastel.border,
        }}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-solid text-[11px] font-extrabold uppercase leading-none shadow-sm"
          style={{
            backgroundColor: pastel.bg,
            color: pastel.fg,
            borderColor: pastel.border,
          }}
        >
          {definition?.icon ?? 'AC'}
        </span>
        <span className="min-w-0 truncate tracking-tight" style={{ color: pastel.fg }}>
          {label}
        </span>
      </div>

      {isDecision && (
        <div className="node-body">
          <div className="decision-shape" style={{ borderColor: pastel.fg, color: pastel.fg }} />
          <div className="node-label" style={{ color: pastel.fg }}>
            Condition
          </div>
          <div className="node-condition" style={{ color: '#475569' }}>
            {condition}
          </div>
          <div className="decision-paths">
            <span>YES</span>
            <span>NO</span>
          </div>
        </div>
      )}

      {!isDecision && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-2.5 !w-2.5 !border-2 !border-white !shadow-sm"
          style={{ background: pastel.handle }}
        />
      )}

      {isDecision && (
        <>
          <Handle
            id="yes"
            type="source"
            position={Position.Bottom}
            className="!h-2.5 !w-2.5 !border-2 !border-white !shadow-sm"
            style={{ background: '#bbf7d0', left: '30%' }}
          />
          <Handle
            id="no"
            type="source"
            position={Position.Bottom}
            className="!h-2.5 !w-2.5 !border-2 !border-white !shadow-sm"
            style={{ background: '#fecaca', left: '70%' }}
          />
        </>
      )}
    </div>
  );
}

const MemoNode = memo(BaseNode);
MemoNode.displayName = 'MemoNode';

export const customNodeTypes = {
  ...Object.fromEntries(Object.keys(nodeDefinitionByType).map((type) => [type, MemoNode])),
  customHook: CustomHookNode,
};
