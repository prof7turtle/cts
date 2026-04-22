'use client';

import { useMemo, useState } from 'react';
import {
  nodeDefinitions,
  type ActionCategory,
  type NodeDefinition,
} from './nodes/nodeTypes';
import CustomHookModal from './CustomHookModal';

interface CustomHook {
  id: string;
  hookName: string;
  category: ActionCategory;
  functionName: string;
  moduleName: string;
  condition?: string;
  code: string;
}

interface NodesPanelProps {
  onDragStart: (event: React.DragEvent, nodeType: string, hookData?: CustomHook) => void;
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
  onDragStart: (event: React.DragEvent, nodeType: string, hookData?: CustomHook) => void;
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

function CustomHookTile({
  hook,
  onDragStart,
}: {
  hook: CustomHook;
  onDragStart: (event: React.DragEvent, nodeType: string, hookData?: CustomHook) => void;
}) {
  return (
    <button
      type="button"
      className="node-item"
      draggable
      onDragStart={(event) => onDragStart(event, `customHook-${hook.id}`, hook)}
      title={hook.functionName}
    >
      <span className="node-icon-badge" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' }}>
        CH
      </span>
      <span className="node-text">
        <span>{hook.hookName}</span>
        <small>{hook.functionName}</small>
        <span className="custom-badge">custom</span>
      </span>
    </button>
  );
}

export default function NodesPanel({ onDragStart }: NodesPanelProps) {
  const [query, setQuery] = useState('');
  const [customHooks, setCustomHooks] = useState<CustomHook[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const filteredCustomHooks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return customHooks;
    return customHooks.filter((hook) =>
      hook.hookName.toLowerCase().includes(normalizedQuery) ||
      hook.functionName.toLowerCase().includes(normalizedQuery)
    );
  }, [query, customHooks]);

  const handleCreateHook = (hook: Omit<CustomHook, 'id'>) => {
    const newHook: CustomHook = {
      ...hook,
      id: `custom-${Date.now()}`,
    };
    setCustomHooks((prev) => [...prev, newHook]);
    setIsModalOpen(false);
  };

  return (
    <aside className="nodes-panel">
      <h2>Action Library</h2>
      <input
        className="library-search"
        placeholder="Search actions..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {/* Custom Hooks Section */}
      <div>
        <div className="category-title">Custom Hooks</div>
        <button
          type="button"
          className="create-hook-btn"
          onClick={() => setIsModalOpen(true)}
        >
          + Create Hook
        </button>
        {filteredCustomHooks.map((hook) => (
          <CustomHookTile key={hook.id} hook={hook} onDragStart={onDragStart} />
        ))}
      </div>

      {groupedActions.map((group) => (
        <div key={group.category}>
          <div className="category-title">{group.category}</div>
          {group.actions.map((action) => (
            <ActionTile key={action.type} action={action} onDragStart={onDragStart} />
          ))}
        </div>
      ))}

      {groupedActions.length === 0 && filteredCustomHooks.length === 0 && (
        <p className="empty-library">No action found for this search.</p>
      )}

      {isModalOpen && (
        <CustomHookModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateHook}
        />
      )}
    </aside>
  );
}
