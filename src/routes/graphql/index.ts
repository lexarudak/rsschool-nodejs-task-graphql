import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema, schema } from './schemas.js';
import { GraphQLArgs, graphql } from 'graphql';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
 
  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler({body: { query, variables } }) {
      console.log({query, variables});
      const args: GraphQLArgs = {
        schema, 
        source: query,
        variableValues: variables,
        contextValue: this.prisma,
      };
      const result = await graphql(args);
      console.log("ERRORRS", result.errors);
      // console.log("DATAAAAAA", result.data)
      return result;
    },
  });
};

export default plugin;

// {
//   "query": "{ memberTypes { id discount postsLimitPerMonth } }"
// }