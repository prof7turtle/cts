'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WorkflowBuilder from './components/WorkflowBuilder';
import WorkflowList from './components/WorkflowList';

export default function HomePage() {
  const router = useRouter();
  const [view, setViewState] = useState<'list' | 'builder'>('list');

  useEffect(() => {
    const syncViewFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setViewState(params.get('view') === 'builder' ? 'builder' : 'list');
    };

    syncViewFromUrl();
    window.addEventListener('popstate', syncViewFromUrl);

    return () => {
      window.removeEventListener('popstate', syncViewFromUrl);
    };
  }, []);

  const setView = (nextView: 'list' | 'builder') => {
    const params = new URLSearchParams(window.location.search);

    if (nextView === 'builder') {
      params.set('view', 'builder');
    } else {
      params.delete('view');
    }

    const query = params.toString();
    setViewState(nextView);
    router.replace(query ? `/?${query}` : '/', { scroll: false });
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', backgroundColor: '#f9f9f9' }}>
      {/* Navigation Header */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: '16px 20px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0066cc' }}>
          🏗️ Workflow Builder POC
        </div>
        <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
          <button
            onClick={() => setView('list')}
            style={{
              padding: '8px 16px',
              backgroundColor: view === 'list' ? '#0066cc' : '#e0e0e0',
              color: view === 'list' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: view === 'list' ? 'bold' : 'normal',
            }}
          >
            Workflows
          </button>
          <button
            onClick={() => setView('builder')}
            style={{
              padding: '8px 16px',
              backgroundColor: view === 'builder' ? '#0066cc' : '#e0e0e0',
              color: view === 'builder' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: view === 'builder' ? 'bold' : 'normal',
            }}
          >
            Builder
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
        {view === 'list' ? <WorkflowList /> : <WorkflowBuilder />}
      </div>
    </div>
  );
}
