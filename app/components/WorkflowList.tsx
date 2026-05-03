'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as workflowActions from '@/app/actions/workflow';

interface WorkflowListItem {
  id: string;
  name: string;
  status: string;
  description?: string;
  version: number;
  updatedAt: string;
}

// ── Create Workflow Modal ────────────────────────────────────────
function CreateWorkflowModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Workflow name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      await onCreate(name.trim(), description.trim());
      setName(''); setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create workflow.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) { setName(''); setDescription(''); setError(''); }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="wl-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wl-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="wl-modal-header">
          <h2 id="modal-title">New Workflow</h2>
          <button type="button" className="wl-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="wl-modal-form">
          <div className="wl-field">
            <label htmlFor="wf-name">Name <span className="wl-required">*</span></label>
            <input
              id="wf-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. HO3 Rating Pre-Hook"
              autoFocus
              className={error ? 'wl-input error' : 'wl-input'}
            />
            {error && <span className="wl-field-error">{error}</span>}
          </div>
          <div className="wl-field">
            <label htmlFor="wf-desc">Description <span className="wl-optional">(optional)</span></label>
            <input
              id="wf-desc"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description of what this workflow does"
              className="wl-input"
            />
          </div>
          <div className="wl-modal-actions">
            <button type="button" className="wl-btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="wl-btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PUBLISHED: { label: 'Published', cls: 'badge-published' },
    DRAFT:     { label: 'Draft',     cls: 'badge-draft' },
    ARCHIVED:  { label: 'Archived',  cls: 'badge-archived' },
  };
  const cfg = map[status] ?? { label: status, cls: 'badge-default' };
  return <span className={`wl-badge ${cfg.cls}`}>{cfg.label}</span>;
}

// ── Workflow Card ─────────────────────────────────────────────────
function WorkflowCard({
  workflow,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
}: {
  workflow: WorkflowListItem;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const updated = new Date(workflow.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="wl-card">
      <div className="wl-card-top">
        <StatusBadge status={workflow.status} />
        <span className="wl-card-version">v{workflow.version}</span>
      </div>

      <div className="wl-card-body">
        <h3 className="wl-card-name">{workflow.name}</h3>
        {workflow.description && (
          <p className="wl-card-desc">{workflow.description}</p>
        )}
      </div>

      <div className="wl-card-meta">
        Updated {updated}
      </div>

      <div className="wl-card-actions">
        {workflow.status === 'DRAFT' && (
          <button
            type="button"
            className="wl-action-btn wl-action-publish"
            onClick={() => onPublish(workflow.id)}
          >
            Publish
          </button>
        )}
        <button
          type="button"
          className="wl-action-btn wl-action-duplicate"
          onClick={() => onDuplicate(workflow.id)}
        >
          Duplicate
        </button>
        {workflow.status !== 'ARCHIVED' && (
          <button
            type="button"
            className="wl-action-btn wl-action-archive"
            onClick={() => onArchive(workflow.id)}
          >
            Archive
          </button>
        )}
        <button
          type="button"
          className="wl-action-btn wl-action-delete"
          onClick={() => onDelete(workflow.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }: {
  label: string; value: number | string; icon: string; accent: string;
}) {
  return (
    <div className="wl-stat-card" style={{ borderTopColor: accent }}>
      <div className="wl-stat-icon" style={{ color: accent }}>{icon}</div>
      <div className="wl-stat-value">{value}</div>
      <div className="wl-stat-label">{label}</div>
    </div>
  );
}

// ── Skeleton Card ────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="wl-card wl-card-skeleton">
      <div className="skel skel-sm" />
      <div className="skel skel-lg" style={{ marginTop: 16 }} />
      <div className="skel skel-md" style={{ marginTop: 8 }} />
      <div className="skel skel-sm" style={{ marginTop: 24 }} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function WorkflowList() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
    loadStats();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await workflowActions.fetchWorkflows(1, 50);
      setWorkflows(result.workflows);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await workflowActions.fetchWorkflowStats();
      setStats(s);
    } catch { /* silent */ }
  };

  const handleCreate = useCallback(async (name: string, description: string) => {
    const result = await workflowActions.createWorkflow(name, description || 'New workflow created from GraphQL', 'Insurance');
    if (result.success && result.workflow) {
      setWorkflows(prev => [result.workflow as any, ...prev]);
      loadStats();
    }
  }, []);

  const handlePublish = async (id: string) => {
    setActionError(null);
    try {
      const result = await workflowActions.publishWorkflow(id);
      if (result.success) {
        setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: 'PUBLISHED' } : w));
        loadStats();
      } else {
        setActionError(result.errors?.join(', ') || 'Failed to publish');
      }
    } catch (err: any) { setActionError(err.message); }
  };

  const handleArchive = async (id: string) => {
    setActionError(null);
    try {
      const result = await workflowActions.archiveWorkflow(id);
      if (result.success) {
        setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: 'ARCHIVED' } : w));
        loadStats();
      }
    } catch (err: any) { setActionError(err.message); }
  };

  const handleDuplicate = async (id: string) => {
    setActionError(null);
    try {
      const result = await workflowActions.duplicateWorkflow(id);
      if (result.success && result.workflow) {
        setWorkflows(prev => [result.workflow as any, ...prev]);
        loadStats();
      }
    } catch (err: any) { setActionError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow? This action cannot be undone.')) return;
    setActionError(null);
    try {
      const result = await workflowActions.deleteWorkflow(id);
      if (result.success) {
        setWorkflows(prev => prev.filter(w => w.id !== id));
        loadStats();
      }
    } catch (err: any) { setActionError(err.message); }
  };

  return (
    <div className="wl-root">
      {/* Page Header */}
      <div className="wl-page-header">
        <div>
          <h1 className="wl-page-title">Workflow Management</h1>
          <p className="wl-page-sub">Create and manage insurance policy hook workflows.</p>
        </div>
        <button
          type="button"
          className="wl-create-btn"
          onClick={() => setShowCreate(true)}
        >
          + New Workflow
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="wl-stats-row">
          <StatCard label="Total Workflows" value={stats.totalWorkflows}  icon="▣" accent="#6366f1" />
          <StatCard label="Published"       value={stats.publishedWorkflows} icon="✓" accent="#22c55e" />
          <StatCard label="Drafts"          value={stats.draftWorkflows}  icon="✎" accent="#f59e0b" />
          <StatCard label="Total Nodes"     value={stats.totalNodes}      icon="⬡" accent="#0ea5e9" />
        </div>
      )}

      {/* Errors */}
      {(error || actionError) && (
        <div className="wl-error-banner">
          {error || actionError}
          <button type="button" onClick={() => { setError(null); setActionError(null); }}>✕</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="wl-grid">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : workflows.length === 0 ? (
        <div className="wl-empty">
          <div className="wl-empty-icon">⬡</div>
          <h3>No workflows yet</h3>
          <p>Create your first workflow to get started.</p>
          <button type="button" className="wl-create-btn" onClick={() => setShowCreate(true)}>
            + New Workflow
          </button>
        </div>
      ) : (
        <>
          <div className="wl-section-label">{workflows.length} workflow{workflows.length !== 1 ? 's' : ''}</div>
          <div className="wl-grid">
            {workflows.map(w => (
              <WorkflowCard
                key={w.id}
                workflow={w}
                onPublish={handlePublish}
                onArchive={handleArchive}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      <CreateWorkflowModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
