# Execution Engine

The execution engine simulates a workflow run on the canvas without making any real API calls. It traverses the node graph, applies timed delays, and updates the visual state of nodes and edges in real time.

## Purpose

The execution engine exists to help developers validate that their workflow logic is structured correctly before deploying the configuration. It provides:

- Node-by-node visual highlighting with color-coded status (running, completed, error, skipped)
- Edge animation showing the active data path
- A structured log dock with timestamps, durations, and status per node
- Pause, resume, and stop controls

## Architecture

The engine is implemented as a React hook in `app/components/useExecutionEngine.ts`.

```typescript
export function useExecutionEngine(
  nodesRef: () => Node[],
  edgesRef: () => Edge[]
): ExecutionEngine
```

It takes two callback refs (functions that return the current nodes and edges) rather than the values directly. This avoids stale closure issues during long-running async traversal.

## ExecutionEngine Interface

```typescript
interface ExecutionEngine {
  state: ExecutionState;          // 'idle' | 'running' | 'paused' | 'completed' | 'error'
  currentNodeId: string | null;   // ID of the node currently being processed
  currentEdgeId: string | null;   // ID of the edge currently being traversed
  nodeStatuses: Record<string, NodeExecStatus>;  // status per node ID
  edgeStatuses: Record<string, EdgeExecStatus>;  // status per edge ID
  logs: LogEntry[];               // ordered list of log entries
  progress: { completed: number; total: number };
  run: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}
```

## Execution States

| State | Description |
|---|---|
| `idle` | No execution in progress. This is the initial state. |
| `running` | Actively traversing the graph. |
| `paused` | Traversal is suspended at the current node. |
| `completed` | Traversal reached an End node or exhausted all paths successfully. |
| `error` | A simulated error occurred on a node, or the graph structure is invalid. |

## Node Execution Status

Each node is assigned one of these statuses during a run:

| Status | Visual Effect |
|---|---|
| `idle` | Default appearance |
| `running` | Pulsing green border with animation |
| `completed` | Solid green border |
| `error` | Red border |
| `skipped` | No visual change |

## Edge Execution Status

| Status | Visual Effect |
|---|---|
| `idle` | Default edge appearance |
| `active` | Animated dashed green stroke |
| `completed` | Solid green stroke |

## Execution Flow

### Starting a Run

When `run()` is called:

1. The first `start` node is located. If none is found, an error is logged and the state transitions to `error`.
2. All nodes are initialized to `idle` status, all edges to `idle`.
3. The log list is cleared.
4. An `AbortController` is created to support stopping mid-run.
5. Traversal begins at the Start node.

### Node Traversal

For each node:

1. The node status is set to `running`.
2. A random delay between 800ms and 1500ms is awaited. This simulates real processing time.
3. With 10% probability (excluding Start and End nodes), a simulated error is triggered. The node status becomes `error`, an error is logged, and the run terminates.
4. If no error, the node status becomes `completed`.
5. Outgoing edges are examined to find the next node.

### If/Else Branch Resolution

When the current node is an `ifCondition` node, the engine picks a branch randomly (50/50 YES or NO) to simulate runtime condition evaluation. The chosen branch's edge becomes `active`, and traversal continues down that branch.

### Pause and Resume

Pausing is implemented using a Promise that resolves when `resume()` is called. The traversal loop checks `pauseRef` at the start of each node iteration and awaits the pause promise if it is set.

### Stopping

Calling `stop()` triggers the `AbortController`, which causes the `sleep()` promise to reject with an `AbortError`. The catch block handles this gracefully and sets the state back to `idle`.

### Completion

When an End node is processed or the traversal runs out of connected nodes, the state transitions to `completed`.

## Log Entry Structure

```typescript
interface LogEntry {
  id: number;          // Monotonically increasing identifier
  timestamp: Date;     // When the log entry was created
  nodeId: string;      // ID of the node this entry belongs to ('system' for system messages)
  nodeLabel: string;   // Display label of the node
  status: NodeExecStatus;
  message: string;     // Human-readable description
  duration?: number;   // Milliseconds the node took to process (undefined for system entries)
}
```

## Visual Integration

`WorkflowBuilder.tsx` uses two `useMemo` hooks to inject execution state into the React Flow render cycle:

**displayNodes**: Maps over the nodes array and sets `data.executionStatus` on each node to its current status. The custom node components read this field to apply the correct visual treatment.

**displayEdges**: Maps over the edges array and sets the stroke color and animation based on each edge's `edgeStatuses` value.

These derived arrays are passed directly to the `<ReactFlow>` component's `nodes` and `edges` props. The execution engine state never mutates the canonical `nodes` and `edges` state - it only produces a derived view.

## Simulation Limitations

The execution engine is a simulation. It does not:

- Call any real functions or APIs
- Evaluate condition expressions (branches are chosen randomly)
- Respect `CallFunction: false` settings
- Enforce ordering between multiple workflow columns (only the first Start node is used)
- Simulate parallel execution paths simultaneously

It is intended as a structural validation and demonstration tool only.
