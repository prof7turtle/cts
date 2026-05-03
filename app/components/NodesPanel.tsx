'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Pencil, Plus, GripVertical } from 'lucide-react';
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

const categoryOrder: ActionCategory[] = ['Flow', 'Decision', 'Pre Hook', 'Post Hook'];

const categoryMeta: Record<string, { color: string; dot: string }> = {
  Flow:        { color: '#6366f1', dot: '#818cf8' },
  Decision:    { color: '#d97706', dot: '#fbbf24' },
  'Pre Hook':  { color: '#059669', dot: '#34d399' },
  'Post Hook': { color: '#0284c7', dot: '#38bdf8' },
};

// ── ActionTile — uses <div draggable> to avoid nesting issues ───
function ActionTile({
  action,
  onDragStart,
}: {
  action: NodeDefinition;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="node-tile"
      draggable
      onDragStart={(e) => onDragStart(e, action.type)}
      title={action.functionName}
      aria-label={`Drag ${action.label} node`}
    >
      <span className="node-tile-badge" style={{ background: action.color }}>
        {action.icon}
      </span>
      <span className="node-tile-text">
        <span className="node-tile-label">{action.label}</span>
        <span className="node-tile-sub">{action.functionName}</span>
      </span>
      <GripVertical size={12} className="node-tile-grip" />
    </div>
  );
}

// ── CustomHookTile — <div draggable> with edit <button> inside ──
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
    <div
      role="button"
      tabIndex={0}
      className="node-tile node-tile-custom"
      draggable
      onDragStart={(e) => onDragStart(e, `customHook-${hook.id}`, hook)}
      title={hook.functionName}
      aria-label={`Drag custom hook ${hook.hookName}`}
    >
      <span className="node-tile-badge node-tile-badge-custom">CH</span>
      <span className="node-tile-text">
        <span className="node-tile-label">{hook.hookName}</span>
        <span className="node-tile-sub">{hook.functionName}</span>
        <span className="node-tile-custom-badge">custom</span>
      </span>
      <button
        type="button"
        className="node-tile-edit"
        onClick={(e) => { e.stopPropagation(); onEdit(hook.id); }}
        title="Edit hook"
        aria-label={`Edit ${hook.hookName}`}
      >
        <Pencil size={11} />
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
    return subscribeToCustomHooks(() => setCustomHooks(getCustomHooks()));
  }, []);

  const groupedActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = nodeDefinitions.filter(
      (a) => !q || a.label.toLowerCase().includes(q) || a.functionName.toLowerCase().includes(q)
    );
    return categoryOrder
      .map((cat) => ({ category: cat, actions: filtered.filter((a) => a.category === cat) }))
      .filter((g) => g.actions.length > 0);
  }, [query]);

  const filteredCustomHooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customHooks;
    return customHooks.filter(
      (h) => h.hookName.toLowerCase().includes(q) || h.functionName.toLowerCase().includes(q)
    );
  }, [query, customHooks]);

  const handleEditHook = (hookId: string) => {
    router.push(
      `/custom-hooks/new?editId=${encodeURIComponent(hookId)}&returnTo=%2F%3Fview%3Dbuilder`
    );
  };

  return (
    <aside className="nodes-panel">
      {/* Panel header */}
      <div className="nodes-panel-header">
        <span className="nodes-panel-title">Action Library</span>
      </div>

      {/* Search */}
      <div className="nodes-search-wrap">
        <Search size={13} className="nodes-search-icon" />
        <input
          className="library-search"
          placeholder="Search actions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search actions"
        />
      </div>

      {/* Scrollable content */}
      <div className="nodes-scroll">
        {/* Custom Hooks */}
        <div className="nodes-category-block">
          <div className="nodes-category-header">
            <span className="nodes-category-dot" style={{ background: '#8b5cf6' }} />
            <span className="nodes-category-label" style={{ color: '#6d28d9' }}>
              Custom Hooks
            </span>
            <button
              type="button"
              className="nodes-create-hook-btn"
              onClick={() => router.push('/custom-hooks/new?returnTo=%2F%3Fview%3Dbuilder')}
              title="Create custom hook"
            >
              <Plus size={11} /> New
            </button>
          </div>

          {filteredCustomHooks.length === 0 && !query && (
            <p className="nodes-empty-hint">No custom hooks yet.</p>
          )}
          {filteredCustomHooks.map((hook) => (
            <CustomHookTile
              key={hook.id}
              hook={hook}
              onDragStart={onDragStart}
              onEdit={handleEditHook}
            />
          ))}
        </div>

        {/* Node categories */}
        {groupedActions.map((group) => {
          const meta = categoryMeta[group.category] ?? { color: '#64748b', dot: '#94a3b8' };
          return (
            <div key={group.category} className="nodes-category-block">
              <div className="nodes-category-header">
                <span className="nodes-category-dot" style={{ background: meta.dot }} />
                <span className="nodes-category-label" style={{ color: meta.color }}>
                  {group.category}
                </span>
                <span className="nodes-category-count">{group.actions.length}</span>
              </div>
              {group.actions.map((action) => (
                <ActionTile key={action.type} action={action} onDragStart={onDragStart} />
              ))}
            </div>
          );
        })}

        {groupedActions.length === 0 && filteredCustomHooks.length === 0 && (
          <p className="nodes-empty-hint" style={{ textAlign: 'center', padding: '24px 12px' }}>
            No actions match &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </aside>
  );
}
