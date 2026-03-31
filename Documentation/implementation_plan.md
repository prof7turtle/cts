# Implementation Plan: Fix All 5 Gaps in Dynamic Workflow Builder

## Problem
The current implementation has generic node types, a simplified hook schema output, no action-level configurability, no JSON download, and only supports single Pre/Post hook entries. These need to match the real Cogitate backend specifications from the reference files.

## Proposed Changes

### Backend & Logic Layer

---

#### [MODIFY] [nodeTypes.ts](file:///x:/cts/app/components/nodes/nodeTypes.ts)

**What changes:** Replace the 15 generic node definitions with the **22 real Cogitate functions** from [Hooks-Action-Function-Struture.json](file:///x:/cts/Dynamic%20Workflow/Hooks-Action-Function-Struture.json). Each node will have:
- `type`: camelCase ID (e.g., `generateQuoteNumber`)
- `label`: Human-readable name (e.g., `Generate Quote Number`)
- `functionName`: Exact Cogitate function name (e.g., `GenerateQuoteNumber`)
- `category`: Correct `Pre Hook` or `Post Hook` classification
- `defaultModuleName`: Default npm module (e.g., `@cogitate/core-pos-components`)
- `description`: Brief description of what it does

Keep `start`, `end`, `wait`, `manualReview`, and `ifCondition` (Flow/Decision) nodes as-is. Add new fields `defaultModuleName` and `description` to the [NodeDefinition](file:///x:/cts/app/components/nodes/nodeTypes.ts#3-14) interface.

---

#### [MODIFY] [hookSchema.ts](file:///x:/cts/app/components/hookSchema.ts)

**What changes:** Complete rewrite of the schema conversion logic to:
1. Read `requestName`, `isEndpoint`, `condition`, `path`, `moduleName`, `staticParams` from each node's data
2. **Group actions by `requestName`** — nodes with the same `requestName` go into the same hook entry
3. Support **multiple Pre and Post hook entries** (one per unique `requestName`)
4. Produce output matching the exact [Sample-HookSchema.json](file:///x:/cts/Dynamic%20Workflow/Sample-HookSchema.json) format
5. Update [hookSchemaToCanvas()](file:///x:/cts/app/components/hookSchema.ts#98-149) to restore all action-level properties when importing

The [BuilderNodeData](file:///x:/cts/app/components/nodes/CustomNodes.tsx#7-12) interface will be expanded to include all action-level fields.

---

#### [MODIFY] [schema.ts](file:///x:/cts/lib/graphql/schema.ts)

**What changes:** Extend `NodeDataInput` and [NodeData](file:///x:/cts/app/components/nodes/CustomNodes.tsx#7-12) types with new fields:
- `moduleName: String`
- `isEndpoint: Boolean`
- `requestName: String`
- `path: String`
- `callFunction: Boolean`
- `description: String`

This ensures the GraphQL API can store and return the full action configuration.

---

### Frontend (Minimal Changes)

---

#### [MODIFY] [WorkflowBuilder.tsx](file:///x:/cts/app/components/WorkflowBuilder.tsx)

**What changes (minimal):**
1. Add a **"Download JSON"** button that saves the exported schema as a [.json](file:///x:/cts/package.json) file via browser's native download
2. Expand the [BuilderNodeData](file:///x:/cts/app/components/nodes/CustomNodes.tsx#7-12) type to include all action-level fields
3. Update `onDrop` to set default values for new action-level fields from node definitions
4. Expand the node property panel to show/edit action-level fields (requestName, moduleName, condition, isEndpoint, path) for the selected node — *this is essential for usability but kept as a simple form, not a major frontend feature*

---

#### [MODIFY] [CustomNodes.tsx](file:///x:/cts/app/components/nodes/CustomNodes.tsx)

**What changes (minimal):** Update the [BuilderNodeData](file:///x:/cts/app/components/nodes/CustomNodes.tsx#7-12) type to include the new fields so TypeScript doesn't complain. No visual changes to node rendering.

---

## Files NOT Being Changed
- [resolvers.ts](file:///x:/cts/lib/graphql/resolvers.ts) — No changes needed (handles generic `data` object)
- [store.ts](file:///x:/cts/lib/graphql/store.ts) — No changes needed (stores `data` as `Record<string, any>`)
- [NodesPanel.tsx](file:///x:/cts/app/components/NodesPanel.tsx) — No changes needed (already dynamically reads from `nodeDefinitions`)
- [page.tsx](file:///x:/cts/app/page.tsx) — No changes needed
- [WorkflowList.tsx](file:///x:/cts/app/components/WorkflowList.tsx) — No changes needed
- [useWorkflow.ts](file:///x:/cts/app/components/useWorkflow.ts) — No changes needed
- [server.ts](file:///x:/cts/lib/graphql/server.ts) — No changes needed
- [workflow.ts](file:///x:/cts/app/actions/workflow.ts) (server actions) — Will add new fields to the [fetchWorkflowById](file:///x:/cts/app/actions/workflow.ts#76-121) query

## Verification Plan

### Automated — Build Check
```bash
cd x:\cts
npm run build
```
The project must compile without errors. This validates all TypeScript types are correct across all modified files.

### Manual — Visual Verification
1. Run `npm run dev` and open `http://localhost:3000`
2. Switch to the **Builder** tab
3. Verify the **Action Library** sidebar shows the real Cogitate functions organized by category (Flow, Decision, Pre Hook, Post Hook)
4. Drag a **Generate Quote Number** node onto the canvas
5. Click the node — verify the **property panel** appears showing: RequestName, ModuleName, Condition, isEndpoint, Path fields
6. Click **Export Hook Schema** — verify the JSON output matches the [Sample-HookSchema.json](file:///x:/cts/Dynamic%20Workflow/Sample-HookSchema.json) structure with proper `RequestName`, `Actions`, `Condition`, `ModuleName`, etc.
7. Click **Download JSON** — verify a [.json](file:///x:/cts/package.json) file is downloaded
8. Add multiple nodes with **different RequestName values** — verify the export groups them into separate hook entries
9. Paste a valid hook schema JSON and click **Import Hook Schema** — verify nodes appear on canvas with correct types and properties
