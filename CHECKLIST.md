# Workflow Builder – Fix Checklist

| # | Issue | ✅ Done | Next Action |
|---|-------|--------|-------------|
| 1 | ID Generation Collisions | ☐ | Reset nodeId/edgeId in clearCanvas or switch to UUIDs |
| 2 | Stale Dragged Hook Data | ☐ | Clear draggedHookData on every drag start or after drop |
| 3 | Performance on Large Graphs | ☐ | Memoise engine status maps; recompute displayNodes/displayEdges only when they change |
| 4 | Uninformative Import Errors | ☐ | Show the actual parse error message when JSON.parse fails |
| 5 | Execution Race Condition on Run | ☐ | Make engine.reset async and await it before calling engine.run |
| 6 | Missing Visual Cue for "skipped" Status | ☐ | Add a CSS class for skipped nodes in getExecClassName |
| 7 | Accessibility of Status Indicators | ☐ | Add aria‑label or tooltip to status indicator badge |
| 8 | Responsive Layout Limitations | ☐ | Replace fixed flex width with responsive layout / collapsible panel |
| 9 | Code Duplication in onDrop | ☐ | Extract a helper to build node objects for both custom hook and regular nodes |
|10| Type Safety Gaps | ☐ | Add runtime type‑guards before casting node data |
