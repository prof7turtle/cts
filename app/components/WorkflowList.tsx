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

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
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
    } catch (err: any) {
      setError(err.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await workflowActions.fetchWorkflowStats();
      setStats(stats);
    } catch (err: any) {
      console.error('Failed to load stats:', err.message);
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
        setWorkflows([...workflows, result.workflow as any]);
        loadStats();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create workflow');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const result = await workflowActions.publishWorkflow(id);

      if (result.success) {
        setWorkflows(
          workflows.map((w) =>
            w.id === id ? { ...w, status: 'PUBLISHED' } : w
          )
        );
        loadStats();
      } else {
        setError(result.errors?.join(', ') || 'Failed to publish workflow');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to publish workflow');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const result = await workflowActions.archiveWorkflow(id);

      if (result.success) {
        setWorkflows(
          workflows.map((w) =>
            w.id === id ? { ...w, status: 'ARCHIVED' } : w
          )
        );
        loadStats();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to archive workflow');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const result = await workflowActions.duplicateWorkflow(id);

      if (result.success && result.workflow) {
        setWorkflows([...workflows, result.workflow as any]);
        loadStats();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate workflow');
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
    } catch (err: any) {
      setError(err.message || 'Failed to delete workflow');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Workflow Management</h1>

      {/* Stats */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {stats.totalWorkflows}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Total Workflows
            </div>
          </div>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {stats.publishedWorkflows}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Published</div>
          </div>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {stats.draftWorkflows}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Draft</div>
          </div>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {stats.totalNodes}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Nodes</div>
          </div>
        </div>
      )}

      {/* Create Workflow Button */}
      <button
        onClick={() => {
          const name = prompt('Enter workflow name:');
          if (name) handleCreateWorkflow(name);
        }}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          backgroundColor: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Create Workflow
      </button>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '4px',
            border: '1px solid #fcc',
          }}
        >
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && <p>Loading workflows...</p>}

      {/* Workflows List */}
      {!loading && workflows.length > 0 && (
        <div>
          <h2>Workflows ({workflows.length})</h2>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    Updated
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((workflow) => (
                  <tr
                    key={workflow.id}
                    style={{
                      borderBottom: '1px solid #ddd',
                      backgroundColor:
                        selectedWorkflow === workflow.id ? '#f0f0f0' : '',
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <strong>{workflow.name}</strong>
                      <br />
                      <small style={{ color: '#666' }}>
                        {workflow.description}
                      </small>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}
                        className={getStatusColor(workflow.status)}
                      >
                        {workflow.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#666' }}>
                      {new Date(workflow.updatedAt).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <button
                        onClick={() => setSelectedWorkflow(workflow.id)}
                        style={{
                          padding: '4px 8px',
                          marginRight: '4px',
                          backgroundColor: '#0066cc',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Edit
                      </button>

                      {workflow.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(workflow.id)}
                          style={{
                            padding: '4px 8px',
                            marginRight: '4px',
                            backgroundColor: '#22aa22',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Publish
                        </button>
                      )}

                      <button
                        onClick={() => handleDuplicate(workflow.id)}
                        style={{
                          padding: '4px 8px',
                          marginRight: '4px',
                          backgroundColor: '#ff9900',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Duplicate
                      </button>

                      {workflow.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(workflow.id)}
                          style={{
                            padding: '4px 8px',
                            marginRight: '4px',
                            backgroundColor: '#9999aa',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Archive
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(workflow.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#cc0000',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && workflows.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
          No workflows found. Create one to get started!
        </p>
      )}
    </div>
  );
}
