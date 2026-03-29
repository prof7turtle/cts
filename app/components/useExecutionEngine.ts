'use client';

import { useCallback, useRef, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { nodeDefinitionByType } from './nodes/nodeTypes';
import type { BuilderNodeData } from './hookSchema';

// ─── Types ──────────────────────────────────────────────────────

export type ExecutionState = 'idle' | 'running' | 'paused' | 'completed' | 'error';
export type NodeExecStatus = 'idle' | 'running' | 'completed' | 'error' | 'skipped';

export interface LogEntry {
  id: number;
  timestamp: Date;
  nodeId: string;
  nodeLabel: string;
  status: NodeExecStatus;
  message: string;
  duration?: number;
}

export interface ExecutionEngine {
  state: ExecutionState;
  currentNodeId: string | null;
  nodeStatuses: Record<string, NodeExecStatus>;
  logs: LogEntry[];
  progress: { completed: number; total: number };
  run: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

// ─── Configuration ──────────────────────────────────────────────

const MIN_EXEC_MS = 800;
const MAX_EXEC_MS = 1500;
const ERROR_PROBABILITY = 0.10; // 10% chance of simulated failure

function randomDelay(): number {
  return MIN_EXEC_MS + Math.random() * (MAX_EXEC_MS - MIN_EXEC_MS);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

// ─── Graph Helpers ──────────────────────────────────────────────

function findStartNode(nodes: Node[]): Node | undefined {
  return nodes.find((n) => n.type === 'start');
}

function getNextNodes(
  currentNodeId: string,
  currentNode: Node | undefined,
  edges: Edge[],
  nodes: Node[]
): Node[] {
  const outgoing = edges.filter((e) => e.source === currentNodeId);

  if (currentNode?.type === 'ifCondition') {
    // Randomly pick YES or NO branch
    const yesEdge = outgoing.find((e) => e.sourceHandle === 'yes');
    const noEdge = outgoing.find((e) => e.sourceHandle === 'no');
    const chosen = Math.random() > 0.5 ? yesEdge : noEdge;
    if (chosen) {
      const target = nodes.find((n) => n.id === chosen.target);
      return target ? [target] : [];
    }
    // Fallback: take first outgoing
    if (outgoing.length > 0) {
      const target = nodes.find((n) => n.id === outgoing[0].target);
      return target ? [target] : [];
    }
    return [];
  }

  return outgoing
    .map((e) => nodes.find((n) => n.id === e.target))
    .filter(Boolean) as Node[];
}

function getNodeLabel(node: Node): string {
  const data = (node.data ?? {}) as BuilderNodeData;
  const def = nodeDefinitionByType[node.type ?? ''];
  return data.label ?? def?.label ?? node.type ?? 'Unknown';
}

function getTraversalOrder(nodes: Node[], edges: Edge[]): Node[] {
  const start = findStartNode(nodes);
  if (!start) return [];

  const order: Node[] = [];
  const visited = new Set<string>();
  const queue: Node[] = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    order.push(current);

    const next = getNextNodes(current.id, current, edges, nodes);
    for (const n of next) {
      if (!visited.has(n.id)) queue.push(n);
    }
  }

  return order;
}

// ─── Hook ───────────────────────────────────────────────────────

export function useExecutionEngine(
  nodesRef: () => Node[],
  edgesRef: () => Edge[]
): ExecutionEngine {
  const [state, setState] = useState<ExecutionState>('idle');
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeExecStatus>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const abortRef = useRef<AbortController | null>(null);
  const pauseRef = useRef<{ resolve: () => void; promise: Promise<void> } | null>(null);
  const logIdRef = useRef(0);

  const addLog = useCallback(
    (nodeId: string, nodeLabel: string, status: NodeExecStatus, message: string, duration?: number) => {
      const entry: LogEntry = {
        id: ++logIdRef.current,
        timestamp: new Date(),
        nodeId,
        nodeLabel,
        status,
        message,
        duration,
      };
      setLogs((prev) => [...prev, entry]);
    },
    []
  );

  const setNodeStatus = useCallback((nodeId: string, status: NodeExecStatus) => {
    setNodeStatuses((prev) => ({ ...prev, [nodeId]: status }));
  }, []);

  // ─── Run ────────────────────────────────────────────────────

  const run = useCallback(async () => {
    const nodes = nodesRef();
    const edges = edgesRef();

    const start = findStartNode(nodes);
    if (!start) {
      addLog('system', 'System', 'error', 'No Start node found on canvas.');
      setState('error');
      return;
    }

    // Reset state
    const statuses: Record<string, NodeExecStatus> = {};
    nodes.forEach((n) => (statuses[n.id] = 'idle'));
    setNodeStatuses(statuses);
    setLogs([]);
    logIdRef.current = 0;
    setState('running');

    const abort = new AbortController();
    abortRef.current = abort;

    addLog('system', 'System', 'running', 'Workflow execution started.');

    // Walk through the graph
    let current: Node | null = start;
    let completed = 0;
    const totalNodes = nodes.length;
    setProgress({ completed: 0, total: totalNodes });

    try {
      while (current) {
        if (abort.signal.aborted) break;

        // Wait if paused
        if (pauseRef.current) {
          await pauseRef.current.promise;
        }

        const nodeId = current.id;
        const label = getNodeLabel(current);
        const def = nodeDefinitionByType[current.type ?? ''];

        // Mark running
        setCurrentNodeId(nodeId);
        setNodeStatus(nodeId, 'running');
        addLog(nodeId, label, 'running', `Executing ${label}...`);

        const delay = randomDelay();
        const startTime = Date.now();

        await sleep(delay, abort.signal);

        const elapsed = Date.now() - startTime;

        // Simulate success/error (Start and End always succeed)
        const isFlowNode = current.type === 'start' || current.type === 'end';
        const shouldError = !isFlowNode && Math.random() < ERROR_PROBABILITY;

        if (shouldError) {
          setNodeStatus(nodeId, 'error');
          addLog(
            nodeId,
            label,
            'error',
            `${label} failed: Simulated error — ${def?.functionName ?? 'Function'} threw an exception.`,
            elapsed
          );
          setState('error');
          setCurrentNodeId(null);
          addLog('system', 'System', 'error', `Workflow execution failed at "${label}".`);
          return;
        }

        // Success
        setNodeStatus(nodeId, 'completed');
        completed++;
        setProgress({ completed, total: totalNodes });
        addLog(nodeId, label, 'completed', `${label} completed successfully.`, elapsed);

        // Find next node
        if (current.type === 'end') {
          break;
        }

        const nextNodes = getNextNodes(current.id, current, edges, nodes);

        if (current.type === 'ifCondition') {
          const chosen = nextNodes[0];
          if (chosen) {
            // Determine which branch was taken
            const edge = edges.find(
              (e) => e.source === current!.id && e.target === chosen.id
            );
            const branch = edge?.sourceHandle === 'yes' ? 'YES' : 'NO';
            addLog(
              nodeId,
              label,
              'completed',
              `Condition evaluated: took ${branch} branch.`
            );
          }
        }

        current = nextNodes[0] ?? null;

        if (!current && nodes.some((n) => n.type === 'end')) {
          // No connected next node but there's an end node — mark as error
          addLog('system', 'System', 'error', 'No connected next node found. Workflow may be incomplete.');
          setState('error');
          setCurrentNodeId(null);
          return;
        }
      }

      if (!abort.signal.aborted) {
        setState('completed');
        setCurrentNodeId(null);
        addLog('system', 'System', 'completed', 'Workflow execution completed successfully.');
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        addLog('system', 'System', 'skipped', 'Workflow execution stopped by user.');
        setState('idle');
        setCurrentNodeId(null);
      } else {
        addLog('system', 'System', 'error', `Unexpected error: ${String(err)}`);
        setState('error');
        setCurrentNodeId(null);
      }
    }
  }, [nodesRef, edgesRef, addLog, setNodeStatus]);

  // ─── Pause / Resume ─────────────────────────────────────────

  const pause = useCallback(() => {
    if (state !== 'running') return;
    let resolver: () => void;
    const promise = new Promise<void>((resolve) => {
      resolver = resolve;
    });
    pauseRef.current = { resolve: resolver!, promise };
    setState('paused');
    addLog('system', 'System', 'skipped', 'Workflow execution paused.');
  }, [state, addLog]);

  const resume = useCallback(() => {
    if (state !== 'paused') return;
    pauseRef.current?.resolve();
    pauseRef.current = null;
    setState('running');
    addLog('system', 'System', 'running', 'Workflow execution resumed.');
  }, [state, addLog]);

  // ─── Stop ───────────────────────────────────────────────────

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    pauseRef.current?.resolve();
    pauseRef.current = null;
    setState('idle');
    setCurrentNodeId(null);
  }, []);

  // ─── Reset ──────────────────────────────────────────────────

  const reset = useCallback(() => {
    stop();
    setNodeStatuses({});
    setLogs([]);
    setProgress({ completed: 0, total: 0 });
    logIdRef.current = 0;
  }, [stop]);

  return {
    state,
    currentNodeId,
    nodeStatuses,
    logs,
    progress,
    run,
    pause,
    resume,
    stop,
    reset,
  };
}
