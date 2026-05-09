# System Architecture

This document describes the overall system structure, the data flow between layers, and the responsibility of each major module.

## High-Level Overview

The CTS Workflow Builder is a single Next.js application that serves two distinct purposes from the same codebase:

1. **Visual Workflow Builder** - A fully client-side canvas where users design hook workflows, configure them, and export them as HookSchema JSON. No server persistence is involved in this flow.

2. **Workflow Management List** - A CRUD interface backed by an in-process Apollo GraphQL server with an in-memory store. This layer allows saving and organizing named workflows.

These two surfaces share the same URL (controlled by a `?view=` query parameter) but operate independently. The Builder never reads from or writes to the GraphQL store; it works entirely with local React state and `localStorage`.

## Folder Structure

```
cts/
  app/                          # Next.js App Router root
    page.tsx                    # Shell: tab switcher (list vs builder)
    layout.tsx                  # HTML shell, font imports, metadata
    globals.css                 # All styles - single file design system
    components/
      WorkflowBuilder.tsx       # Canvas shell and all sidebar panels
      WorkflowList.tsx          # Workflow CRUD list
      NodesPanel.tsx            # Left sidebar: draggable node library
      ExecutionLogs.tsx         # Bottom dock: real-time execution logs
      hookSchema.ts             # Core serialization engine
      customHooksStore.ts       # localStorage CRUD for custom hooks
      useExecutionEngine.ts     # Simulation hook
      nodes/
        nodeTypes.ts            # Source of truth for all node definitions
        CustomNodes.tsx         # React Flow node component registry
        CustomHookNode.tsx      # Renderer for user-defined hook nodes
        RequestNameLabelNode.tsx
      chat/
        WorkflowChatPanel.tsx   # AI chat sidebar
        messageUtils.ts         # Message role helpers
        types.ts                # Chat message type
    actions/
      workflow.ts               # Server Actions: GraphQL client wrappers
    api/
      graphql/route.ts          # Next.js route handler: Apollo execution
      chat/route.ts             # Next.js route handler: AI streaming
    custom-hooks/
      new/page.tsx              # Full-page form for creating custom hooks

  lib/
    graphql/
      schema.ts                 # GraphQL SDL type definitions
      resolvers.ts              # GraphQL resolver implementations
      store.ts                  # WorkflowStore class (in-memory Map)
      server.ts                 # Apollo Server singleton factory
    workflow-ai/
      systemPrompt.ts           # System prompt sent to the AI model
      parser.ts                 # Extracts HookConfig JSON from AI response
      normalize.ts              # Normalizes AI-generated schema before apply

  Documentation/                # All project documentation
  Dynamic Workflow/             # Reference JSON schemas and diagrams
```

## Module Responsibilities

### app/page.tsx

Entry point. Manages the `view` state (`list` | `builder`) and syncs it with the `?view=` URL parameter so browser back/forward navigation works correctly. Renders either `WorkflowList` or `WorkflowBuilder` inside the app shell.

### app/components/WorkflowBuilder.tsx

The largest file in the codebase. Owns:

- The React Flow canvas (nodes, edges, drag-and-drop, connection logic)
- The toolbar with client code input, execution controls, and menu actions
- The Schema Output sidebar (JSON textarea with copy, import, export)
- The Workflow Config sidebar (shown when a Start node is selected)
- The If/Else condition modal (shown on double-click of an ifCondition node)
- The AI chat sidebar integration
- The execution engine integration (node status highlighting, edge animation)
- Export, Import, and Download schema actions
- Group node system (invisible parent nodes that keep a workflow column together)

### app/components/hookSchema.ts

The serialization engine. Contains two exported functions and all supporting logic:

- `canvasToHookSchema(nodes, edges, clientCode)` - Converts the React Flow graph into a `HookConfig` object. Traverses edges to resolve conditions, groups nodes by their associated Start node, and separates Pre from Post hook nodes.
- `hookSchemaToCanvas(config)` - Converts a `HookConfig` back into React Flow nodes and edges. Creates one vertical column per RequestName, with group, label, start, action, and end nodes.

### app/components/nodes/nodeTypes.ts

The single source of truth for all node type definitions. Adding an entry here automatically makes the node available in the panel, on the canvas, and in schema export. No other file needs to be modified.

### app/components/customHooksStore.ts

Provides a localStorage-backed registry for user-created custom hooks. Functions are synchronous and use `localStorage` directly (guarded by a browser check). A custom event (`cts:custom-hooks-updated`) is dispatched after mutations so that the NodesPanel can refresh its list reactively.

### app/components/useExecutionEngine.ts

A React hook that simulates workflow execution. It traverses the graph from the first Start node, visits each connected node in sequence, introduces randomized delays per node (800ms to 1500ms), occasionally injects a simulated error (10% probability), and updates node/edge status state that is passed back to the canvas for visual highlighting.

### lib/graphql/

A self-contained GraphQL backend used exclusively by the Workflow List feature:

- `store.ts` - `WorkflowStore` class backed by a `Map`. Supports full CRUD for workflows, nodes, and edges.
- `schema.ts` - SDL defining all types, queries, and mutations.
- `resolvers.ts` - Resolver implementations delegating to the store.
- `server.ts` - Creates and caches an Apollo Server instance.

### lib/workflow-ai/

Support modules for the AI chat feature:

- `systemPrompt.ts` - Defines the instruction set given to the AI model, explaining the HookConfig schema structure and valid node types.
- `parser.ts` - Extracts a JSON block from the AI's text response.
- `normalize.ts` - Cleans up the AI-generated schema before it is applied to the canvas.

## Data Flow: Builder (Canvas to Schema)

```
User drags nodes and connects them
          |
          v
React Flow state (nodes[], edges[])
          |
          v
canvasToHookSchema(nodes, edges, clientCode)
          |
          v
Condition inference (edge traversal, branch path resolution)
          |
          v
groupNodesByRequestName (group by Start node anchor)
          |
          v
HookConfig { Client, Hooks: { Pre: [...], Post: [...] } }
          |
          v
JSON.stringify -> Schema Output textarea
```

## Data Flow: Schema to Canvas (Import)

```
User pastes JSON into Schema Output textarea
          |
          v
hookSchemaToCanvas(config: HookConfig)
          |
          v
groupHooksByRequestName (merge Pre + Post by RequestName)
          |
          v
buildWorkflowColumn (per RequestName group)
  - group node (invisible container)
  - label node
  - start node
  - action nodes (with edge connections)
  - if/else condition branching layout
  - end node
          |
          v
setNodes(), setEdges() -> React Flow re-renders
```

## Data Flow: Workflow List (GraphQL)

```
WorkflowList.tsx
  -> workflowActions.fetchWorkflows()   [Server Action]
      -> POST /api/graphql              [Apollo route handler]
          -> server.executeOperation()
              -> resolvers.ts
                  -> store.ts (in-memory Map)
```

## State Management

The application does not use a global state library. All state is local to components and passed via props or callbacks.

- **Canvas state** - Managed by `useNodesState` and `useEdgesState` from React Flow inside `WorkflowBuilder`.
- **Custom hooks** - Stored in `localStorage` and read synchronously on mount. Changes trigger a custom DOM event.
- **Execution state** - Owned by `useExecutionEngine` and injected into nodes as `executionStatus` data before render.
- **Workflow List data** - Fetched on mount and updated optimistically after mutations.

## Key Design Decisions

**Single CSS file**: All styles live in `globals.css`. This avoids CSS-in-JS overhead and keeps the design system centralized. Inline styles are used sparingly only where CSS specificity conflicts cannot be resolved via class composition (such as within the sidebar where the toolbar button rule would otherwise cascade in).

**Group node system**: Each Request workflow column is wrapped in an invisible React Flow group node. This allows the entire column (label, start, actions, end) to move together when dragged, without needing a custom dragging implementation.

**No server persistence for the builder**: The canvas state intentionally stays in browser memory. This keeps the builder fast and removes the need for conflict resolution when multiple users edit the same workflow. Export/import is the handoff mechanism.

**In-memory GraphQL store**: The Workflow List backend uses a simple in-memory Map. This is appropriate for a POC or internal tool where persistence across restarts is not required. Replacing it with a real database requires only changes to `lib/graphql/store.ts` and the resolver implementations.
