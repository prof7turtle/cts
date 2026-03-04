import { getApolloServer } from '@/lib/graphql/server';

export async function POST(req: Request) {
  try {
    const server = await getApolloServer();

    // Parse GraphQL request
    const { query, variables, operationName } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ errors: [{ message: 'Query is required' }] }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Execute GraphQL query
    const result = await server.executeOperation(
      {
        query,
        variables,
        operationName,
      }
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('GraphQL Error:', error);

    return new Response(
      JSON.stringify({
        errors: [
          {
            message: error.message || 'Internal Server Error',
          },
        ],
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// GET endpoint for health check or GraphQL endpoint info
export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'GraphQL API is running',
      endpoint: '/api/graphql',
      playground: '/api/graphql/playground',
      schema: '/api/graphql/schema',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
