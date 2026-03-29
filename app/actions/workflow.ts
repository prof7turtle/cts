'use server';

/**
 * Server Actions for Workflow GraphQL operations
 * These functions run on the server and handle GraphQL queries and mutations
 */

async function executeGraphQL(query: string, variables?: Record<string, any>) {
  const explicitUrl = process.env.WORKFLOW_API_URL;
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;
  const baseUrl = explicitUrl || vercelUrl || 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const raw = await response.json();

  // Apollo Server v4 executeOperation wraps the payload under body.singleResult
  const singleResult = raw?.body?.singleResult;
  const resultData = raw?.data ?? singleResult?.data;
  const resultErrors = raw?.errors ?? singleResult?.errors;

  if (resultErrors?.length) {
    throw new Error(resultErrors[0]?.message || 'GraphQL request returned errors');
  }

  if (!resultData) {
    throw new Error('GraphQL response missing data');
  }

  return { data: resultData };
}

// ============ Workflow Queries ============

export async function fetchWorkflows(page: number = 1, pageSize: number = 10) {
  const query = `
    query GetWorkflows($page: Int, $pageSize: Int) {
      workflows(page: $page, pageSize: $pageSize) {
        workflows {
          id
          name
          description
          category
          status
          version
          createdAt
          updatedAt
        }
        total
        page
        pageSize
        hasMore
      }
    }
  `;

  const data = await executeGraphQL(query, { page, pageSize });
  return data.data.workflows;
}

export async function fetchWorkflowById(id: string) {
  const query = `
    query GetWorkflow($id: String!) {
      workflow(id: $id) {
        id
        name
        description
        category
        status
        version
        createdAt
        updatedAt
        nodes {
          id
          type
          label
          position {
            x
            y
          }
          data {
            condition
            variable
            formula
            ratingTable
            template
            url
            email
            requestName
            moduleName
            isEndpoint
            callFunction
            path
            description
            needCascading
            hookCallCascading
            staticParamsJson
          }
        }
        edges {
          id
          source
          target
          sourceHandle
          targetHandle
          type
        }
      }
    }
  `;

  const data = await executeGraphQL(query, { id });
  return data.data.workflow;
}

export async function searchWorkflows(query: string, page: number = 1, pageSize: number = 10) {
  const gql = `
    query SearchWorkflows($query: String!, $page: Int, $pageSize: Int) {
      searchWorkflows(query: $query, page: $page, pageSize: $pageSize) {
        workflows {
          id
          name
          description
          category
          status
          version
          createdAt
          updatedAt
        }
        total
        page
        pageSize
        hasMore
      }
    }
  `;

  const data = await executeGraphQL(gql, { query, page, pageSize });
  return data.data.searchWorkflows;
}

export async function fetchWorkflowStats() {
  const query = `
    query GetStats {
      workflowStats {
        totalWorkflows
        publishedWorkflows
        draftWorkflows
        archivedWorkflows
        totalNodes
        totalEdges
      }
    }
  `;

  const data = await executeGraphQL(query);
  return data.data.workflowStats;
}

// ============ Workflow Mutations ============

export async function createWorkflow(name: string, description?: string, category?: string) {
  const mutation = `
    mutation CreateWorkflow($input: CreateWorkflowInput!) {
      createWorkflow(input: $input) {
        success
        message
        workflow {
          id
          name
          description
          category
          status
          version
          createdAt
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { name, description, category },
  });

  return data.data.createWorkflow;
}

export async function updateWorkflow(
  id: string,
  updates: {
    name?: string;
    description?: string;
    status?: string;
  }
) {
  const mutation = `
    mutation UpdateWorkflow($input: UpdateWorkflowInput!) {
      updateWorkflow(input: $input) {
        success
        message
        workflow {
          id
          name
          description
          status
          version
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, ...updates },
  });

  return data.data.updateWorkflow;
}

export async function deleteWorkflow(id: string) {
  const mutation = `
    mutation DeleteWorkflow($id: String!) {
      deleteWorkflow(id: $id) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.deleteWorkflow;
}

export async function publishWorkflow(id: string) {
  const mutation = `
    mutation PublishWorkflow($id: String!) {
      publishWorkflow(id: $id) {
        success
        message
        workflow {
          id
          status
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.publishWorkflow;
}

export async function archiveWorkflow(id: string) {
  const mutation = `
    mutation ArchiveWorkflow($id: String!) {
      archiveWorkflow(id: $id) {
        success
        message
        workflow {
          id
          status
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.archiveWorkflow;
}

export async function validateWorkflow(id: string) {
  const mutation = `
    mutation ValidateWorkflow($id: String!) {
      validateWorkflow(id: $id) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.validateWorkflow;
}

export async function duplicateWorkflow(id: string) {
  const mutation = `
    mutation DuplicateWorkflow($id: String!) {
      duplicateWorkflow(id: $id) {
        success
        message
        workflow {
          id
          name
          status
          createdAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, { id });
  return data.data.duplicateWorkflow;
}

// ============ Node Mutations ============

export async function createNode(
  workflowId: string,
  type: string,
  label: string,
  position: { x: number; y: number },
  data?: Record<string, any>
) {
  const mutation = `
    mutation CreateNode($input: CreateNodeInput!) {
      createNode(input: $input) {
        success
        message
        node {
          id
          type
          label
          position {
            x
            y
          }
          data {
            condition
            variable
            formula
            ratingTable
            template
            url
            email
          }
        }
        errors
      }
    }
  `;

  const nodeData = await executeGraphQL(mutation, {
    input: {
      workflowId,
      type,
      label,
      position,
      data,
    },
  });

  return nodeData.data.createNode;
}

export async function updateNode(
  id: string,
  updates: {
    label?: string;
    position?: { x: number; y: number };
    data?: Record<string, any>;
  }
) {
  const mutation = `
    mutation UpdateNode($input: UpdateNodeInput!) {
      updateNode(input: $input) {
        success
        message
        node {
          id
          label
          position {
            x
            y
          }
          updatedAt
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, ...updates },
  });

  return data.data.updateNode;
}

export async function deleteNode(id: string, workflowId: string) {
  const mutation = `
    mutation DeleteNode($input: DeleteNodeInput!) {
      deleteNode(input: $input) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, workflowId },
  });

  return data.data.deleteNode;
}

// ============ Edge Mutations ============

export async function createEdge(
  workflowId: string,
  source: string,
  target: string,
  sourceHandle?: string,
  targetHandle?: string,
  type: string = 'DEFAULT'
) {
  const mutation = `
    mutation CreateEdge($input: CreateEdgeInput!) {
      createEdge(input: $input) {
        success
        message
        edge {
          id
          source
          target
          sourceHandle
          targetHandle
          type
        }
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: {
      workflowId,
      source,
      target,
      sourceHandle,
      targetHandle,
      type,
    },
  });

  return data.data.createEdge;
}

export async function deleteEdge(id: string, workflowId: string) {
  const mutation = `
    mutation DeleteEdge($input: DeleteEdgeInput!) {
      deleteEdge(input: $input) {
        success
        message
        errors
      }
    }
  `;

  const data = await executeGraphQL(mutation, {
    input: { id, workflowId },
  });

  return data.data.deleteEdge;
}
