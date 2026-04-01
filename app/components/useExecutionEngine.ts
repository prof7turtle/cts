'use client';

import { useCallback, useRef, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { nodeDefinitionByType } from './nodes/nodeTypes';
import type { BuilderNodeData } from './hookSchema';

export type ExecutionState = 'idle' | 'running' | 'paused' | 'completed' | 'error';
export type NodeExecStatus = 'idle' | 'running' | 'completed' | 'error' | 'skipped';
export type EdgeExecStatus = 'idle' | 'active' | 'completed';

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
  currentEdgeId: string | null;
  nodeStatuses: Record<string, NodeExecStatus>;
  edgeStatuses: Record<string, EdgeExecStatus>;
  logs: LogEntry[];
  progress: { completed: number; total: number };
  run: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

const MIN_EXEC_MS = 800;
const MAX_EXEC_MS = 1500;
const ERROR_PROBABILITY = 0.10;

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
    const yesEdge = outgoing.find((e) => e.sourceHandle === 'yes');
    const noEdge = outgoing.find((e) => e.sourceHandle === 'no');
    const chosen = Math.random() > 0.5 ? yesEdge : noEdge;
    if (chosen) {
      const target = nodes.find((n) => n.id === chosen.target);
      return target ? [target] : [];
    }
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

export function useExecutionEngine(
  nodesRef: () => Node[],
  edgesRef: () => Edge[]
): ExecutionEngine {
  const [state, setState] = useState<ExecutionState>('idle');
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [currentEdgeId, setCurrentEdgeId] = useState<string | null>(null);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeExecStatus>>({});
  const [edgeStatuses, setEdgeStatuses] = useState<Record<string, EdgeExecStatus>>({});
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

  const setEdgeStatus = useCallback((edgeId: string, status: EdgeExecStatus) => {
    setEdgeStatuses((prev) => ({ ...prev, [edgeId]: status }));
  }, []);

  const run = useCallback(async () => {
    const nodes = nodesRef();
    const edges = edgesRef();

    const start = findStartNode(nodes);
    if (!start) {
      addLog('system', 'System', 'error', 'No Start node found on canvas.');
      setState('error');
      return;
    }

    const statuses: Record<string, NodeExecStatus> = {};
    const edgeState: Record<string, EdgeExecStatus> = {};
    nodes.forEach((n) => (statuses[n.id] = 'idle'));
    edges.forEach((e) => (edgeState[e.id] = 'idle'));

    setNodeStatuses(statuses);
    setEdgeStatuses(edgeState);
    setCurrentEdgeId(null);
    setLogs([]);
    logIdRef.current = 0;
    setState('running');

    const abort = new AbortController();
    abortRef.current = abort;

    addLog('system', 'System', 'running', 'Workflow execution started.');

    let current: Node | null = start;
    let completed = 0;
    let lastTraversedEdgeId: string | null = null;
    const totalNodes = nodes.length;
    setProgress({ completed: 0, total: totalNodes });

    try {
      while (current) {
        if (abort.signal.aborted) break;

        if (pauseRef.current) {
          await pauseRef.current.promise;
        }

        const nodeId = current.id;
        const label = getNodeLabel(current);
        const def = nodeDefinitionByType[current.type ?? ''];

        setCurrentNodeId(nodeId);
        setNodeStatus(nodeId, 'running');
        addLog(nodeId, label, 'running', `Executing ${label}...`);

        const delay = randomDelay();
        const startTime = Date.now();

        await sleep(delay, abort.signal);

        const elapsed = Date.now() - startTime;
        const isFlowNode = current.type === 'start' || current.type === 'end';
        const shouldError = !isFlowNode && Math.random() < ERROR_PROBABILITY;

        if (shouldError) {
          if (lastTraversedEdgeId) {
            setEdgeStatus(lastTraversedEdgeId, 'completed');
          }
          setNodeStatus(nodeId, 'error');
          addLog(
            nodeId,
            label,
            'error',
            `${label} failed: Simulated error - ${def?.functionName ?? 'Function'} threw an exception.`,
            elapsed
          );
          setState('error');
          setCurrentNodeId(null);
          setCurrentEdgeId(null);
          addLog('system', 'System', 'error', `Workflow execution failed at "${label}".`);
          return;
        }

        setNodeStatus(nodeId, 'completed');
        completed++;
        setProgress({ completed, total: totalNodes });
        addLog(nodeId, label, 'completed', `${label} completed successfully.`, elapsed);

        if (current.type === 'end') {
          break;
        }

        const nextNodes = getNextNodes(current.id, current, edges, nodes);
        const nextNode = nextNodes[0] ?? null;

        if (current.type === 'ifCondition') {
          const chosen = nextNode;
          if (chosen) {
            const edge = edges.find((e) => e.source === current!.id && e.target === chosen.id);
            const branch = edge?.sourceHandle === 'yes' ? 'YES' : 'NO';
            addLog(nodeId, label, 'completed', `Condition evaluated: took ${branch} branch.`);
          }
        }

        if (nextNode) {
          const traversedEdge = edges.find((e) => e.source === current!.id && e.target === nextNode.id);
          if (traversedEdge) {
            if (lastTraversedEdgeId && lastTraversedEdgeId !== traversedEdge.id) {
              setEdgeStatus(lastTraversedEdgeId, 'completed');
            }
            lastTraversedEdgeId = traversedEdge.id;
            setCurrentEdgeId(traversedEdge.id);
            setEdgeStatus(traversedEdge.id, 'active');
          }
        }

        current = nextNode;

        if (!current && nodes.some((n) => n.type === 'end')) {
          if (lastTraversedEdgeId) {
            setEdgeStatus(lastTraversedEdgeId, 'completed');
          }
          addLog('system', 'System', 'error', 'No connected next node found. Workflow may be incomplete.');
          setState('error');
          setCurrentNodeId(null);
          setCurrentEdgeId(null);
          return;
        }
      }

      if (!abort.signal.aborted) {
        if (lastTraversedEdgeId) {
          setEdgeStatus(lastTraversedEdgeId, 'completed');
        }
        setState('completed');
        setCurrentNodeId(null);
        setCurrentEdgeId(null);
        addLog('system', 'System', 'completed', 'Workflow execution completed successfully.');
      }
    } catch (err: unknown) {
      if (lastTraversedEdgeId) {
        setEdgeStatus(lastTraversedEdgeId, 'completed');
      }
      if (err instanceof DOMException && err.name === 'AbortError') {
        addLog('system', 'System', 'skipped', 'Workflow execution stopped by user.');
        setState('idle');
        setCurrentNodeId(null);
        setCurrentEdgeId(null);
      } else {
        addLog('system', 'System', 'error', `Unexpected error: ${String(err)}`);
        setState('error');
        setCurrentNodeId(null);
        setCurrentEdgeId(null);
      }
    }
  }, [nodesRef, edgesRef, addLog, setNodeStatus, setEdgeStatus]);

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

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    pauseRef.current?.resolve();
    pauseRef.current = null;
    setState('idle');
    setCurrentNodeId(null);
    setCurrentEdgeId(null);
  }, []);

  const reset = useCallback(() => {
    stop();
    setNodeStatuses({});
    setEdgeStatuses({});
    setLogs([]);
    setProgress({ completed: 0, total: 0 });
    logIdRef.current = 0;
  }, [stop]);

  return {
    state,
    currentNodeId,
    currentEdgeId,
    nodeStatuses,
    edgeStatuses,
    logs,
    progress,
    run,
    pause,
    resume,
    stop,
    reset,
  };
}
