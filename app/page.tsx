'use client';

import { useState } from 'react';
import WorkflowBuilder from './components/WorkflowBuilder';
import WorkflowList from './components/WorkflowList';

export default function HomePage() {
  const [view, setView] = useState<'list' | 'builder'>('list');

  return (
    <div className="flex h-[calc(100vh-3.75rem)] min-h-0 flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#f3f6fb_100%)]">
      <nav
        className="border-b border-slate-200/70 bg-white/80 px-8 py-4 backdrop-blur-md sm:px-10"
        aria-label="Primary"
      >
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Studio
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Design and manage policy automation workflows
            </p>
          </div>
          <div className="inline-flex w-fit self-start rounded-2xl border border-slate-200 bg-slate-100/90 p-1.5 shadow-inner lg:self-auto">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`min-w-[128px] rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${
                view === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Workflows
            </button>
            <button
              type="button"
              onClick={() => setView('builder')}
              className={`min-w-[128px] rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${
                view === 'builder'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Builder
            </button>
          </div>
        </div>
      </nav>

      <div className="min-h-0 flex-1 overflow-hidden">
        {view === 'list' ? <WorkflowList /> : <WorkflowBuilder />}
      </div>
    </div>
  );
}
