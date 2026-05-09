/**
 * Client-side utilities for workflow schema persistence
 */

import {
  saveWorkflowSchema as serverSaveWorkflowSchema,
  loadWorkflowSchema as serverLoadWorkflowSchema,
} from '@/app/actions/workflow';
import * as api from '@/lib/workflowApi';

export interface WorkflowSaveData {
  id: string;
  name: string;
  clientCode: string;
  nodes: any[];
  edges: any[];
}

/**
 * Save workflow schema to file-based persistence
 */
export async function saveSchema(data: WorkflowSaveData): Promise<boolean> {
  try {
    // Prefer client-safe REST wrapper when available
    if (typeof window !== 'undefined') {
      await api.saveWorkflowSchema(data.id, {
        id: data.id,
        name: data.name,
        clientCode: data.clientCode,
        nodes: data.nodes,
        edges: data.edges,
      });
    } else {
      // server-side fallback
      await serverSaveWorkflowSchema(
        data.id,
        data.name,
        data.clientCode,
        data.nodes,
        data.edges
      );
    }
    return true;
  } catch (error) {
    console.error('Failed to save schema:', error);
    return false;
  }
}

/**
 * Load workflow schema from file-based persistence
 */
export async function loadSchema(
  id: string
): Promise<WorkflowSaveData | null> {
  try {
    const raw = typeof window !== 'undefined'
      ? await api.loadWorkflowSchema(id)
      : await serverLoadWorkflowSchema(id);
    const schema = raw?.schema ?? raw;
    if (!schema) {
      return null;
    }
    return {
      id: schema.id,
      name: schema.name,
      clientCode: schema.clientCode,
      nodes: schema.nodes,
      edges: schema.edges,
    };
  } catch (error) {
    console.error('Failed to load schema:', error);
    return null;
  }
}

/**
 * Generate a unique workflow ID
 */
export function generateWorkflowId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract workflow ID from URL query params
 */
export function getWorkflowIdFromUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('workflowId');
}

/**
 * Set workflow ID in URL
 */
export function setWorkflowIdInUrl(id: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  params.set('workflowId', id);
  params.set('view', 'builder');
  window.history.replaceState(null, '', `?${params.toString()}`);
}
