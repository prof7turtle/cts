'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WorkflowBuilder from './components/WorkflowBuilder';
import WorkflowList from './components/WorkflowList';

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setViewState] = useState<'list' | 'builder'>('list');

  // Sync view state whenever URL search params change (covers both router.push and popstate)
  useEffect(() => {
    setViewState(searchParams.get('view') === 'builder' ? 'builder' : 'list');
  }, [searchParams]);

  const setView = (nextView: 'list' | 'builder') => {
    const params = new URLSearchParams(window.location.search);
    if (nextView === 'builder') { params.set('view', 'builder'); }
    else { params.delete('view'); }
    const query = params.toString();
    router.push(query ? `/?${query}` : '/', { scroll: false });
  };

  return (
    <div className="app-shell">
      {/* Navigation Header */}
      <header className="app-nav">
        <div className="app-nav-brand">
          <span className="app-nav-logo" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="1" width="8" height="8" rx="2" fill="#6366f1"/>
              <rect x="13" y="1" width="8" height="8" rx="2" fill="#6366f1" opacity="0.5"/>
              <rect x="1" y="13" width="8" height="8" rx="2" fill="#6366f1" opacity="0.5"/>
              <rect x="13" y="13" width="8" height="8" rx="2" fill="#6366f1" opacity="0.75"/>
            </svg>
          </span>
          <span className="app-nav-name">Workflow Builder</span>
          <span className="app-nav-divider" aria-hidden="true" />
          <span className="app-nav-org">CTS · Cogitate</span>
        </div>

        <nav className="app-nav-tabs" role="tablist" aria-label="Main navigation">
          <button
            role="tab"
            aria-selected={view === 'list'}
            className={`app-nav-tab ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
            Workflows
          </button>
          <button
            role="tab"
            aria-selected={view === 'builder'}
            className={`app-nav-tab ${view === 'builder' ? 'active' : ''}`}
            onClick={() => setView('builder')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            Builder
          </button>
        </nav>
      </header>

      {/* Content */}
      <main className="app-content">
        {view === 'list' ? <WorkflowList /> : <WorkflowBuilder />}
      </main>
    </div>
  );
}
