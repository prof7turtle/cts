'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import * as workflowActions from '@/app/actions/workflow';

interface WorkflowData {
  id: string;
  name: string;
  description?: string;
  status: string;
  nodes: Node[];
  edges: Edge[];
}

interface UseWorkflowReturn {
  workflow: WorkflowData | null;
  loading: boolean;
  error: string | null;
  fetchWorkflow: (id: string) => Promise<void>;
  saveWorkflow: (name: string, description?: string) => Promise<string>;
  updateWorkflowStatus: (id: string, status: string) => Promise<void>;
  addNode: (
    workflowId: string,
    type: string,
    label: string,
    position: { x: number; y: number },
    data?: Record<string, any>
  ) => Promise<void>;
  updateNodeData: (nodeId: string, updates: any) => Promise<void>;
  removeNode: (nodeId: string, workflowId: string) => Promise<void>;
  addEdge: (
    workflowId: string,
    source: string,
    target: string
  ) => Promise<void>;
  removeEdge: (edgeId: string, workflowId: string) => Promise<void>;
  publishWorkflow: (id: string) => Promise<void>;
  validateWorkflow: (id: string) => Promise<boolean>;
}

export function useWorkflow(): UseWorkflowReturn {
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflow = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await workflowActions.fetchWorkflowById(id);

      if (data) {
        // Transform GraphQL response to React Flow format
        const transformedWorkflow: WorkflowData = {
          id: data.id,
          name: data.name,
          description: data.description,
          status: data.status,
          nodes: data.nodes.map((node: any) => ({
            id: node.id,
            type: node.type.toLowerCase(),
            label: node.label,
            position: node.position,
            data: {
              label: node.label,
              ...node.data,
            },
          })),
          edges: data.edges.map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            type: edge.type.toLowerCase(),
          })),
        };

        setWorkflow(transformedWorkflow);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflow');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveWorkflow = useCallback(
    async (name: string, description?: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await workflowActions.createWorkflow(
          name,
          description,
          'Insurance'
        );

        if (!result.success) {
          throw new Error(result.message);
        }

        if (result.workflow) {
          setWorkflow({
            id: result.workflow.id,
            name: result.workflow.name,
            description: result.workflow.description,
            status: result.workflow.status,
            nodes: [],
            edges: [],
          });

          return result.workflow.id;
        }

        throw new Error('No workflow returned');
      } catch (err: any) {
        setError(err.message || 'Failed to save workflow');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateWorkflowStatus = useCallback(
    async (id: string, status: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await workflowActions.updateWorkflow(id, { status });

        if (!result.success) {
          throw new Error(result.message);
        }

        if (workflow && workflow.id === id) {
          setWorkflow({ ...workflow, status });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to update workflow');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [workflow]
  );

  const addNode = useCallback(
    async (
      workflowId: string,
      type: string,
      label: string,
      position: { x: number; y: number },
      data?: Record<string, any>
    ) => {
      try {
        setLoading(true);
        setError(null);

        const result = await workflowActions.createNode(
          workflowId,
          type,
          label,
          position,
          data
        );

        if (!result.success) {
          throw new Error(result.message);
        }

        if (workflow && workflow.id === workflowId && result.node) {
          const newNode: Node = {
            id: result.node.id,
            type: result.node.type.toLowerCase(),
            position: result.node.position,
            data: {
              label: result.node.label,
              ...result.node.data,
            },
          };

          setWorkflow({
            ...workflow,
            nodes: [...workflow.nodes, newNode],
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to add node');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [workflow]
  );

  const updateNodeData = useCallback(
    async (nodeId: string, updates: any) => {
      try {
        setLoading(true);
        setError(null);

        const result = await workflowActions.updateNode(nodeId, updates);

        if (!result.success) {
          throw new Error(result.message);
        }

        if (workflow) {
          const updatedNodes = workflow.nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  ...updates,
                  data: { ...node.data, ...updates.data },
                }
              : node
          );

          setWorkflow({
            ...workflow,
            nodes: updatedNodes,
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to update node');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [workflow]
  );

  const removeNode = useCallback(
    async (nodeId: string, workflowId: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await workflowActions.deleteNode(nodeId, workflowId);

        if (!result.success) {
          throw new Error(result.message);
        }

        if (workflow && workflow.id === workflowId) {
          setWorkflow({
            ...workflow,
            nodes: workflow.nodes.filter((n) => n.id !== nodeId),
            edges: workflow.edges.filter(
              (e) => e.source !== nodeId && e.target !== nodeId
            ),
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to remove node');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [workflow]
  );

  const addEdge = useCallback(
    async (workflowId: string, source: string, target: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await workflowActions.createEdge(
          workflowId,
          source,
          target
        );

        if (!result.success) {
          throw new Error(result.message);
        }

        if (workflow && workflow.id === workflowId && result.edge) {
          const newEdge: Edge = {
            id: result.edge.id,
            source: result.edge.source,
            target: result.edge.target,
            sourceHandle: result.edge.sourceHandle,
            targetHandle: result.edge.targetHandle,
          };

          setWorkflow({
            ...workflow,
            edges: [...workflow.edges, newEdge],
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to add edge');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [workflow]
  );

  const removeEdge = useCallback(
    async (edgeId: string, workflowId: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await workflowActions.deleteEdge(edgeId, workflowId);

        if (!result.success) {
          throw new Error(result.message);
        }

        if (workflow && workflow.id === workflowId) {
          setWorkflow({
            ...workflow,
            edges: workflow.edges.filter((e) => e.id !== edgeId),
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to remove edge');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [workflow]
  );

  const publishWorkflow = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await workflowActions.publishWorkflow(id);

        if (!result.success) {
          throw new Error(result.message);
        }

        if (workflow && workflow.id === id) {
          setWorkflow({ ...workflow, status: 'PUBLISHED' });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to publish workflow');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [workflow]
  );

  const validateWorkflow = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await workflowActions.validateWorkflow(id);

        if (!result.success) {
          setError(result.errors?.join(', ') || 'Workflow validation failed');
          return false;
        }

        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to validate workflow');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    workflow,
    loading,
    error,
    fetchWorkflow,
    saveWorkflow,
    updateWorkflowStatus,
    addNode,
    updateNodeData,
    removeNode,
    addEdge,
    removeEdge,
    publishWorkflow,
    validateWorkflow,
  };
}
