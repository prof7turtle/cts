import { store } from './store';

export const resolvers = {
  Query: {
    workflows: (_: any, { page = 1, pageSize = 10 }: any) => {
      return store.getAllWorkflows(page, pageSize);
    },

    workflow: (_: any, { id }: any) => {
      return store.getWorkflowById(id);
    },

    workflowNode: (_: any, { id }: any) => {
      return store.getNodeById(id);
    },

    workflowNodes: (_: any, { workflowId }: any) => {
      return store.getNodesByWorkflowId(workflowId);
    },

    workflowEdges: (_: any, { workflowId }: any) => {
      return store.getEdgesByWorkflowId(workflowId);
    },

    searchWorkflows: (_: any, { query, page = 1, pageSize = 10 }: any) => {
      return store.searchWorkflows(query, page, pageSize);
    },

    workflowsByStatus: (_: any, { status, page = 1, pageSize = 10 }: any) => {
      return store.getWorkflowsByStatus(status, page, pageSize);
    },

    workflowStats: () => {
      return store.getStats();
    },
  },

  Mutation: {
    createWorkflow: (
      _: any,
      { input }: any
    ) => {
      try {
        const { name, description, category } = input;

        if (!name || name.trim().length === 0) {
          return {
            success: false,
            message: 'Workflow name is required',
            workflow: null,
            errors: ['Workflow name is required'],
          };
        }

        const workflow = store.createWorkflow(name, description, category);

        return {
          success: true,
          message: 'Workflow created successfully',
          workflow,
          errors: [],
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to create workflow',
          workflow: null,
          errors: [error.message],
        };
      }
    },

    updateWorkflow: (
      _: any,
      { input }: any
    ) => {
      try {
        const { id, ...updates } = input;

        const workflow = store.updateWorkflow(id, updates);

        if (!workflow) {
          return {
            success: false,
            message: 'Workflow not found',
            workflow: null,
            errors: ['Workflow not found'],
          };
        }

        return {
          success: true,
          message: 'Workflow updated successfully',
          workflow,
          errors: [],
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to update workflow',
          workflow: null,
          errors: [error.message],
        };
      }
    },

    deleteWorkflow: (_: any, { id }: any) => {
      try {
        const result = store.deleteWorkflow(id);

        if (!result) {
          return {
            success: false,
            message: 'Workflow not found',
            workflow: null,
            errors: ['Workflow not found'],
          };
        }

        return {
          success: true,
          message: 'Workflow deleted successfully',
          workflow: null,
          errors: [],
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to delete workflow',
          workflow: null,
          errors: [error.message],
        };
      }
    },

    publishWorkflow: (_: any, { id }: any) => {
      try {
        const workflow = store.getWorkflowById(id);

        if (!workflow) {
          return {
            success: false,
            message: 'Workflow not found',
            workflow: null,
            errors: ['Workflow not found'],
          };
        }

        const { valid, errors } = store.validateWorkflow(id);

        if (!valid) {
          return {
            success: false,
            message: 'Cannot publish invalid workflow',
            workflow: null,
            errors: errors,
          };
        }

        const updated = store.updateWorkflow(id, { status: 'PUBLISHED' });

        return {
          success: true,
          message: 'Workflow published successfully',
          workflow: updated,
          errors: [],
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to publish workflow',
          workflow: null,
          errors: [error.message],
        };
      }
    },

    archiveWorkflow: (_: any, { id }: any) => {
      try {
        const updated = store.updateWorkflow(id, { status: 'ARCHIVED' });

        if (!updated) {
          return {
            success: false,
            message: 'Workflow not found',
            workflow: null,
            errors: ['Workflow not found'],
          };
        }

        return {
          success: true,
          message: 'Workflow archived successfully',
          workflow: updated,
          errors: [],
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to archive workflow',
          workflow: null,
          errors: [error.message],
        };
      }
    },

    createNode: (
      _: any,
      { input }: any
    ) => {
      try {
        const { workflowId, type, label, position, data } = input;

        if (!workflowId || !type || !label || !position) {
          return {
            success: false,
            message: 'Missing required fields',
            node: null,
            errors: [
              'workflowId, type, label, and position are required',
            ],
          };
        }

        const node = store.createNode(workflowId, type, label, position, data);

        if (!node) {
          return {
            success: false,
            message: 'Workflow not found',
            node: null,
            errors: ['Workflow not found'],
          };
        }

        return {
          success: true,
          message: 'Node created successfully',
          node,
          errors: [],
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to create node',
          node: null,
          errors: [error.message],
        };
      }
    },

    updateNode: (
      _: any,
      { input }: any
    ) => {
      try {
        const { id, ...updates } = input;

        const node = store.updateNode(id, updates);

        if (!node) {
          return {
            success: false,
            message: 'Node not found',
            node: null,
            errors: ['Node not found'],
          };
        }

        return {
          success: true,
          message: 'Node updated successfully',
          node,
          errors: [],
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to update node',
          node: null,
          errors: [error.message],
        };
      }
    },

    deleteNode: (
      _: any,
      { input }: any
    ) => {
      try {
        const { id, workflowId } = input;

        const result = store.deleteNode(id, workflowId);

        if (!result) {
          return {
            success: false,
            message: 'Node not found',
            node: null,
            errors: ['Node not found'],
          };
        }

        return {
          success: true,
          message: 'Node deleted successfully',
          node: null,
          errors: [],
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to delete node',
          node: null,
          errors: [error.message],
        };
      }
    },

    createEdge: (
      _: any,
      { input }: any
    ) => {
      try {
        const { workflowId, source, target, sourceHandle, targetHandle, type } =
          input;

        if (!workflowId || !source || !target) {
          return {
            success: false,
            message: 'Missing required fields',
            edge: null,
            errors: ['workflowId, source, and target are required'],
          };
        }

        const edge = store.createEdge(
          workflowId,
          source,
          target,
          sourceHandle,
          targetHandle,
          type
        );

        if (!edge) {
          return {
            success: false,
            message: 'Workflow not found',
            edge: null,
            errors: ['Workflow not found'],
          };
        }

        return {
          success: true,
          message: 'Edge created successfully',
          edge,
          errors: [],
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to create edge',
          edge: null,
          errors: [error.message],
        };
      }
    },

    deleteEdge: (
      _: any,
      { input }: any
    ) => {
      try {
        const { id, workflowId } = input;

        const result = store.deleteEdge(id, workflowId);

        if (!result) {
          return {
            success: false,
            message: 'Edge not found',
            edge: null,
            errors: ['Edge not found'],
          };
        }

        return {
          success: true,
          message: 'Edge deleted successfully',
          edge: null,
          errors: [],
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to delete edge',
          edge: null,
          errors: [error.message],
        };
      }
    },

    validateWorkflow: (_: any, { id }: any) => {
      try {
        const workflow = store.getWorkflowById(id);

        if (!workflow) {
          return {
            success: false,
            message: 'Workflow not found',
            workflow: null,
            errors: ['Workflow not found'],
          };
        }

        const { valid, errors } = store.validateWorkflow(id);

        return {
          success: valid,
          message: valid
            ? 'Workflow is valid'
            : 'Workflow has validation errors',
          workflow: valid ? workflow : null,
          errors,
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to validate workflow',
          workflow: null,
          errors: [error.message],
        };
      }
    },

    duplicateWorkflow: (_: any, { id }: any) => {
      try {
        const duplicate = store.duplicateWorkflow(id);

        if (!duplicate) {
          return {
            success: false,
            message: 'Workflow not found',
            workflow: null,
            errors: ['Workflow not found'],
          };
        }

        return {
          success: true,
          message: 'Workflow duplicated successfully',
          workflow: duplicate,
          errors: [],
        };
      } catch (error: any) {
        return {
          success: false,
          message: 'Failed to duplicate workflow',
          workflow: null,
          errors: [error.message],
        };
      }
    },
  },
};
