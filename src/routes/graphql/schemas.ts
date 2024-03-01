import { Type } from '@fastify/type-provider-typebox';
import {  PrismaClient } from '@prisma/client';
import { GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';


export const gqlResponseSchema = Type.Partial(
  Type.Object({
    data: Type.Any(),
    errors: Type.Any(),
  }),
);

export const createGqlResponseSchema = {
  body: Type.Object(
    {
      query: Type.String(),
      variables: Type.Optional(Type.Record(Type.String(), Type.Any())),
    },
    {
      additionalProperties: false,
    },
  ),
};


const memberTypes = new GraphQLObjectType({
  name: 'memberTypes',
  fields: {
    id: { type: GraphQLString },
    discount: { type: GraphQLString},
    postsLimitPerMonth: { type: GraphQLInt },
  },
});

const query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    memberTypes: {
      type: new GraphQLList(memberTypes),
       async resolve (_, s, prisma: PrismaClient) {
        return await prisma.memberType.findMany();
      },
    },
  },
});



export const schema = new GraphQLSchema({
  query,
});
