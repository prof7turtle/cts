// In-memory data store for POC
interface WorkflowNode {
  id: string;
  workflowId: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowEdge {
  id: string;
  workflowId: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: string;
  createdAt: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

class WorkflowStore {
  private workflows: Map<string, Workflow> = new Map();
  private nodeCounter = 0;
  private edgeCounter = 0;
  private workflowCounter = 0;

  // Initialize with sample data
  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleWorkflow: Workflow = {
      id: 'wf-1',
      name: 'Auto Insurance Rating Workflow',
      description: 'Workflow for auto insurance premium calculation and approval',
      category: 'Insurance',
      status: 'ACTIVE',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      nodes: [
        {
          id: 'node-1',
          workflowId: 'wf-1',
          type: 'START',
          label: 'Start',
          position: { x: 250, y: 50 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'node-2',
          workflowId: 'wf-1',
          type: 'RATING',
          label: 'Calculate Base Rate',
          position: { x: 250, y: 150 },
          data: { ratingTable: 'Auto Base Rates' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'node-3',
          workflowId: 'wf-1',
          type: 'IF_CONDITION',
          label: 'Age Check',
          position: { x: 250, y: 250 },
          data: { condition: 'age >= 25' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'node-4',
          workflowId: 'wf-1',
          type: 'PREMIUM',
          label: 'Apply Premium',
          position: { x: 100, y: 350 },
          data: { formula: 'baseRate * 0.9' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'node-5',
          workflowId: 'wf-1',
          type: 'END',
          label: 'End',
          position: { x: 250, y: 450 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      edges: [
        {
          id: 'edge-1',
          workflowId: 'wf-1',
          source: 'node-1',
          target: 'node-2',
          type: 'DEFAULT',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'edge-2',
          workflowId: 'wf-1',
          source: 'node-2',
          target: 'node-3',
          type: 'DEFAULT',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'edge-3',
          workflowId: 'wf-1',
          source: 'node-3',
          target: 'node-4',
          sourceHandle: 'true',
          type: 'TRUE_PATH',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'edge-4',
          workflowId: 'wf-1',
          source: 'node-4',
          target: 'node-5',
          type: 'DEFAULT',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    this.workflows.set('wf-1', sampleWorkflow);
    this.workflowCounter = 1;
    this.nodeCounter = 5;
    this.edgeCounter = 4;
  }

  // Workflow operations
  getAllWorkflows(page: number = 1, pageSize: number = 10) {
    const workflows = Array.from(this.workflows.values());
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedWorkflows = workflows.slice(start, end);

    return {
      workflows: paginatedWorkflows,
      total: workflows.length,
      page,
      pageSize,
      hasMore: end < workflows.length,
    };
  }

  getWorkflowById(id: string) {
    return this.workflows.get(id);
  }

  createWorkflow(name: string, description?: string, category?: string) {
    const id = `wf-${++this.workflowCounter}`;
    const now = new Date().toISOString();

    const workflow: Workflow = {
      id,
      name,
      description,
      category,
      status: 'DRAFT',
      nodes: [],
      edges: [],
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: 'user',
    };

    this.workflows.set(id, workflow);
    return workflow;
  }

  updateWorkflow(
    id: string,
    updates: Partial<{
      name: string;
      description: string;
      status: string;
    }>
  ) {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;

    const updated = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.workflows.set(id, updated);
    return updated;
  }

  deleteWorkflow(id: string) {
    return this.workflows.delete(id);
  }

  // Node operations
  createNode(
    workflowId: string,
    type: string,
    label: string,
    position: { x: number; y: number },
    data?: Record<string, any>
  ) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const nodeId = `node-${++this.nodeCounter}`;
    const now = new Date().toISOString();

    const node: WorkflowNode = {
      id: nodeId,
      workflowId,
      type,
      label,
      position,
      data,
      createdAt: now,
      updatedAt: now,
    };

    workflow.nodes.push(node);
    workflow.updatedAt = now;
    return node;
  }

  updateNode(
    id: string,
    updates: Partial<{
      label: string;
      position: { x: number; y: number };
      data: Record<string, any>;
    }>
  ) {
    for (const workflow of this.workflows.values()) {
      const node = workflow.nodes.find((n) => n.id === id);
      if (node) {
        const updated = {
          ...node,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        const index = workflow.nodes.indexOf(node);
        workflow.nodes[index] = updated;
        workflow.updatedAt = new Date().toISOString();
        return updated;
      }
    }
    return null;
  }

  deleteNode(id: string, workflowId: string) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    const nodeIndex = workflow.nodes.findIndex((n) => n.id === id);
    if (nodeIndex === -1) return false;

    workflow.nodes.splice(nodeIndex, 1);

    // Also remove connected edges
    workflow.edges = workflow.edges.filter((e) => e.source !== id && e.target !== id);
    workflow.updatedAt = new Date().toISOString();

    return true;
  }

  getNodeById(id: string) {
    for (const workflow of this.workflows.values()) {
      const node = workflow.nodes.find((n) => n.id === id);
      if (node) return node;
    }
    return null;
  }

  getNodesByWorkflowId(workflowId: string) {
    const workflow = this.workflows.get(workflowId);
    return workflow?.nodes || [];
  }

  // Edge operations
  createEdge(
    workflowId: string,
    source: string,
    target: string,
    sourceHandle?: string,
    targetHandle?: string,
    type: string = 'DEFAULT'
  ) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const edgeId = `edge-${++this.edgeCounter}`;
    const edge: WorkflowEdge = {
      id: edgeId,
      workflowId,
      source,
      target,
      sourceHandle,
      targetHandle,
      type,
      createdAt: new Date().toISOString(),
    };

    workflow.edges.push(edge);
    workflow.updatedAt = new Date().toISOString();
    return edge;
  }

  deleteEdge(id: string, workflowId: string) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    const edgeIndex = workflow.edges.findIndex((e) => e.id === id);
    if (edgeIndex === -1) return false;

    workflow.edges.splice(edgeIndex, 1);
    workflow.updatedAt = new Date().toISOString();
    return true;
  }

  getEdgesByWorkflowId(workflowId: string) {
    const workflow = this.workflows.get(workflowId);
    return workflow?.edges || [];
  }

  getWorkflowsByStatus(status: string, page: number = 1, pageSize: number = 10) {
    const workflows = Array.from(this.workflows.values()).filter((w) => w.status === status);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      workflows: workflows.slice(start, end),
      total: workflows.length,
      page,
      pageSize,
      hasMore: end < workflows.length,
    };
  }

  searchWorkflows(query: string, page: number = 1, pageSize: number = 10) {
    const lowerQuery = query.toLowerCase();
    const workflows = Array.from(this.workflows.values()).filter(
      (w) =>
        w.name.toLowerCase().includes(lowerQuery) ||
        w.description?.toLowerCase().includes(lowerQuery)
    );

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      workflows: workflows.slice(start, end),
      total: workflows.length,
      page,
      pageSize,
      hasMore: end < workflows.length,
    };
  }

  getStats() {
    const workflows = Array.from(this.workflows.values());
    return {
      totalWorkflows: workflows.length,
      publishedWorkflows: workflows.filter((w) => w.status === 'PUBLISHED').length,
      draftWorkflows: workflows.filter((w) => w.status === 'DRAFT').length,
      archivedWorkflows: workflows.filter((w) => w.status === 'ARCHIVED').length,
      totalNodes: workflows.reduce((sum, w) => sum + w.nodes.length, 0),
      totalEdges: workflows.reduce((sum, w) => sum + w.edges.length, 0),
    };
  }

  validateWorkflow(id: string) {
    const workflow = this.workflows.get(id);
    if (!workflow) return { valid: false, errors: ['Workflow not found'] };

    const errors: string[] = [];

    if (workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Check for start and end nodes
    const hasStart = workflow.nodes.some((n) => n.type === 'START');
    const hasEnd = workflow.nodes.some((n) => n.type === 'END');

    if (!hasStart) errors.push('Workflow must have a START node');
    if (!hasEnd) errors.push('Workflow must have an END node');

    // Check for isolated nodes
    const connectedNodeIds = new Set<string>();
    for (const edge of workflow.edges) {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    }

    for (const node of workflow.nodes) {
      if (!connectedNodeIds.has(node.id) && node.type !== 'START') {
        errors.push(`Node ${node.id} (${node.label}) is isolated`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  duplicateWorkflow(id: string) {
    const original = this.workflows.get(id);
    if (!original) return null;

    const newId = `wf-${++this.workflowCounter}`;
    const now = new Date().toISOString();

    const nodeIdMap = new Map<string, string>();

    // Duplicate nodes with new IDs
    const newNodes = original.nodes.map((node) => {
      const newNodeId = `node-${++this.nodeCounter}`;
      nodeIdMap.set(node.id, newNodeId);

      return {
        ...node,
        id: newNodeId,
        workflowId: newId,
        createdAt: now,
        updatedAt: now,
      };
    });

    // Duplicate edges with new IDs and mapped node references
    const newEdges = original.edges.map((edge) => {
      return {
        ...edge,
        id: `edge-${++this.edgeCounter}`,
        workflowId: newId,
        source: nodeIdMap.get(edge.source) || edge.source,
        target: nodeIdMap.get(edge.target) || edge.target,
        createdAt: now,
      };
    });

    const duplicate: Workflow = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      nodes: newNodes,
      edges: newEdges,
      status: 'DRAFT',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(newId, duplicate);
    return duplicate;
  }
}

export const store = new WorkflowStore();
