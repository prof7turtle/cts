import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Enums
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

  # Input Types
  input CreateWorkflowInput {
    name: String!
    description: String
    category: String
  }

  input UpdateWorkflowInput {
    id: String!
    name: String
    description: String
    status: WorkflowStatus
  }

  input CreateNodeInput {
    workflowId: String!
    type: NodeType!
    label: String!
    position: PositionInput!
    data: NodeDataInput
  }

  input UpdateNodeInput {
    id: String!
    label: String
    position: PositionInput
    data: NodeDataInput
  }

  input DeleteNodeInput {
    id: String!
    workflowId: String!
  }

  input CreateEdgeInput {
    workflowId: String!
    source: String!
    target: String!
    sourceHandle: String
    targetHandle: String
    type: EdgeType
  }

  input DeleteEdgeInput {
    id: String!
    workflowId: String!
  }

  input PositionInput {
    x: Float!
    y: Float!
  }

  input NodeDataInput {
    condition: String
    variable: String
    formula: String
    ratingTable: String
    template: String
    url: String
    email: String
    cases: [CaseInput!]
    requestName: String
    moduleName: String
    isEndpoint: Boolean
    callFunction: Boolean
    path: String
    description: String
    needCascading: Boolean
    hookCallCascading: Boolean
    staticParamsJson: String
  }

  input CaseInput {
    label: String!
    value: String!
  }

  # Object Types
  type Position {
    x: Float!
    y: Float!
  }

  type NodeData {
    condition: String
    variable: String
    formula: String
    ratingTable: String
    template: String
    url: String
    email: String
    cases: [Case!]
    requestName: String
    moduleName: String
    isEndpoint: Boolean
    callFunction: Boolean
    path: String
    description: String
    needCascading: Boolean
    hookCallCascading: Boolean
    staticParamsJson: String
  }

  type Case {
    label: String!
    value: String!
  }

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

  type WorkflowResult {
    success: Boolean!
    message: String!
    workflow: Workflow
    errors: [String!]
  }

  type NodeResult {
    success: Boolean!
    message: String!
    node: WorkflowNode
    errors: [String!]
  }

  type EdgeResult {
    success: Boolean!
    message: String!
    edge: WorkflowEdge
    errors: [String!]
  }

  type PaginatedWorkflows {
    workflows: [Workflow!]!
    total: Int!
    page: Int!
    pageSize: Int!
    hasMore: Boolean!
  }

  # Queries
  type Query {
    """Get all workflows with pagination"""
    workflows(page: Int = 1, pageSize: Int = 10): PaginatedWorkflows!

    """Get a specific workflow by ID"""
    workflow(id: String!): Workflow

    """Get a workflow node by ID"""
    workflowNode(id: String!): WorkflowNode

    """Get all nodes in a workflow"""
    workflowNodes(workflowId: String!): [WorkflowNode!]!

    """Get all edges in a workflow"""
    workflowEdges(workflowId: String!): [WorkflowEdge!]!

    """Search workflows by name or description"""
    searchWorkflows(query: String!, page: Int = 1, pageSize: Int = 10): PaginatedWorkflows!

    """Get workflows by status"""
    workflowsByStatus(status: WorkflowStatus!, page: Int = 1, pageSize: Int = 10): PaginatedWorkflows!

    """Get workflow statistics"""
    workflowStats: WorkflowStats!
  }

  type WorkflowStats {
    totalWorkflows: Int!
    publishedWorkflows: Int!
    draftWorkflows: Int!
    archivedWorkflows: Int!
    totalNodes: Int!
    totalEdges: Int!
  }

  # Mutations
  type Mutation {
    """Create a new workflow"""
    createWorkflow(input: CreateWorkflowInput!): WorkflowResult!

    """Update an existing workflow"""
    updateWorkflow(input: UpdateWorkflowInput!): WorkflowResult!

    """Delete a workflow"""
    deleteWorkflow(id: String!): WorkflowResult!

    """Publish a workflow (set status to PUBLISHED)"""
    publishWorkflow(id: String!): WorkflowResult!

    """Archive a workflow"""
    archiveWorkflow(id: String!): WorkflowResult!

    """Create a node in a workflow"""
    createNode(input: CreateNodeInput!): NodeResult!

    """Update a node"""
    updateNode(input: UpdateNodeInput!): NodeResult!

    """Delete a node from a workflow"""
    deleteNode(input: DeleteNodeInput!): NodeResult!

    """Create an edge between two nodes"""
    createEdge(input: CreateEdgeInput!): EdgeResult!

    """Delete an edge"""
    deleteEdge(input: DeleteEdgeInput!): EdgeResult!

    """Validate workflow"""
    validateWorkflow(id: String!): WorkflowResult!

    """Duplicate a workflow"""
    duplicateWorkflow(id: String!): WorkflowResult!
  }

  # Subscriptions
  type Subscription {
    """Subscribe to workflow updates"""
    workflowUpdated(workflowId: String!): Workflow!

    """Subscribe to node changes"""
    nodeChanged(workflowId: String!): WorkflowNode!
  }
`;
