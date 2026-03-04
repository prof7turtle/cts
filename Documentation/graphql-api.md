# GraphQL API Documentation

## Overview

This is a POC (Proof of Concept) of an Insurance Workflow Builder with GraphQL and Next.js Server Actions.

## Architecture

### Technology Stack

- **Next.js 16** - Full-stack React framework with App Router
- **Apollo Server** - GraphQL server implementation
- **GraphQL** - Query language for API
- **React Flow** - Visual workflow builder
- **Server Actions** - Next.js 13+ feature for server-side operations
- **TypeScript** - Type-safe development

### Key Components

1. **GraphQL Schema** (`lib/graphql/schema.ts`)
   - Defines all GraphQL types, queries, and mutations
   - Includes workflow, node, and edge definitions

2. **Data Store** (`lib/graphql/store.ts`)
   - In-memory data storage for POC
   - Supports CRUD operations for workflows, nodes, and edges

3. **Resolvers** (`lib/graphql/resolvers.ts`)
   - Implements GraphQL query and mutation logic
   - Handles validation and error responses

4. **Apollo Server** (`lib/graphql/server.ts`)
   - Initializes Apollo GraphQL server
   - Manages server lifecycle

5. **API Route** (`app/api/graphql/route.ts`)
   - Next.js App Router route handler
   - Handles GraphQL POST/GET/OPTIONS requests

6. **Server Actions** (`app/actions/workflow.ts`)
   - Server-side functions callable from client components
   - Wrap GraphQL operations for typesafe client usage

7. **Custom Hook** (`app/components/useWorkflow.ts`)
   - React hook for managing workflow state
   - Provides workflow operations interface

## API Endpoints

### GraphQL Endpoint

**POST** `/api/graphql`

Request format:

```json
{
  "query": "...",
  "variables": { ... },
  "operationName": "..."
}
```

Response format:

```json
{
  "data": { ... },
  "errors": [ ... ]
}
```

## GraphQL Schema Overview

### Enums

```graphql
enum NodeType {
  START
  END
  IF_CONDITION
  SWITCH_CASE
  RATING
  COPYWRITING
  VALIDATION
  PREMIUM
  API
  EMAIL
}

enum WorkflowStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  ACTIVE
}

enum EdgeType {
  DEFAULT
  TRUE_PATH
  FALSE_PATH
  CASE_PATH
}
```

### Core Types

#### Workflow

Represents a complete workflow definition with nodes and edges.

```graphql
type Workflow {
  id: String!
  name: String!
  description: String
  category: String
  status: WorkflowStatus!
  nodes: [WorkflowNode!]!
  edges: [WorkflowEdge!]!
  version: Int!
  createdAt: String!
  updatedAt: String!
  createdBy: String
}
```

#### WorkflowNode

Represents a single node in a workflow.

```graphql
type WorkflowNode {
  id: String!
  workflowId: String!
  type: NodeType!
  label: String!
  position: Position!
  data: NodeData
  createdAt: String!
  updatedAt: String!
}
```

#### WorkflowEdge

Represents a connection between two nodes.

```graphql
type WorkflowEdge {
  id: String!
  workflowId: String!
  source: String!
  target: String!
  sourceHandle: String
  targetHandle: String
  type: EdgeType!
  createdAt: String!
}
```

### Queries

#### Get All Workflows

```graphql
query {
  workflows(page: 1, pageSize: 10) {
    workflows {
      id
      name
      status
    }
    total
    page
    hasMore
  }
}
```

#### Get Workflow by ID

```graphql
query {
  workflow(id: "wf-1") {
    id
    name
    status
    nodes {
      id
      type
      position { x y }
    }
    edges {
      id
      source
      target
    }
  }
}
```

#### Search Workflows

```graphql
query {
  searchWorkflows(query: "insurance", page: 1) {
    workflows { ... }
    total
  }
}
```

#### Get Workflow Statistics

```graphql
query {
  workflowStats {
    totalWorkflows
    publishedWorkflows
    draftWorkflows
    totalNodes
    totalEdges
  }
}
```

### Mutations

#### Create Workflow

```graphql
mutation {
  createWorkflow(input: {
    name: "Auto Insurance Rating"
    description: "Calculate premium for auto insurance"
    category: "Insurance"
  }) {
    success
    message
    workflow {
      id
      name
      status
    }
    errors
  }
}
```

#### Update Workflow

```graphql
mutation {
  updateWorkflow(input: {
    id: "wf-1"
    name: "Updated Name"
    status: PUBLISHED
  }) {
    success
    workflow { ... }
  }
}
```

#### Create Node

```graphql
mutation {
  createNode(input: {
    workflowId: "wf-1"
    type: RATING
    label: "Calculate Base Rate"
    position: { x: 250, y: 150 }
    data: {
      ratingTable: "Auto Base Rates"
    }
  }) {
    success
    node { ... }
  }
}
```

#### Create Edge

```graphql
mutation {
  createEdge(input: {
    workflowId: "wf-1"
    source: "node-1"
    target: "node-2"
    type: DEFAULT
  }) {
    success
    edge { ... }
  }
}
```

#### Publish Workflow

```graphql
mutation {
  publishWorkflow(id: "wf-1") {
    success
    message
    workflow {
      id
      status
    }
  }
}
```

#### Validate Workflow

```graphql
mutation {
  validateWorkflow(id: "wf-1") {
    success
    message
    errors
  }
}
```

## Server Actions

Server actions provide a type-safe way to call backend operations from React components.

### Usage Example

```typescript
'use client';

import { fetchWorkflows, createWorkflow } from '@/app/actions/workflow';

export default function MyComponent() {
  const handleCreate = async () => {
    const result = await createWorkflow('My Workflow', 'Description');
    if (result.success) {
      console.log('Workflow created:', result.workflow);
    }
  };

  return <button onClick={handleCreate}>Create Workflow</button>;
}
```

### Available Server Actions

#### Queries

- `fetchWorkflows(page, pageSize)` - Get paginated workflows
- `fetchWorkflowById(id)` - Get single workflow
- `searchWorkflows(query, page, pageSize)` - Search workflows
- `fetchWorkflowStats()` - Get statistics

#### Workflow Operations

- `createWorkflow(name, description, category)` - Create new workflow
- `updateWorkflow(id, updates)` - Update workflow
- `deleteWorkflow(id)` - Delete workflow
- `publishWorkflow(id)` - Publish workflow
- `archiveWorkflow(id)` - Archive workflow
- `validateWorkflow(id)` - Validate workflow
- `duplicateWorkflow(id)` - Duplicate workflow

#### Node Operations

- `createNode(...)` - Add node to workflow
- `updateNode(id, updates)` - Update node
- `deleteNode(id, workflowId)` - Remove node

#### Edge Operations

- `createEdge(...)` - Create connection between nodes
- `deleteEdge(id, workflowId)` - Remove edge

## useWorkflow Hook

Custom React hook for managing workflow state and operations.

```typescript
const {
  workflow,
  loading,
  error,
  fetchWorkflow,
  saveWorkflow,
  addNode,
  addEdge,
  removeNode,
  removeEdge,
  publishWorkflow,
  validateWorkflow,
} = useWorkflow();
```

### Example Usage

```typescript
'use client';

import { useWorkflow } from '@/app/components/useWorkflow';

export default function WorkflowEditor() {
  const { workflow, loading, addNode, saveWorkflow } = useWorkflow();

  const handleSave = async () => {
    const id = await saveWorkflow('My Workflow', 'Description');
    console.log('Created workflow:', id);
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      <button onClick={handleSave}>Save Workflow</button>
    </div>
  );
}
```

## Data Persistence

This POC uses in-memory storage. For production:

1. **Replace Store** - Implement database queries (MongoDB, PostgreSQL, etc.)
2. **Add Database Layer** - Create database abstraction
3. **Implement Caching** - Add Redis or similar for performance
4. **Add Authentication** - Implement user authentication and authorization
5. **Add Logging** - Log all operations and errors

## Sample Workflows

The POC includes a sample workflow:
- **ID**: `wf-1`
- **Name**: "Auto Insurance Rating Workflow"
- **Nodes**: Start → Rating → If Condition → Premium → End
- **Status**: ACTIVE

## Running the POC

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

## Features

- ✅ Create, read, update, delete workflows
- ✅ Visual workflow builder with React Flow
- ✅ Node and edge management
- ✅ Workflow publishing and archiving
- ✅ Workflow validation
- ✅ Workflow duplication
- ✅ Statistics dashboard
- ✅ Server-side operations with server actions
- ✅ Type-safe GraphQL operations

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Persistent database storage
- [ ] Real-time workflow execution
- [ ] Workflow versioning and history
- [ ] Execution logs and monitoring
- [ ] Custom node types
- [ ] Workflow templates
- [ ] Export/import workflows
- [ ] GraphQL subscriptions for real-time updates
