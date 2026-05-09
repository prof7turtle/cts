# Canvas to Schema: Serialization Engine

This document explains the internal logic of `app/components/hookSchema.ts`, which converts between the React Flow visual canvas and the HookConfig JSON schema.

## Overview

The serialization engine performs two inverse transformations:

- `canvasToHookSchema` - Reads nodes and edges from the canvas and produces a `HookConfig` JSON object.
- `hookSchemaToCanvas` - Reads a `HookConfig` JSON object and produces a set of nodes and edges to populate the canvas.

Both functions are pure: they take inputs and return outputs with no side effects. They do not read from or write to any external state.

## canvasToHookSchema

**Signature:**
```typescript
function canvasToHookSchema(
  nodes: Node[],
  edges: Edge[],
  clientCode: string
): HookConfig
```

### Step 1: Filter Action Nodes

Nodes of type `start`, `end`, `requestNameLabel`, and `group` are excluded. Only action nodes (Pre Hook, Post Hook, Decision) are processed.

### Step 2: Sort by Position

Action nodes are sorted by vertical position (Y coordinate) then horizontal position (X coordinate). This ensures the export order reflects the visual top-to-bottom reading order of the canvas.

### Step 3: Build Edge Indexes

Two lookup structures are built:
- `nodeById` - Maps node ID to node object for O(1) lookup.
- `incomingByTarget` - Maps each node ID to the list of edges pointing to it.

### Step 4: Collect Start Node Metadata

For each `start` node, the `requestName`, `needCascading`, `hookCallCascading`, and `staticParams` values are extracted from the node's data. These are stored in a `startNodeMetas` map keyed by request name.

### Step 5: Condition Inference

The condition resolver (`inferNodeCondition`) is called recursively for each action node. It walks backwards through incoming edges:

- If the node has a direct edge from an `ifCondition` node:
  - If the edge's `sourceHandle` is `yes`, the node inherits the condition expression from the If/Else node.
  - If the edge's `sourceHandle` is `no`, the node inherits `not(<expression>)`.
  - The inherited condition from the If/Else node itself (from its own incoming path) is prepended and combined with `and`.
- If the node has exactly one incoming edge from a non-condition node, the condition is propagated from that node.
- Results are cached to avoid redundant traversal.

### Step 6: Separate Pre and Post Nodes

- Nodes categorized as `Post Hook` and not of type `ifCondition` go to `postNodes`.
- All other action nodes (including `ifCondition`) go to `preNodes`.

### Step 7: Group by Start Node

`groupNodesByRequestName` creates one `HookEntry` per Start node anchor. It resolves the request name by tracing edges backwards from each node to find its associated Start node, or falls back to the parent group node.

### Step 8: Build Actions

For each group, `buildAction` constructs a `HookAction` object from the node's data and definition:

- `FunctionName` comes from the node definition's `functionName` field.
- `ModuleName` comes from the node's `moduleName` data property or the definition's `defaultModuleName`.
- `Condition` is the resolved condition string from step 5.
- `isEndpoint` and `callFunction` come from the node data, defaulting to `false` and `true` respectively.

## hookSchemaToCanvas

**Signature:**
```typescript
function hookSchemaToCanvas(config: HookConfig): {
  nodes: Node[];
  edges: Edge[];
}
```

### Step 1: Group by Request Name

`groupHooksByRequestName` merges Pre and Post hook entries that share the same `RequestName` into a single `RequestNameGroup`. The order of groups follows the first-seen order in the Pre array.

### Step 2: Build Workflow Columns

For each request name group, `buildWorkflowColumn` constructs a vertical column of nodes:

**Column layout (top to bottom):**
```
[Request Name Label]   <- decorative, draggable, not in schema
[Start Node]           <- carries metadata (cascading, params)
[Action nodes]         <- one per HookAction
[End Node]             <- terminator
```

All nodes in a column share the same invisible `group` parent node so they move together when dragged.

Columns are spaced horizontally with a 60px gap. Column width is 420px.

### Step 3: Action Node Placement

For each `HookAction` in the group's combined action list (pre followed by post):

**If the action is `EvaluateCondition`:**
- An `ifCondition` node is created at the current cursor Y position.
- The cursor Y advances by 150px.
- An `activeCondition` state is set, tracking the condition expression, the yes/no branch tail node IDs, and the next Y position for each branch.

**If there is an active condition and the action has an explicit branch path:**
- The branch path is determined from the action's `Path` field or inferred by comparing the action's `Condition` to the If/Else expression.
- The action node is placed offset from center (left for yes, right for no).
- Edges connect from the If/Else node's yes/no handle (or from the current branch tail).

**Otherwise:**
- The action is placed inline on the main vertical line.
- If an active condition was open, both its yes and no tails are connected to this node (joining the branches).

### Step 4: Edge Creation

Edges use the `smoothstep` type. For If/Else branch connections, the `sourceHandle` is set to `yes` or `no` to trigger the correct handle on the If/Else node renderer.

### Step 5: End Node

An End node is placed below the last action node (or below both branch tails if a condition was open at the end). Both branch tails are connected to the End node.

## Condition Normalization

When the builder compares conditions to determine branch paths during import, it normalizes both strings by:
1. Removing all whitespace.
2. Converting to lowercase.

This ensures that `Transaction.Type = 'Quote'` and `transaction.type='quote'` are treated as equivalent when matching against `not(transaction.type='quote')`.

## Negative Condition

The negative form of a condition is `not(<expression>)`. This convention is used by the builder to identify the NO branch of an If/Else node during import. If a downstream action's condition matches `not(<ifExpression>)`, it is placed on the NO branch.

## Round-Trip Accuracy

The serializer is designed to produce a visually clean canvas when a schema is exported and immediately re-imported. However, some information is not fully recoverable:

- Exact node positions within a column are regenerated on import using fixed spacing rules, not from the original positions.
- Custom node positions, sizes, or inter-column arrangements are not persisted in the schema.
- The schema represents logical structure; the canvas represents visual layout.

If pixel-perfect round-tripping of layout is required, the canvas state would need to be saved separately (e.g., as a custom JSON format that includes React Flow's full node and edge position data).
