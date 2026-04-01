'use client';

import React, { useState, useEffect } from 'react';
import * as workflowActions from '@/app/actions/workflow';

interface WorkflowListItem {
  id: string;
  name: string;
  status: string;
  description?: string;
  version: number;
  updatedAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const key = status.toUpperCase();
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200',
    PUBLISHED: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200',
    DRAFT: 'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200',
    ARCHIVED: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
  };
  const s =
    styles[key] ?? 'bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200';
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${s}`}
    >
      {status}
    </span>
  );
}

const btnBase =
  'inline-flex items-center justify-center rounded-lg text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]';

const btnEdit = `${btnBase} border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-800 hover:border-blue-300 hover:bg-blue-100`;
const btnDuplicate = `${btnBase} border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 hover:border-slate-300 hover:bg-slate-100`;
const btnArchive = `${btnBase} border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-900 hover:border-amber-300 hover:bg-amber-100`;
const btnDelete = `${btnBase} border border-red-200 bg-red-50 px-3 py-1.5 text-red-700 hover:border-red-300 hover:bg-red-100`;
const btnPublish = `${btnBase} border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100`;

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalWorkflows?: number;
    publishedWorkflows?: number;
    draftWorkflows?: number;
    totalNodes?: number;
  } | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
    loadStats();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await workflowActions.fetchWorkflows(1, 10);
      setWorkflows(result.workflows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await workflowActions.fetchWorkflowStats();
      setStats(s);
    } catch (err: unknown) {
      console.error('Failed to load stats:', err instanceof Error ? err.message : err);
    }
  };

  const handleCreateWorkflow = async (name: string) => {
    try {
      const result = await workflowActions.createWorkflow(
        name,
        'New workflow created from GraphQL',
        'Insurance'
      );

      if (result.success && result.workflow) {
        setWorkflows([...workflows, result.workflow as WorkflowListItem]);
        loadStats();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const result = await workflowActions.publishWorkflow(id);

      if (result.success) {
        setWorkflows(workflows.map((w) => (w.id === id ? { ...w, status: 'PUBLISHED' } : w)));
        loadStats();
      } else {
        setError(result.errors?.join(', ') || 'Failed to publish workflow');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to publish workflow');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const result = await workflowActions.archiveWorkflow(id);

      if (result.success) {
        setWorkflows(workflows.map((w) => (w.id === id ? { ...w, status: 'ARCHIVED' } : w)));
        loadStats();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to archive workflow');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const result = await workflowActions.duplicateWorkflow(id);

      if (result.success && result.workflow) {
        setWorkflows([...workflows, result.workflow as WorkflowListItem]);
        loadStats();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate workflow');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const result = await workflowActions.deleteWorkflow(id);

      if (result.success) {
        setWorkflows(workflows.filter((w) => w.id !== id));
        loadStats();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow');
    }
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[#f8fafc] px-8 py-6">
      <div className="mx-auto max-w-6xl">
        {/* 1. Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">
              Workflows
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#64748b]">
              Manage published and draft insurance policy workflows from one place.
            </p>
          </div>
          {/* Primary action (aligned with header) */}
          <div className="flex shrink-0 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                const name = prompt('Enter workflow name:');
                if (name) handleCreateWorkflow(name);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-[#1d4ed8] bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d4ed8]"
            >
              Create workflow
            </button>
          </div>
        </header>

        {/* 2. Stats */}
        {stats && (
          <section className="mb-6" aria-label="Workflow statistics">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total workflows', value: stats.totalWorkflows ?? 0 },
                { label: 'Published', value: stats.publishedWorkflows ?? 0 },
                { label: 'Draft', value: stats.draftWorkflows ?? 0 },
                { label: 'Total nodes', value: stats.totalNodes ?? 0 },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
                >
                  <p className="text-3xl font-semibold tabular-nums tracking-tight text-[#1e293b]">
                    {card.value}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#64748b]">{card.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mb-6 rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-12 text-center shadow-sm">
            <p className="text-sm font-medium text-[#64748b]">Loading workflows…</p>
          </div>
        )}

        {/* 3. Table (card with padding) */}
        {!loading && workflows.length > 0 && (
          <section
            aria-label="Workflow list"
            className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] p-6 shadow-sm"
          >
            <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-lg font-semibold text-[#1e293b]">
                All workflows
                <span className="ml-2 text-base font-normal text-[#64748b]">
                  ({workflows.length})
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="whitespace-nowrap py-3 pl-0 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                      Name
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                      Updated
                    </th>
                    <th className="whitespace-nowrap py-3 pl-4 pr-0 text-right text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {workflows.map((workflow) => (
                    <tr
                      key={workflow.id}
                      className={`transition-colors ${
                        selectedWorkflow === workflow.id
                          ? 'bg-slate-50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="align-middle py-6 pl-0 pr-4">
                        <span className="font-medium text-[#1e293b]">{workflow.name}</span>
                        {workflow.description && (
                          <span className="mt-1.5 block text-xs leading-relaxed text-[#64748b]">
                            {workflow.description}
                          </span>
                        )}
                      </td>
                      <td className="align-middle px-4 py-6">
                        <StatusBadge status={workflow.status} />
                      </td>
                      <td className="whitespace-nowrap align-middle px-4 py-6 text-[#64748b]">
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="align-middle py-6 pl-4 pr-0">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            className={btnEdit}
                            onClick={() => setSelectedWorkflow(workflow.id)}
                          >
                            Edit
                          </button>
                          {workflow.status === 'DRAFT' && (
                            <button
                              type="button"
                              className={btnPublish}
                              onClick={() => handlePublish(workflow.id)}
                            >
                              Publish
                            </button>
                          )}
                          <button
                            type="button"
                            className={btnDuplicate}
                            onClick={() => handleDuplicate(workflow.id)}
                          >
                            Duplicate
                          </button>
                          {workflow.status !== 'ARCHIVED' && (
                            <button
                              type="button"
                              className={btnArchive}
                              onClick={() => handleArchive(workflow.id)}
                            >
                              Archive
                            </button>
                          )}
                          <button
                            type="button"
                            className={btnDelete}
                            onClick={() => handleDelete(workflow.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && workflows.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#e2e8f0] bg-[#ffffff] px-8 py-16 text-center shadow-sm">
            <p className="text-sm font-medium text-[#64748b]">
              No workflows found. Create one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
