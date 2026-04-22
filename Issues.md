# Known Issues for Workflow Builder UI and Custom Nodes

## 1. ID Generation Collisions
- **Problem**: `nodeId` and `edgeId` are simple incrementing counters that are never reset when the canvas is cleared.
- **Impact**: After multiple clears the same ID may be reused, causing React Flow to treat a new node/edge as an existing one, leading to stale UI state or lost connections.
- **Suggested Fix**: Reset the counters in `clearCanvas` or switch to UUIDs (`crypto.randomUUID()`).

## 2. Stale Dragged Hook Data
- **Problem**: `draggedHookData` is set on `onDragStart` but only cleared when a custom‑hook node is dropped. Dragging a non‑hook after a hook leaves old hook data in state.
- **Impact**: Dropping a regular node could unintentionally use stale hook data, creating malformed nodes.
- **Suggested Fix**: Clear `draggedHookData` on every drag start (`setDraggedHookData(null)`) and/or explicitly after handling a drop.

## 3. Performance on Large Graphs
- **Problem**: `displayNodes` and `displayEdges` recompute on every render, merging execution status into each node/edge.
- **Impact**: With many nodes/edges, these memoized calculations may cause UI jitter during execution updates.
- **Suggested Fix**: Memoize `engine.nodeStatuses` and `engine.edgeStatuses` separately, or use a selector that only recomputes when the specific status map changes.

## 4. Uninformative Import Errors
- **Problem**: `importSchema` catches JSON parse errors and only shows a generic *"Invalid hook schema JSON"* message.
- **Impact**: Users have no clue which part of the JSON is malformed, leading to frustration.
- **Suggested Fix**: Include `e.message` (or the caught error) in the user‑visible message.

## 5. Execution Race Condition on Run
- **Problem**: `handleRun` calls `engine.reset()` then uses `setTimeout` (50 ms) before `engine.run()`.
- **Impact**: If `reset` is asynchronous, the workflow may start before the engine has fully reset, producing inconsistent state.
- **Suggested Fix**: Make `reset` return a promise or expose an `onReady` callback, and only call `run` after the reset completes.

## 6. Missing Visual Cue for "skipped" Status
- **Problem**: `StatusIndicator` knows about a `skipped` status, but `getExecClassName` does not return a CSS class for it.
- **Impact**: Skipped nodes have no visual styling, making it hard to distinguish them in the UI.
- **Suggested Fix**: Add a `node-skipped` case in `getExecClassName` and define corresponding CSS.

## 7. Accessibility of Status Indicators
- **Problem**: Status badges rely solely on colour and Unicode icons.
- **Impact**: Users with colour‑vision deficiencies or screen readers may miss status information.
- **Suggested Fix**: Add `aria-label` or tooltip text describing the status (e.g., "running", "completed").

## 8. Responsive Layout Limitations
- **Problem**: When the schema panel is open the canvas width is fixed to 80 % (`flex: '0 0 80%'`).
- **Impact**: On narrow screens the canvas can become unusably small.
- **Suggested Fix**: Use responsive flex‑grow/shrink or a collapsible panel with media‑query breakpoints.

## 9. Code Duplication in `onDrop`
- **Problem**: The drop handler builds two similar node objects (custom hook vs regular) with duplicated fields.
- **Impact**: Increases maintenance burden and risk of inconsistencies.
- **Suggested Fix**: Extract a helper function that creates the base node structure and then merges hook‑specific data.

## 10. Type Safety Gaps
- **Problem**: Several places cast `node.data` to `BuilderNodeData` without runtime validation (e.g., `typedData = (data ?? {}) as BuilderNodeData`).
- **Impact**: If unexpected data shapes appear, runtime errors can occur.
- **Suggested Fix**: Add runtime checks or use TypeScript type guards before casting.

---

*These issues are based on a static code review. Some may already be mitigated by surrounding application logic or future commits. Use this list as a starting point for bug‑fixing and refactoring work.*