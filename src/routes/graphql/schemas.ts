import { Type } from '@fastify/type-provider-typebox';
import { GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

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

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
  },
});

const memberTypes = new GraphQLObjectType({
  name: 'member-types',
  fields: {
    id: { type: GraphQLString },
    text: { type: GraphQLString },
    user: { type: UserType },
    message: { type: MessageType },
  },
});

const query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    // user: {
    //   type: UserType,
    //   args: { id: { type: GraphQLString } },
    //   resolve(parent, args) {
    //     return fetchUserById(args.id); // функция, которая получает пользователя по ID
    //   },
    // },
    // message: {
    //   type: MessageType,
    //   args: { id: { type: GraphQLString } },
    //   resolve(parent, args) {
    //     return fetchMessageById(args.id); // функция, которая получает сообщение по ID
    //   },
    // },
    comments: {
      type: new GraphQLList(memberTypes),
      resolve() {
        return fetchAllComments(); // функция, которая получает все комментарии
      },
    },
  },
});



export const schema = new GraphQLSchema({
  query,
});