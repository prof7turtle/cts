'use client';

import { useState } from 'react';
import Image from 'next/image';
import WorkflowBuilder from './components/WorkflowBuilder';
import WorkflowList from './components/WorkflowList';
import CogitateLogo from './CogitateLogo.jpg';

export default function HomePage() {
  const [view, setView] = useState<'list' | 'builder'>('list');

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#f3f6fb_100%)]">
      <nav
        className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md shadow-[0_1px_0_rgba(15,23,42,0.02)]"
        aria-label="Primary"
      >
        <div className="flex items-center gap-4">
          <div className="relative inline-flex h-9 w-[130px] shrink-0 items-center justify-center overflow-hidden">
            <Image
              src={CogitateLogo}
              alt="Cogitate"
              fill
              className="object-contain object-left"
              sizes="(max-width: 768px) 100vw, 150px"
              priority
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-300" aria-hidden>/</span>
            <span className="text-[14px] font-semibold tracking-wide text-slate-600">
              Workflow Studio
            </span>
          </div>
        </div>

        <div className="flex items-center">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`min-w-[100px] rounded-md px-4 py-1.5 text-[13px] font-bold transition-all duration-200 ${
                view === 'list'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Workflows
            </button>
            <button
              type="button"
              onClick={() => setView('builder')}
              className={`min-w-[100px] rounded-md px-4 py-1.5 text-[13px] font-bold transition-all duration-200 ${
                view === 'builder'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
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
