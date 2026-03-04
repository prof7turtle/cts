'use client';

import { useMemo, useState } from 'react';
import {
  nodeDefinitions,
  type ActionCategory,
  type NodeDefinition,
} from './nodes/nodeTypes';

interface NodesPanelProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

const categoryOrder: ActionCategory[] = [
  'Flow',
  'Decision',
  'Pre Hook',
  'Post Hook',
];

function ActionTile({
  action,
  onDragStart,
}: {
  action: NodeDefinition;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}) {
  return (
    <button
      type="button"
      className="node-item"
      draggable
      onDragStart={(event) => onDragStart(event, action.type)}
      title={action.functionName}
    >
      <span className="node-icon-badge" style={{ backgroundColor: action.color }}>
        {action.icon}
      </span>
      <span className="node-text">
        <span>{action.label}</span>
        <small>{action.functionName}</small>
      </span>
    </button>
  );
}

export default function NodesPanel({ onDragStart }: NodesPanelProps) {
  const [query, setQuery] = useState('');

  const groupedActions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = nodeDefinitions.filter((action) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        action.label.toLowerCase().includes(normalizedQuery) ||
        action.functionName.toLowerCase().includes(normalizedQuery)
      );
    });

    return categoryOrder
      .map((category) => ({
        category,
        actions: filtered.filter((action) => action.category === category),
      }))
      .filter((group) => group.actions.length > 0);
  }, [query]);

  return (
    <aside className="nodes-panel">
      <h2>Action Library</h2>
      <input
        className="library-search"
        placeholder="Search actions..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {groupedActions.map((group) => (
        <div key={group.category}>
          <div className="category-title">{group.category}</div>
          {group.actions.map((action) => (
            <ActionTile key={action.type} action={action} onDragStart={onDragStart} />
          ))}
        </div>
      ))}

      {groupedActions.length === 0 && (
        <p className="empty-library">No action found for this search.</p>
      )}
    </aside>
  );
}
