'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  nodeDefinitions,
  type ActionCategory,
  type NodeDefinition,
} from './nodes/nodeTypes';
import {
  getCustomHooks,
  subscribeToCustomHooks,
  type CustomHook,
} from './customHooksStore';

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
  onEdit,
}: {
  hook: CustomHook;
  onDragStart: (event: React.DragEvent, nodeType: string, hookData?: CustomHook) => void;
  onEdit: (hookId: string) => void;
}) {
  return (
    <div className="custom-hook-item-row">
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

      <button
        type="button"
        className="custom-hook-edit-btn"
        onClick={() => onEdit(hook.id)}
        title="Edit custom hook"
      >
        Edit
      </button>
    </div>
  );
}

export default function NodesPanel({ onDragStart }: NodesPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [customHooks, setCustomHooks] = useState<CustomHook[]>([]);

  useEffect(() => {
    setCustomHooks(getCustomHooks());

    return subscribeToCustomHooks(() => {
      setCustomHooks(getCustomHooks());
    });
  }, []);

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

  const handleEditHook = (hookId: string) => {
    router.push(`/custom-hooks/new?editId=${encodeURIComponent(hookId)}&returnTo=%2F%3Fview%3Dbuilder`);
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
          onClick={() => router.push('/custom-hooks/new?returnTo=%2F%3Fview%3Dbuilder')}
        >
          + Create Hook
        </button>
        {filteredCustomHooks.map((hook) => (
          <CustomHookTile
            key={hook.id}
            hook={hook}
            onDragStart={onDragStart}
            onEdit={handleEditHook}
          />
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
    </aside>
  );
}
