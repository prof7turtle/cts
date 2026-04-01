'use client';

import { useState } from 'react';
import WorkflowBuilder from './components/WorkflowBuilder';
import WorkflowList from './components/WorkflowList';

export default function HomePage() {
  const [view, setView] = useState<'list' | 'builder'>('list');

  return (
    <div className="flex h-[calc(100vh-3.75rem)] min-h-0 flex-col">
      <nav
        className="flex shrink-0 flex-col gap-4 border-b border-slate-200/90 bg-white/95 px-5 py-4 shadow-[inset_0_-1px_0_rgba(15,23,42,0.04)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-8"
        aria-label="Primary"
      >
        <p className="max-w-md text-[15px] leading-relaxed text-slate-600">
          Design and manage policy automation workflows
        </p>
        <div className="inline-flex shrink-0 rounded-xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`rounded-lg px-5 py-2 text-sm font-semibold tracking-tight transition-all duration-200 ${
              view === 'list'
                ? 'bg-white text-blue-700 shadow-md shadow-slate-200/80 ring-1 ring-slate-200/60'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            }`}
          >
            Workflows
          </button>
          <button
            type="button"
            onClick={() => setView('builder')}
            className={`rounded-lg px-5 py-2 text-sm font-semibold tracking-tight transition-all duration-200 ${
              view === 'builder'
                ? 'bg-white text-blue-700 shadow-md shadow-slate-200/80 ring-1 ring-slate-200/60'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            }`}
          >
            Builder
          </button>
        </div>
      </nav>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'list' ? <WorkflowList /> : <WorkflowBuilder />}
      </div>
    </div>
  );
}
