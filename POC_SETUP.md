# Workflow Builder GraphQL POC - Setup Complete ✅

## What's Implemented

### 1. **GraphQL Infrastructure** ✅

- **Apollo Server** integrated with Next.js 16
- **GraphQL Schema** with full type definitions
- **Resolvers** for all queries and mutations
- **In-memory data store** with sample workflows
- **GraphQL API endpoint** at `/api/graphql`

### 2. **GraphQL Schema** ✅

**Types:**
- `Workflow` - Complete workflow definition
- `WorkflowNode` - Individual workflow nodes
- `WorkflowEdge` - Connections between nodes
- `Position`, `NodeData`, `Case` - Supporting types

**Enums:**
- `NodeType` - START, END, IF_CONDITION, SWITCH_CASE, RATING, COPYWRITING, VALIDATION, PREMIUM, API, EMAIL
- `WorkflowStatus` - DRAFT, PUBLISHED, ARCHIVED, ACTIVE
- `EdgeType` - DEFAULT, TRUE_PATH, FALSE_PATH, CASE_PATH

**Queries:**
- `workflows(page, pageSize)` - Get paginated workflows
- `workflow(id)` - Get single workflow
- `workflowNode(id)` - Get single node
- `workflowNodes(workflowId)` - Get all nodes in workflow
- `workflowEdges(workflowId)` - Get all edges in workflow
- `searchWorkflows(query, page, pageSize)` - Search workflows
- `workflowsByStatus(status, page, pageSize)` - Filter by status
- `workflowStats()` - Get statistics

**Mutations:**
- `createWorkflow(input)` - Create new workflow
- `updateWorkflow(input)` - Update workflow
- `deleteWorkflow(id)` - Delete workflow
- `publishWorkflow(id)` - Publish workflow
- `archiveWorkflow(id)` - Archive workflow
- `createNode(input)` - Add node to workflow
- `updateNode(input)` - Update node
- `deleteNode(input)` - Remove node
- `createEdge(input)` - Create connection
- `deleteEdge(input)` - Remove connection
- `validateWorkflow(id)` - Validate workflow
- `duplicateWorkflow(id)` - Clone workflow

### 3. **Next.js Server Actions** ✅

Type-safe async functions that run on the server:

```typescript
// app/actions/workflow.ts - 20+ server actions
- fetchWorkflows()
- fetchWorkflowById()
- searchWorkflows()
- createWorkflow()
- updateWorkflow()
- deleteWorkflow()
- publishWorkflow()
- validateWorkflow()
- createNode()
- updateNode()
- deleteNode()
- createEdge()
- deleteEdge()
// ... and more
```

### 4. **React Integration** ✅

**useWorkflow Hook** (`app/components/useWorkflow.ts`):
- Full workflow state management
- Type-safe operations
- Error handling
- Loading states

**WorkflowList Component** (`app/components/WorkflowList.tsx`):
- List all workflows
- Create, update, delete operations
- Publish, archive, duplicate workflows
- Statistics dashboard
- Status badges and filtering

### 5. **UI Components** ✅

- **Navigation** - Switch between "Workflows" and "Builder" views
- **Workflow List** - Manage all workflows with CRUD operations
- **Workflow Builder** - Visual editor with React Flow
- **Statistics** - Dashboard showing workflow metrics

## Project Structure

```
cts/
├── app/
│   ├── api/
│   │   └── graphql/
│   │       └── route.ts              # GraphQL API endpoint
│   ├── actions/
│   │   └── workflow.ts               # Server actions
│   ├── components/
│   │   ├── WorkflowBuilder.tsx      # Visual editor
│   │   ├── WorkflowList.tsx         # Workflow management
│   │   ├── useWorkflow.ts           # Custom hook
│   │   ├── NodesPanel.tsx           # Node palette
│   │   └── nodes/                   # Node components
│   ├── layout.tsx
│   ├── page.tsx                     # Main page with navigation
│   └── globals.css
├── lib/
│   └── graphql/
│       ├── schema.ts                # GraphQL type definitions
│       ├── resolvers.ts             # Query/mutation logic
│       ├── store.ts                 # In-memory data store
│       └── server.ts                # Apollo Server setup
├── Documentation/
│   ├── graphql-api.md              # Complete API documentation
│   ├── api.md                      # API overview
│   └── workflow.md
├── package.json
└── tsconfig.json
```

## Getting Started

### Installation

```bash
cd c:\Users\athar\Documents\Atharv\Coding\cts

# Install dependencies (already done)
npm install --legacy-peer-deps
```

### Running the POC

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Features

1. **Workflow List Tab**
   - View all workflows
   - Create new workflows
   - Publish workflows
   - Archive workflows
   - Duplicate workflows
   - Delete workflows
   - View statistics

2. **Workflow Builder Tab**
   - Visual workflow editor
   - Drag-and-drop nodes
   - Connect nodes with edges
   - Edit node properties
   - Save workflow configurations

### Sample Data

A sample auto insurance rating workflow is pre-loaded:
- **ID**: `wf-1`
- **Name**: "Auto Insurance Rating Workflow"
- **Nodes**: START → RATING → IF_CONDITION → PREMIUM → END

## API Usage

### Via Server Actions (Recommended)

```typescript
'use client';

import { fetchWorkflows, createWorkflow } from '@/app/actions/workflow';

export default function MyComponent() {
  const handleCreate = async () => {
    const result = await createWorkflow(
      'My Workflow',
      'Description',
      'Insurance'
    );
    console.log(result);
  };

  return <button onClick={handleCreate}>Create</button>;
}
```

### Via Direct GraphQL

```typescript
const response = await fetch('/api/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `
      query {
        workflows(page: 1, pageSize: 10) {
          workflows { id name status }
        }
      }
    `,
  }),
});

const data = await response.json();
```

### Via useWorkflow Hook

```typescript
'use client';

import { useWorkflow } from '@/app/components/useWorkflow';

export default function WorkflowEditor() {
  const { workflow, addNode, addEdge, publishWorkflow } = useWorkflow();

  return (
    <div>
      {workflow && (
        <button onClick={() => publishWorkflow(workflow.id)}>
          Publish
        </button>
      )}
    </div>
  );
}
```

## Key Technologies

✅ **Next.js 16** - Full-stack React framework  
✅ **GraphQL** - Query language for APIs  
✅ **Apollo Server** - GraphQL server  
✅ **React 19** - Latest React with server components  
✅ **TypeScript** - Type-safe development  
✅ **React Flow** - Visual workflow editor  
✅ **Server Actions** - New Next.js pattern for server operations  

## Data Persistence

Currently using **in-memory storage** for POC. To persist data, replace:

1. `lib/graphql/store.ts` with database queries
2. Add a database layer (MongoDB, PostgreSQL, etc.)
3. Implement authentication and authorization
4. Add caching layer (Redis)

## Next Steps

For production deployment:

1. ✅ Add database persistence
2. ✅ Implement user authentication
3. ✅ Add authorization/permissions
4. ✅ GraphQL subscriptions for real-time updates
5. ✅ Workflow execution engine
6. ✅ Logging and monitoring
7. ✅ Performance optimization
8. ✅ Error handling and recovery

## Documentation

- See [Documentation/graphql-api.md](./Documentation/graphql-api.md) for complete API reference
- See [Documentation/api.md](./Documentation/api.md) for API overview
- See [Documentation/workflow.md](./Documentation/workflow.md) for workflow details

## Troubleshooting

**Port already in use?**
```bash
npm run dev -- -p 3001
```

**Dependencies issues?**
```bash
npm install --legacy-peer-deps
```

**Clear cache and restart:**
```bash
rm -rf .next
npm run dev
```

## Support

For questions or issues with this POC, refer to:
- [GraphQL Documentation](https://graphql.org)
- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Flow Documentation](https://reactflow.dev)
