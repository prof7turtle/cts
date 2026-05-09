# Getting Started

This guide walks a new contributor through setting up the project locally, understanding the codebase layout, and making their first change.

## Prerequisites

Before you begin, ensure the following tools are installed on your machine.

| Tool | Minimum Version | Check |
|---|---|---|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Git | any recent | `git --version` |

A Google Generative AI API key is required only if you intend to use the AI chat panel feature. The rest of the application runs without it.

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd cts
```

### 2. Install dependencies

```bash
npm install
```

This installs all production and development dependencies declared in `package.json`.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

The `WORKFLOW_API_URL` variable is optional. If omitted, the app falls back to `http://localhost:3000` for internal GraphQL calls.

### 4. Start the development server

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000). You should see the Workflow Builder application load.

## Application Entry Points

The application has two primary views, toggled from the top navigation bar:

**Workflows tab** (`view=list`) renders `WorkflowList.tsx`. This page talks to the in-memory GraphQL backend to create, list, publish, archive, and duplicate saved workflows. Note that the backend is in-memory only - data does not survive a server restart.

**Builder tab** (`view=builder`) renders `WorkflowBuilder.tsx`. This is the main canvas. All state here is local to the browser session. You can export the canvas as a HookSchema JSON at any time.

## Understanding the Canvas

When you open the Builder tab:

1. A default Start node is placed on the canvas.
2. Open the left panel to browse available node types grouped by category: Flow, Decision, Pre Hook, Post Hook, and Custom.
3. Drag any node type onto the canvas. Nodes dropped near a Start node are automatically grouped under it.
4. Click the Start node to open the Workflow Config sidebar on the right. Set the Request Name, cascading options, and static parameters here.
5. Connect nodes by dragging from one node's handle to another.
6. Use Export Schema in the toolbar menu or Schema Output panel to generate the HookConfig JSON.
7. Use Execute in the toolbar to simulate the workflow with animated node-by-node progression and execution logs.

## Making Your First Change

### Adding a new node type

Node type definitions live in `app/components/nodes/nodeTypes.ts`. Each definition is a plain object in the `nodeDefinitions` array.

```typescript
{
  type: 'myNewHook',        // unique identifier used by React Flow
  label: 'My New Hook',    // display label in the panel and on the node
  icon: 'MN',              // two-letter abbreviation shown in node header
  color: '#6366f1',        // hex color for the node header
  category: 'Pre Hook',    // 'Flow' | 'Decision' | 'Pre Hook' | 'Post Hook'
  functionName: 'MyNewHookFunction',   // maps to FunctionName in the schema
  defaultModuleName: '@cogitate/core-pos-components',
  description: 'Short description shown in the node panel tooltip.',
}
```

After adding the definition, the node automatically appears in the left panel under its category, can be dragged onto the canvas, and will be included in schema export without any additional changes.

### Modifying the schema serializer

The serialization logic (canvas to JSON and JSON to canvas) lives entirely in `app/components/hookSchema.ts`. The two main exported functions are `canvasToHookSchema` and `hookSchemaToCanvas`. Changes to how conditions, branches, or request names are resolved should be made there.

### Changing the visual design

All styles are in `app/globals.css`. The file is organized into clearly labeled sections. The design system tokens (colors, radii, shadows, transitions) are declared as CSS custom properties at the top of the file under `:root`.

## Running a Production Build

```bash
npm run build
npm run start
```

The production build performs TypeScript type checking and tree shaking. Address any type errors reported by the build before merging changes.

## Common Issues

**Port 3000 already in use**
Run `npm run dev -- -p 3001` to use a different port.

**AI chat returns errors**
Verify that `GOOGLE_GENERATIVE_AI_API_KEY` in your `.env` file is valid and has not exceeded its quota.

**Schema export produces empty Pre or Post arrays**
This happens when no nodes are connected to a Start node. Ensure each node on the canvas has an unbroken path from a Start node.

**GraphQL errors in Workflow List**
The GraphQL store is in-memory. If the server restarts (e.g., due to hot-reload on a server file), all previously created workflows are lost. Refresh the page to resync.
