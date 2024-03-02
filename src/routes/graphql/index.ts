import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema, schema } from './schemas.js';
import { GraphQLArgs, graphql, validate, specifiedRules, parse } from 'graphql';
import depthLimit from 'graphql-depth-limit';

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

      const document = parse(args.source);
      const err = validate(schema, document, [...specifiedRules, depthLimit(5)]);
      if (err.length > 0) {
        return { errors: err };
      }
      
      const result = await graphql(args);
      console.log("ERRORRS", result.errors);
      // console.log("DATAAAAAA", result.data)
      return result;
    },
  });
};

export default plugin;
