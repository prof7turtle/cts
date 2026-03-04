import { ApolloServer } from '@apollo/server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

let server: ApolloServer | null = null;

export async function getApolloServer() {
  if (!server) {
    server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: true, // Enable introspection for POC
    });

    await server.start();
  }

  return server;
}
