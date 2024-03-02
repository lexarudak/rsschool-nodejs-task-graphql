import { Type } from '@fastify/type-provider-typebox';
import {  PrismaClient } from '@prisma/client';
import { GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { MemberTypeId as EnumMem } from '../member-types/schemas.js';
import { UUIDType } from './types/uuid.js';


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

const MemberTypesIdType = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: Object.keys(EnumMem).reduce((acc, key) => {
    acc[key.toLowerCase()] = { value: EnumMem[key as keyof typeof EnumMem] };
    return acc;
  }, {}),
});


const MemberTypes = new GraphQLObjectType({
  name: 'memberTypes',
  fields: {
    id: { type: MemberTypesIdType },
    discount: { type: GraphQLString},
    postsLimitPerMonth: { type: GraphQLInt },
  },
});

const Posts = new GraphQLObjectType({
  name: 'posts',
  fields: {
    id: { type: UUIDType },
    title: { type: GraphQLString},
    content: { type: GraphQLString},
    authorId: { type: UUIDType, },
  },
});



const Profiles = new GraphQLObjectType({
  name: 'profiles',
  fields: {
    id: { type: UUIDType },
    isMale: { type: GraphQLBoolean},
    yearOfBirth: { type: GraphQLInt},
    userId: { type: UUIDType },
    memberTypeId: { type: UUIDType },
    memberType: {
      type: MemberTypes,
      async resolve({ id }: { id: string }, args, prisma: PrismaClient) {
        const profile = await prisma.profile.findUnique({
          where: {
            id,
          },
        });
        const memberType = await prisma.memberType.findUnique({
          where: {
            id: profile?.memberTypeId,
          },
        });
        return memberType;
      },
    },
  },
});

const Users: GraphQLObjectType = new GraphQLObjectType({
  name: 'users',
  fields:() => ({
    id: { type: UUIDType },
    name: { type: GraphQLString},
    balance: { type: GraphQLFloat},
    profile: {
      type: Profiles,
      resolve({ id }: { id: string }, args, prisma: PrismaClient) {
        return prisma.profile.findUnique({ where: { userId: id } });
      },
    },
    posts: {
      type: new GraphQLList(Posts),
      resolve({ id }: { id: string }, args, prisma: PrismaClient) {
        return prisma.post.findMany({ where: { authorId: id } });
      },
    },
    subscribedToUser: {
      type: new GraphQLList(Users),
      resolve({ id }: { id: string }, args, prisma: PrismaClient) {
        return prisma.user.findMany({
          where: {
            userSubscribedTo: {
              some: {
                authorId: id,
              },
            },
          },
        });
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(Users),
      resolve({ id }: { id: string }, args, prisma: PrismaClient) {
        return prisma.user.findMany({
          where: {
            subscribedToUser: {
              some: {
                subscriberId: id,
              },
            },
          },
        });
      },
      
    },
  }),
});

const query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    memberTypes: {
      type: new GraphQLList(MemberTypes),
      async resolve (parent, args, prisma: PrismaClient) {
        return await prisma.memberType.findMany()
      },
    },
    memberType: {
      type: MemberTypes,
      args: { 
        id: { 
          type:  new GraphQLNonNull(MemberTypesIdType)
        } 
      },
      async resolve (parent, { id }: { id: EnumMem }, prisma: PrismaClient) 
      {
        const memberType = await prisma.memberType.findUnique({
          where: {
            id,
          },
    });
    return memberType;
  },
    },
    posts: {
      type: new GraphQLList(Posts),
      async resolve (parent, args, prisma: PrismaClient) {
        return await prisma.post.findMany();
      }
    },
    post: {
      type: Posts,
      args: { 
        id: { 
          type:  new GraphQLNonNull(UUIDType)
        } 
      },
      async resolve (parent, { id }: { id: string }, prisma: PrismaClient) {
         const post = await prisma.post.findUnique({
        where: {
          id,
        },
      });
      return post;
      }
    },
    users: {
      type: new GraphQLList(Users),
      async resolve (parent, args, prisma: PrismaClient) {
        return await prisma.user.findMany();
      }
    },
     user: {
      type: Users,
      args: { 
        id: { 
          type:  new GraphQLNonNull(UUIDType)
        } 
      },
      async resolve (parent, { id }: {id: string}, prisma: PrismaClient) {
        const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });
      return user;
      }
    },
    profiles: {
      type: new GraphQLList(Profiles),
      async resolve (parent, args, prisma: PrismaClient) {
        return await prisma.profile.findMany();
      }
    },
    profile: {
      type: Profiles,
      args: { 
        id: { 
          type:  new GraphQLNonNull(UUIDType)
        } 
      },
      async resolve (parent, { id }: {id: string}, prisma: PrismaClient) {
        const profile = await prisma.profile.findUnique({
        where: {
          id,
        },
        });
        return profile;
      },
    }
  },
});



export const schema = new GraphQLSchema({
  query,
});
