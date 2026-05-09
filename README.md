# CTS Workflow Builder

A visual workflow builder for constructing, editing, and exporting insurance policy hook configurations (HookSchema). Built with Next.js, React Flow, and an in-browser execution simulator.

## Overview

CTS Workflow Builder provides a drag-and-drop canvas where engineers and configuration managers can:

- Design Pre-Hook and Post-Hook action workflows for insurance transactions
- Configure cascading behavior, conditions, static parameters, and module bindings
- Export the canvas state as a standards-compliant HookSchema JSON
- Import an existing HookSchema and restore the full visual canvas
- Simulate workflow execution with real-time node highlighting and structured logs
- Create custom hook nodes backed by Monaco-editor JavaScript code
- Use an AI chat panel to generate or modify workflows from natural language

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Canvas | React Flow (@xyflow/react) |
| Styling | Vanilla CSS (custom design system in globals.css) |
| Icons | Lucide React |
| Code Editor | Monaco Editor |
| AI Integration | Vercel AI SDK with Google Generative AI |
| Backend (Workflow List) | Apollo Server 5 with in-memory GraphQL store |
| Language | TypeScript 5 |

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd cts

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Add your GOOGLE_GENERATIVE_AI_API_KEY to .env

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
cts/
  app/
    page.tsx                  # Root page: tab switcher between List and Builder
    layout.tsx                # App shell layout
    globals.css               # Full design system and all component styles
    components/
      WorkflowBuilder.tsx     # Main builder canvas component
      WorkflowList.tsx        # Workflow management list page
      NodesPanel.tsx          # Left sidebar node library
      ExecutionLogs.tsx       # Execution log dock
      hookSchema.ts           # Canvas <-> HookSchema serialization engine
      customHooksStore.ts     # localStorage-backed custom hook registry
      useExecutionEngine.ts   # Workflow simulation hook
      nodes/
        nodeTypes.ts          # All node definitions
        CustomNodes.tsx       # React Flow custom node renderers
        CustomHookNode.tsx    # Custom hook node renderer
        RequestNameLabelNode.tsx
      chat/
        WorkflowChatPanel.tsx # AI chat panel
    actions/
      workflow.ts             # Server actions calling the GraphQL API
    api/
      graphql/route.ts        # Apollo GraphQL endpoint
      chat/route.ts           # AI streaming chat endpoint
    custom-hooks/
      new/page.tsx            # Create / edit custom hook page
  lib/
    graphql/
      schema.ts               # GraphQL type definitions
      resolvers.ts            # GraphQL resolvers
      store.ts                # In-memory workflow data store
      server.ts               # Apollo Server instance
    workflow-ai/
      systemPrompt.ts         # AI system prompt for workflow generation
      parser.ts               # AI response parser
      normalize.ts            # Schema normalization utilities
  Documentation/              # All project documentation
  Dynamic Workflow/           # Reference JSONs and architecture diagrams
```

## Documentation

Full technical documentation is available in the [Documentation](./Documentation/) folder.

Start with [getting-started.md](./Documentation/getting-started.md) if you are a new contributor.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## License

Private. All rights reserved.
