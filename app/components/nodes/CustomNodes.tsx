'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { nodeDefinitionByType } from './nodeTypes';

type BuilderNodeData = {
  label?: string;
  condition?: string;
  color?: string;
};

function BaseNode({ data, selected, type }: NodeProps) {
  const typedData = (data ?? {}) as BuilderNodeData;
  const definition = nodeDefinitionByType[type ?? ''];
  const color = typedData.color ?? definition?.color ?? '#334155';
  const label = typedData.label ?? definition?.label ?? type ?? 'Action';
  const isDecision = type === 'ifCondition';
  const condition =
    typedData.condition ?? "Transaction.Type = 'Application'";

  return (
    <div className={`workflow-node ${selected ? 'selected' : ''}`}>
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

export const customNodeTypes = Object.fromEntries(
  Object.keys(nodeDefinitionByType).map((type) => [type, MemoNode])
);
