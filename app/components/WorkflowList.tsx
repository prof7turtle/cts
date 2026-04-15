'use client';

import React, { useEffect, useState } from 'react';
import * as workflowActions from '@/app/actions/workflow';

interface WorkflowListItem {
  id: string;
  name: string;
  status: string;
  description?: string;
  version: number;
  updatedAt: string;
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex min-h-[144px] w-full flex-col justify-between rounded-xl border border-slate-200/80 bg-white px-14 py-9 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className={`ml-3 h-1.5 w-14 rounded-full ${accent}`} />
      <div className="mt-5 space-y-2 pl-4">
        <p className="text-3xl font-bold leading-normal tracking-tight text-slate-950">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const key = status.toUpperCase();
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    DRAFT: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    ARCHIVED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  };
  const s = styles[key] ?? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100';

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${s}`}>
      {status}
    </span>
  );
}

const btnBase =
  'inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]';

const btnEdit = `${btnBase} bg-slate-100 text-slate-700 hover:bg-slate-200`;
const btnDuplicate = `${btnBase} bg-slate-100 text-slate-700 hover:bg-slate-200`;
const btnArchive = `${btnBase} bg-amber-50 text-amber-700 hover:bg-amber-100`;
const btnDelete = `${btnBase} bg-red-50 text-red-500 hover:bg-red-100`;
const btnPublish = `${btnBase} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`;

function WorkflowRow({
  workflow,
  isSelected,
  onEdit,
  onPublish,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  workflow: WorkflowListItem;
  isSelected: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const initials = workflow.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <tr className={`transition-all duration-200 ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/90'}`}>
      <td className="py-5 pr-4 align-middle">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#e0ecff,#f4f8ff)] text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-normal text-slate-900">{workflow.name}</div>
            {workflow.description && (
              <div className="mt-1 text-sm leading-relaxed text-slate-500">{workflow.description}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-5 align-middle">
        <StatusBadge status={workflow.status} />
      </td>
      <td className="whitespace-nowrap px-4 py-5 align-middle text-sm text-slate-500">
        {new Date(workflow.updatedAt).toLocaleDateString()}
      </td>
      <td className="py-5 pl-4 pr-0 align-middle">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" className={btnEdit} onClick={onEdit}>
            Edit
          </button>
          {workflow.status === 'DRAFT' && (
            <button type="button" className={btnPublish} onClick={onPublish}>
              Publish
            </button>
          )}
          <button type="button" className={btnDuplicate} onClick={onDuplicate}>
            Duplicate
          </button>
          {workflow.status !== 'ARCHIVED' && (
            <button type="button" className={btnArchive} onClick={onArchive}>
              Archive
            </button>
          )}
          <button type="button" className={btnDelete} onClick={onDelete}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

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
    <div className="h-full min-h-0 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#f4f7fb_100%)] py-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-8 px-6 sm:px-8 lg:px-10 xl:px-12">
        <section className="relative rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,#ffffff_0%,#f7faff_60%,#eff6ff_100%)] px-8 py-8 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.3)] sm:px-10 sm:py-9 lg:px-12">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="relative grid w-full gap-8 lg:grid-cols-12 lg:items-end">
            <div className="min-w-0 lg:col-span-8 xl:col-span-9">
              <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                Workflow overview
              </div>
              <h1 className="mt-4 max-w-[14ch] pb-1 pt-1 text-[2.4rem] font-semibold leading-tight tracking-tight text-slate-950 sm:max-w-[13ch] sm:text-[3rem] lg:max-w-[14ch] lg:text-[4rem]">
                Build, review, and ship workflows
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Keep policy automation organized with a calm workspace for drafts, live workflows, and operational updates.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col items-start gap-3 lg:col-span-4 lg:items-stretch xl:col-span-3">
              <div className="hidden rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-500 shadow-sm sm:block">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{workflows.length} workflows</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const name = prompt('Enter workflow name:');
                  if (name) handleCreateWorkflow(name);
                }}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_-18px_rgba(37,99,235,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Create workflow
              </button>
            </div>
          </div>
        </section>

        {stats && (
          <section className="w-full" aria-label="Workflow statistics">
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total workflows" value={stats.totalWorkflows ?? 0} accent="bg-blue-500" />
              <MetricCard label="Published" value={stats.publishedWorkflows ?? 0} accent="bg-emerald-500" />
              <MetricCard label="Draft" value={stats.draftWorkflows ?? 0} accent="bg-amber-500" />
              <MetricCard label="Total nodes" value={stats.totalNodes ?? 0} accent="bg-violet-500" />
            </div>
          </section>
        )}

        {error && (
          <div className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm" role="alert">
            {error}
          </div>
        )}

        {loading && (
          <div className="w-full rounded-2xl border border-slate-200/80 bg-white px-8 py-16 text-center shadow-[0_16px_35px_-28px_rgba(15,23,42,0.25)]">
            <p className="text-sm font-medium text-slate-600">Loading workflows...</p>
          </div>
        )}

        {!loading && workflows.length > 0 && (
          <section aria-label="Workflow list" className="w-full rounded-[28px] border border-slate-200/80 bg-white shadow-[0_16px_35px_-28px_rgba(15,23,42,0.25)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-8 py-6 sm:px-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="pb-1 pt-1 text-lg font-semibold leading-normal text-slate-900">All workflows</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  A clean view of workflow status, activity, and next actions.
                </p>
              </div>
              <div className="text-sm font-medium text-slate-400">{workflows.length} total</div>
            </div>

            <div className="overflow-x-auto px-8 pb-4 sm:px-10">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="whitespace-nowrap py-4 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Name
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Updated
                    </th>
                    <th className="whitespace-nowrap py-4 pl-4 pr-0 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workflows.map((workflow) => (
                    <WorkflowRow
                      key={workflow.id}
                      workflow={workflow}
                      isSelected={selectedWorkflow === workflow.id}
                      onEdit={() => setSelectedWorkflow(workflow.id)}
                      onPublish={() => handlePublish(workflow.id)}
                      onDuplicate={() => handleDuplicate(workflow.id)}
                      onArchive={() => handleArchive(workflow.id)}
                      onDelete={() => handleDelete(workflow.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && workflows.length === 0 && (
          <div className="w-full rounded-[28px] border border-slate-200/80 bg-white px-8 py-16 text-center shadow-[0_16px_35px_-28px_rgba(15,23,42,0.25)]">
            <p className="text-sm font-medium text-slate-600">
              No workflows found. Create one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
