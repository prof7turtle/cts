'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { nodeDefinitionByType } from './nodeTypes';
import type { BuilderNodeData } from '../hookSchema';
import type { NodeExecStatus } from '../useExecutionEngine';
import CustomHookNode from './CustomHookNode';
import RequestNameLabelNode from './RequestNameLabelNode';

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

function BaseNode({ data, selected, type }: NodeProps) {
  const typedData = (data ?? {}) as BuilderNodeData & { executionStatus?: NodeExecStatus };
  const definition = nodeDefinitionByType[type ?? ''];
  const color = typedData.color ?? definition?.color ?? '#334155';
  const label = typedData.label ?? definition?.label ?? type ?? 'Action';
  const isDecision = type === 'ifCondition';
  const condition =
    typeof typedData.condition === 'string'
      ? typedData.condition
      : typeof typedData.condition?.expression === 'string'
        ? typedData.condition.expression
        : "Transaction.Type = 'Application'";

  const execClass = getExecClassName(typedData.executionStatus);

  return (
    <div className={`workflow-node ${selected ? 'selected' : ''} ${execClass}`} style={{ position: 'relative' }}>
      <StatusIndicator status={typedData.executionStatus} />
      <Handle type="target" position={Position.Top} style={{ background: color }} />

      <div className="node-header" style={{ background: color }}>
        <span className="node-icon-badge">{definition?.icon ?? 'AC'}</span>
        <span>{label}</span>
      </div>

      {isDecision && (
        <div className="node-body">
          <div className="decision-shape" style={{ borderColor: color }}>
            IF
          </div>
          <div className="node-label">Condition</div>
          <div className="node-condition">{condition}</div>
          <div className="decision-paths">
            <span>YES</span>
            <span>NO</span>
          </div>
        </div>
      )}

      {!isDecision && (
        <Handle type="source" position={Position.Bottom} style={{ background: color }} />
      )}

      {isDecision && (
        <>
          <Handle
            id="yes"
            type="source"
            position={Position.Bottom}
            style={{ background: '#16a34a', left: '30%' }}
          />
          <Handle
            id="no"
            type="source"
            position={Position.Bottom}
            style={{ background: '#dc2626', left: '70%' }}
          />
        </>
      )}
    </div>
  );
}

const MemoNode = memo(BaseNode);
MemoNode.displayName = 'MemoNode';

export const customNodeTypes = {
  ...Object.fromEntries(
    Object.keys(nodeDefinitionByType).map((type) => [type, MemoNode])
  ),
  customHook: CustomHookNode,
  requestNameLabel: RequestNameLabelNode,
};
