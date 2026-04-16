# CTS Project Documentation

## 1. Project Summary

This project is a **Next.js 16 + React 19 + TypeScript** application for building and visualizing insurance workflow logic.

Its main purpose is to let users:

- view existing workflows,
- create and manage workflow records,
- design workflows on a drag-and-drop canvas,
- simulate workflow execution with logs,
- convert the canvas into a `HookConfig` JSON structure,
- restore the canvas from a `HookConfig`,
- use AI chat to generate or modify workflow JSON.

At the moment, the backend is a **POC in-memory GraphQL API**, which means workflow data is stored in server memory and is reset when the server restarts.

## 2. How The Project Works

### High-level flow

1. The app loads in `app/page.tsx`.
2. The user switches between:
   - `WorkflowList` for workflow management,
   - `WorkflowBuilder` for visual workflow design.
3. Workflow CRUD operations call server actions in `app/actions/workflow.ts`.
4. Those server actions send GraphQL requests to `app/api/graphql/route.ts`.
5. The GraphQL route uses Apollo Server from `lib/graphql/server.ts`.
6. Apollo runs the schema and resolvers from `lib/graphql/schema.ts` and `lib/graphql/resolvers.ts`.
7. The resolvers read and update workflow data in the in-memory store at `lib/graphql/store.ts`.
8. In the builder, React Flow manages nodes and edges on the canvas.
9. `hookSchema.ts` converts between canvas data and HookConfig JSON.
10. AI chat sends prompts to `app/api/chat/route.ts`, which uses Google Gemini through the AI SDK.
11. The AI response is parsed and, when valid, applied back onto the canvas as workflow schema.

### Functional areas

- **UI shell**: layout, styling, navigation between list and builder.
- **Workflow list**: display workflow stats and perform CRUD-type actions.
- **Workflow builder**: drag-and-drop canvas, node editing, export/import.
- **Execution simulator**: run/pause/resume/reset the visual workflow.
- **AI assistant**: generate HookConfig JSON from natural language.
- **GraphQL backend**: workflow querying, mutations, validation, duplication.
- **Project references**: supporting docs, JSON reference files, architecture image.

## 3. Folder Structure Overview

### Top-level folders

- `.git/`: Git repository metadata.
- `.next/`: Next.js generated build/dev cache output.
- `app/`: App Router frontend, API routes, server actions, and components.
- `Documentation/`: project notes, walkthroughs, setup guides, and reference docs.
- `Dynamic Workflow/`: workflow reference assets and source JSON samples.
- `lib/`: reusable backend and AI utility logic.
- `node_modules/`: installed dependencies.
- `public/`: public static assets.

### Top-level files

- `.env.example`: sample environment variable template.
- `.gitignore`: ignores generated files like `node_modules`, `.next`, and local env files.
- `Contributing.md`: contribution placeholder/document.
- `eslint.config.mjs`: ESLint setup, with some folders ignored and `any` relaxed in selected files.
- `global.d.ts`: global TypeScript declarations.
- `initialData (1).json`: standalone JSON data/reference file.
- `next-env.d.ts`: Next.js TypeScript environment declarations.
- `next.config.js`: Next.js config with `reactStrictMode` and Turbopack root.
- `package-lock.json`: npm dependency lock file.
- `package.json`: project metadata, scripts, and dependencies.
- `postcss.config.mjs`: PostCSS setup for Tailwind usage.
- `README.md`: starter project readme.
- `tsconfig.json`: TypeScript compiler configuration with `@/*` path alias.
- `tsconfig.tsbuildinfo`: generated TypeScript incremental build metadata.

## 4. Detailed File And Folder Documentation

### 4.1 `app/`

This is the main application folder. It contains the layout, home page, server actions, API routes, and UI components.

#### `app/CogitateLogo.jpg`

- Brand/logo image shown in the sticky header.

#### `app/globals.css`

- Global styling for the entire application.
- Contains layout, builder, node, log, chat, modal, and other visual styles.

#### `app/layout.tsx`

- Root layout for the Next.js app.
- Loads the `Plus Jakarta Sans` font.
- Sets page metadata.
- Renders the sticky top header with the Cogitate logo and “Workflow Studio” label.
- Wraps all pages in the shared layout shell.

#### `app/page.tsx`

- Main homepage.
- Uses local state to switch between:
  - `WorkflowList`,
  - `WorkflowBuilder`.
- Acts as the entry screen for the full application.

### 4.2 `app/actions/`

This folder contains server actions that work like a frontend-friendly data layer for GraphQL.

#### `app/actions/workflow.ts`

- Central server action file for workflow operations.
- Builds GraphQL requests and sends them to `/api/graphql`.
- Exposes workflow operations such as:
  - fetch workflow list,
  - fetch a workflow by id,
  - search workflows,
  - fetch stats,
  - create/update/delete workflows,
  - publish/archive/validate/duplicate workflows,
  - create/update/delete nodes,
  - create/delete edges.
- Handles GraphQL response parsing and error forwarding.

### 4.3 `app/api/`

This folder contains HTTP API endpoints exposed by the Next.js app.

#### `app/api/chat/route.ts`

- AI chat endpoint.
- Receives chat messages and current workflow context.
- Converts messages into model format using the AI SDK.
- Calls Google Gemini (`gemini-2.5-flash`) using `@ai-sdk/google`.
- Uses a workflow-specific system prompt from `lib/workflow-ai/systemPrompt.ts`.
- Streams the AI response back to the UI.

#### `app/api/graphql/route.ts`

- GraphQL HTTP endpoint.
- Accepts GraphQL POST requests.
- Creates or reuses the Apollo Server instance.
- Executes incoming GraphQL queries/mutations.
- Returns JSON responses with CORS headers.
- Also exposes:
  - `OPTIONS` for CORS preflight,
  - `GET` as a health/info endpoint.

### 4.4 `app/components/`

This folder contains the main UI logic and stateful frontend building blocks.

#### `app/components/CustomHookModal.tsx`

- Modal dialog for creating a user-defined custom hook.
- Lets the user enter hook name, category, function name, module name, condition, and custom code.
- Uses Monaco Editor for the code input area.
- Performs simple validation before creating the hook.

#### `app/components/ExecutionLogs.tsx`

- Displays workflow execution logs during simulation.
- Shows execution state badges, progress bar, timestamps, status icons, and durations.
- Auto-scrolls as new logs are added.

#### `app/components/hookSchema.ts`

- One of the most important files in the project.
- Defines TypeScript types for:
  - `HookAction`,
  - `HookEntry`,
  - `HookConfig`,
  - builder node data.
- Contains conversion logic between:
  - React Flow canvas nodes/edges,
  - HookConfig JSON.
- Handles branch conditions for `ifCondition` nodes.
- Groups nodes into Pre and Post hooks using request names.
- Encodes workflow builder state into a format usable by the insurance hook model.

#### `app/components/NodesPanel.tsx`

- Left sidebar for the builder.
- Lists available workflow blocks grouped as:
  - Flow,
  - Decision,
  - Pre Hook,
  - Post Hook,
  - Custom hooks.
- Supports searching actions.
- Opens `CustomHookModal` to create a custom node.
- Supplies draggable blocks to the React Flow canvas.

#### `app/components/useExecutionEngine.ts`

- Custom hook that simulates workflow execution.
- Tracks:
  - execution state,
  - current node,
  - current edge,
  - node statuses,
  - edge statuses,
  - logs,
  - progress.
- Supports:
  - `run`,
  - `pause`,
  - `resume`,
  - `stop`,
  - `reset`.
- Randomly simulates delays and occasional failures for non-start/end nodes.
- Follows outgoing edges and handles simple yes/no branching for condition nodes.

#### `app/components/useWorkflow.ts`

- Custom hook that wraps workflow CRUD logic for the UI.
- Uses server actions from `app/actions/workflow.ts`.
- Transforms GraphQL workflow data into React Flow compatible node/edge structures.
- Exposes helper methods for loading, saving, publishing, validating, and editing workflows.

#### `app/components/WorkflowBuilder.tsx`

- Main visual builder screen.
- Uses `ReactFlow` and `ReactFlowProvider`.
- Manages canvas nodes, edges, selection state, schema text, client code, side panels, and AI chat visibility.
- Supports:
  - drag-and-drop node placement,
  - edge creation,
  - node/edge deletion,
  - clear canvas,
  - fit view,
  - condition editing,
  - export schema,
  - import schema,
  - download JSON,
  - execution simulation controls,
  - AI chat-driven workflow updates.
- Integrates:
  - `NodesPanel`,
  - `ExecutionLogs`,
  - `WorkflowChatPanel`,
  - node type definitions,
  - schema conversion utilities,
  - execution engine.

#### `app/components/WorkflowList.tsx`

- Dashboard/list view for workflows.
- Loads workflow data and workflow stats on mount.
- Shows overview metric cards.
- Renders a workflow table with actions such as:
  - edit,
  - publish,
  - duplicate,
  - archive,
  - delete.
- Uses server actions to keep UI and backend state in sync.

### 4.5 `app/components/chat/`

Files related to the AI chat workflow assistant.

#### `app/components/chat/messageUtils.ts`

- Extracts plain text from AI SDK message objects.
- Supports both `content` and `parts` based message structures.

#### `app/components/chat/types.ts`

- Shared TypeScript props for the workflow chat panel.

#### `app/components/chat/WorkflowChatPanel.tsx`

- Chat UI for describing workflow changes in natural language.
- Uses `useChat` from `@ai-sdk/react`.
- Sends the current workflow schema to the `/api/chat` endpoint.
- Parses assistant output through `extractAgentPayload`.
- Normalizes AI-generated conditions.
- Applies returned HookConfig directly to the builder canvas.

### 4.6 `app/components/nodes/`

These files define how nodes look, behave, and are categorized.

#### `app/components/nodes/CustomHookNode.tsx`

- Specialized React Flow node renderer for custom hooks.
- Displays a custom visual style and execution status badge.

#### `app/components/nodes/CustomNodes.tsx`

- Registers the node components used by React Flow.
- Maps normal node types to a shared base node renderer.
- Maps `customHook` to `CustomHookNode`.
- Adds execution styling and condition-specific handles.

#### `app/components/nodes/NodeStatusBadge.tsx`

- Small badge shown on nodes during execution.
- Displays state such as running, done, error, or skipped.

#### `app/components/nodes/nodeTypes.ts`

- Defines the node catalog used throughout the builder.
- Declares categories, labels, icons, colors, default module names, descriptions, and default request/condition data.
- Includes flow nodes, decision nodes, pre-hook actions, and post-hook actions.
- Works as the master metadata source for the node library.

#### `app/components/nodes/pastelPalette.ts`

- Central color palette utility for node groups and custom hooks.
- Keeps sidebar and canvas visuals consistent across categories.

### 4.7 `lib/`

This folder contains reusable backend and AI utility code.

### 4.8 `lib/graphql/`

GraphQL backend implementation for the POC.

#### `lib/graphql/resolvers.ts`

- GraphQL resolver implementation.
- Connects GraphQL queries and mutations to store operations.
- Adds request validation and success/error response formatting.

#### `lib/graphql/schema.ts`

- GraphQL schema definition.
- Declares:
  - enums,
  - input types,
  - object types,
  - queries,
  - mutations,
  - subscriptions.
- Defines the workflow, node, edge, and stats contract used by the frontend.

#### `lib/graphql/server.ts`

- Creates and caches a singleton Apollo Server instance.
- Loads the GraphQL schema and resolvers.
- Enables introspection for the POC.

#### `lib/graphql/store.ts`

- In-memory data store for the application.
- Seeds a sample workflow on startup.
- Implements all core operations for:
  - workflows,
  - nodes,
  - edges,
  - search,
  - stats,
  - validation,
  - duplication.
- Important limitation:
  - data is not persisted to a real database.

### 4.9 `lib/workflow-ai/`

AI helper logic used by the workflow chat assistant.

#### `lib/workflow-ai/normalize.ts`

- Normalizes `Condition` values in HookConfig.
- Ensures conditions are consistently stored as `{ expression: "..." }`.

#### `lib/workflow-ai/parser.ts`

- Parses structured AI output from assistant text.
- Extracts content inside:
  - `<HOOK_CONFIG_JSON>...</HOOK_CONFIG_JSON>`,
  - `<REACT_FLOW_JSON>...</REACT_FLOW_JSON>`.
- Includes fallback parsing from JSON code blocks.

#### `lib/workflow-ai/systemPrompt.ts`

- Builds the system prompt used for the AI workflow assistant.
- Defines the required HookConfig output format.
- Lists allowed function names and branching rules.
- Embeds current workflow context so the AI can modify existing workflows intelligently.

### 4.10 `public/`

Static public assets.

#### `public/favicon.ico`

- Browser tab icon for the app.

### 4.11 `Documentation/`

Reference and support documentation already present in the repo.

#### `Documentation/api.md`

- Small API-related note file.

#### `Documentation/cogitate_deep_analysis.md`

- Deep analysis document related to the project/domain.

#### `Documentation/graphql-api.md`

- Documentation for the GraphQL API.

#### `Documentation/implementation_plan.md`

- Implementation planning notes.

#### `Documentation/POC_SETUP.md`

- POC setup instructions.

#### `Documentation/project_walkthrough.md`

- Walkthrough of the project structure and behavior.

#### `Documentation/walkthrough.md`

- Large detailed walkthrough/reference document.

#### `Documentation/Workflow-Builder-Technical-Guide.pdf`

- PDF technical guide for the workflow builder.

#### `Documentation/workflow.md`

- Short workflow-related note file.

#### `Documentation/project_inventory_and_working.md`

- This document.
- Consolidates the project summary, structure, file responsibilities, and working model.

### 4.12 `Dynamic Workflow/`

Reference assets and sample workflow-related files used for understanding the domain model.

#### `Dynamic Workflow/Architecture.png`

- Architecture diagram image.

#### `Dynamic Workflow/Hooks-Action-Function-Struture.json`

- Reference mapping of hook actions and functions.

#### `Dynamic Workflow/HookSchema-Field-Descriptions.json`

- Reference descriptions for HookSchema fields.

#### `Dynamic Workflow/resolvers-schema.json`

- JSON reference for resolver/schema information.

#### `Dynamic Workflow/Sample-HookSchema.json`

- Sample HookConfig/HookSchema payload.

## 5. Important Config Files

### `package.json`

- Defines the app name and project scripts:
  - `npm run dev`,
  - `npm run build`,
  - `npm start`,
  - `npm run lint`.
- Includes major libraries:
  - Next.js,
  - React,
  - Apollo Server,
  - GraphQL,
  - React Flow,
  - AI SDK,
  - Monaco Editor,
  - Tailwind CSS.

### `tsconfig.json`

- Enables strict TypeScript checking.
- Uses bundler-style module resolution.
- Defines `@/*` alias to the project root.

### `eslint.config.mjs`

- Uses Next.js core web vitals and TypeScript linting presets.
- Ignores `Documentation/**` and `Dynamic Workflow/**`.
- Allows `any` in a few backend/data-layer files.

### `next.config.js`

- Enables React strict mode.
- Sets Turbopack root to the project directory.

### `.gitignore`

- Prevents generated/build/local files from being committed.

## 6. Real Working Summary Of The Project

This application is a **workflow studio for insurance hook logic**.

From a user perspective:

- The **Workflow List** page manages workflow records and statuses.
- The **Workflow Builder** page lets users visually compose workflow steps as nodes and edges.
- Each node represents a workflow action such as generating a quote number, running underwriting, publishing an event, or evaluating a condition.
- The canvas can be turned into a **HookConfig JSON** structure, which appears to be the domain-specific integration format for workflow hooks.
- The project also supports an **AI assistant** that can generate or modify that HookConfig from plain English.
- A **simulation engine** helps users understand how a workflow would run by animating traversal and generating logs.

From a technical perspective:

- Next.js handles frontend and API routing.
- Apollo Server provides a GraphQL API.
- The GraphQL layer uses an in-memory store instead of a database.
- React Flow powers the builder canvas.
- AI SDK integration allows workflow editing through chat.
- Schema conversion utilities bridge visual workflow design and structured hook configuration.

## 7. Current Limitations

- Workflow data is stored only in memory, so it is not persistent.
- Existing docs are partially duplicated across the repo.
- Some files contain placeholder/starter content.
- Generated folders like `.next/` and dependency folders like `node_modules/` are part of the repo environment but not core authored logic.

## 8. Suggested Next Improvements

- Replace the in-memory store with a database-backed persistence layer.
- Add authentication and user ownership for workflows.
- Connect the builder directly to saved workflow entities.
- Add automated tests for GraphQL, schema conversion, and execution simulation.
- Clean up duplicated documentation and keep one canonical technical guide.
