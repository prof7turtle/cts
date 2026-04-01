'use client';

import { useMemo, useState } from 'react';
import {
  nodeDefinitions,
  type ActionCategory,
  type NodeDefinition,
} from './nodes/nodeTypes';
import CustomHookModal from './CustomHookModal';
import { getPastelForSectionTitle, type PastelSet } from './nodes/pastelPalette';

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

const GROUPS: { title: string; categories: ActionCategory[] }[] = [
  { title: 'Flow', categories: ['Flow'] },
  { title: 'Decision', categories: ['Decision'] },
  { title: 'Hooks', categories: ['Pre Hook', 'Post Hook'] },
];

/** Hover / ring accents aligned with each section’s pastel family */
const SECTION_TILE_ACCENT: Record<string, string> = {
  Flow: 'hover:border-emerald-200 hover:from-white hover:to-emerald-50/60 hover:shadow-emerald-100/40 hover:ring-emerald-100/50',
  Decision: 'hover:border-amber-200 hover:from-white hover:to-amber-50/60 hover:shadow-amber-100/40 hover:ring-amber-100/50',
  Hooks: 'hover:border-sky-200 hover:from-white hover:to-sky-50/60 hover:shadow-sky-100/40 hover:ring-sky-100/50',
};

const SECTION_TITLE_STYLE: Record<string, string> = {
  'Custom hooks': 'text-violet-800/70',
  Flow: 'text-emerald-800/70',
  Decision: 'text-amber-900/60',
  Hooks: 'text-sky-900/60',
};

function tileBase(sectionTitle: string) {
  const accent = SECTION_TILE_ACCENT[sectionTitle] ?? SECTION_TILE_ACCENT.Hooks;
  return `group relative flex w-full cursor-grab items-start gap-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm ring-1 ring-slate-900/[0.02] transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-gradient-to-br hover:shadow-lg ${accent} active:translate-y-0 active:cursor-grabbing`;
}

function ActionTile({
  action,
  sectionTitle,
  pastel,
  onDragStart,
}: {
  action: NodeDefinition;
  sectionTitle: string;
  pastel: PastelSet;
  onDragStart: (event: React.DragEvent, nodeType: string, hookData?: CustomHook) => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => onDragStart(event, action.type)}
      title={action.functionName}
      className={tileBase(sectionTitle)}
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums transition-all duration-300 ease-out group-hover:scale-110 group-hover:shadow-md"
        style={{
          backgroundColor: pastel.bg,
          color: pastel.fg,
          boxShadow: `0 4px 12px -2px ${pastel.shadow}`,
        }}
      >
        {action.icon}
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-[15px] font-semibold leading-snug tracking-tight text-slate-800">
          {action.label}
        </span>
        <span className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">
          {action.functionName}
        </span>
      </span>
    </button>
  );
}

function CustomHookTile({
  hook,
  pastel,
  onDragStart,
}: {
  hook: CustomHook;
  pastel: PastelSet;
  onDragStart: (event: React.DragEvent, nodeType: string, hookData?: CustomHook) => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => onDragStart(event, `customHook-${hook.id}`, hook)}
      title={hook.functionName}
      className="group relative flex w-full cursor-grab items-start gap-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm ring-1 ring-slate-900/[0.02] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-violet-200 hover:bg-gradient-to-br hover:from-white hover:to-violet-50/50 hover:shadow-lg hover:shadow-violet-100/40 hover:ring-violet-100/50 active:translate-y-0 active:cursor-grabbing"
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold tracking-wide transition-all duration-300 ease-out group-hover:scale-110 group-hover:shadow-md"
        style={{
          backgroundColor: pastel.bg,
          color: pastel.fg,
          boxShadow: `0 4px 12px -2px ${pastel.shadow}`,
        }}
      >
        CH
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="block text-[15px] font-semibold leading-snug tracking-tight text-slate-800">
          {hook.hookName}
        </span>
        <span className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">
          {hook.functionName}
        </span>
        <span
          className="mt-3 inline-flex min-h-[1.75rem] items-center rounded-full border border-solid px-3 py-1.5 text-[10px] font-bold uppercase leading-none tracking-wider shadow-sm transition-colors"
          style={{
            background: pastel.bg,
            color: pastel.fg,
            borderColor: pastel.border,
          }}
        >
          Custom
        </span>
      </span>
    </button>
  );
}

function SectionTitle({ children, sectionKey }: { children: React.ReactNode; sectionKey: string }) {
  const cls = SECTION_TITLE_STYLE[sectionKey] ?? 'text-slate-500';
  return (
    <h3 className={`mb-3 text-[11px] font-bold uppercase tracking-[0.12em] ${cls}`}>{children}</h3>
  );
}

export default function NodesPanel({ onDragStart }: NodesPanelProps) {
  const [query, setQuery] = useState('');
  const [customHooks, setCustomHooks] = useState<CustomHook[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const customPastel = getPastelForSectionTitle('Custom hooks');

  const groupedActions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = nodeDefinitions.filter((action) => {
      if (!normalizedQuery) return true;
      return (
        action.label.toLowerCase().includes(normalizedQuery) ||
        action.functionName.toLowerCase().includes(normalizedQuery)
      );
    });

    return GROUPS.map((group) => ({
      title: group.title,
      actions: filtered.filter((action) => group.categories.includes(action.category)),
    })).filter((g) => g.actions.length > 0);
  }, [query]);

  const filteredCustomHooks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return customHooks;
    return customHooks.filter(
      (hook) =>
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
    <aside className="nodes-panel flex w-[min(100%,340px)] shrink-0 flex-col overflow-y-auto border-r border-slate-200/80 bg-gradient-to-b from-emerald-50/20 via-white to-violet-50/15 shadow-[4px_0_24px_-12px_rgba(15,23,42,0.06)]">
      <div className="sticky top-0 z-[1] border-b border-slate-200/70 bg-white/90 px-6 pb-5 pt-6 backdrop-blur-md">
        <h2 className="text-lg font-semibold tracking-tight text-slate-800">Action library</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          Drag a block onto the canvas to build your flow
        </p>
        <input
          className="library-search mt-5"
          placeholder="Search by name…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search actions"
        />
      </div>

      <div className="flex flex-col gap-8 px-6 py-8">
        <section>
          <SectionTitle sectionKey="Custom hooks">Custom hooks</SectionTitle>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mb-4 w-full rounded-2xl border border-violet-200/80 px-5 py-4 text-sm font-semibold leading-snug shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.99]"
            style={{
              background: customPastel.bg,
              color: customPastel.fg,
              boxShadow: `0 4px 14px -4px ${customPastel.shadow}`,
            }}
          >
            + Create hook
          </button>
          <div className="flex flex-col gap-3">
            {filteredCustomHooks.map((hook) => (
              <CustomHookTile
                key={hook.id}
                hook={hook}
                pastel={customPastel}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        </section>

        {groupedActions.map((group) => {
          const pastel = getPastelForSectionTitle(group.title);
          return (
            <section key={group.title}>
              <SectionTitle sectionKey={group.title}>{group.title}</SectionTitle>
              <div className="flex flex-col gap-3">
                {group.actions.map((action) => (
                  <ActionTile
                    key={action.type}
                    action={action}
                    sectionTitle={group.title}
                    pastel={pastel}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {groupedActions.length === 0 && filteredCustomHooks.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center text-[13px] leading-relaxed text-slate-500">
            No actions match your search. Try another term.
          </p>
        )}
      </div>

      {isModalOpen && (
        <CustomHookModal onClose={() => setIsModalOpen(false)} onCreate={handleCreateHook} />
      )}
    </aside>
  );
}
