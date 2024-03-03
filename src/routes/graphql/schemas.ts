import { Type } from '@fastify/type-provider-typebox';
import {  PrismaClient } from '@prisma/client';
import { GraphQLBoolean, GraphQLEnumType, GraphQLFloat, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { MemberTypeId as EnumMem } from '../member-types/schemas.js';
import { UUIDType } from './types/uuid.js';

type CreateUserDto =  {
    name: string;
    balance: number;
}

type CreatePostDto = {
    title: string;
    content: string;
    authorId: string;
}

type CreateProfileDto = {
    isMale: boolean;
    yearOfBirth: number;
    memberTypeId: EnumMem;
    userId: string;
}

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

const PostFields = {
  title: { type: GraphQLString},
  content: { type: GraphQLString},
  authorId: { type: UUIDType, },
}

const Post = new GraphQLObjectType({
  name: 'post',
  fields: {
    id: { type: UUIDType },
    ...PostFields
  },
});

const ProfileFields = {
  id: { type: UUIDType },
  isMale: { type: GraphQLBoolean},
  yearOfBirth: { type: GraphQLInt},
  userId: { type: UUIDType },
  memberTypeId: { type: MemberTypesIdType },
}

const Profile = new GraphQLObjectType({
  name: 'profile',
  fields: {
    ...ProfileFields,
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

const User: GraphQLObjectType = new GraphQLObjectType({
  name: 'user',
  fields:() => ({
    id: { type: UUIDType },
    name: { type: GraphQLString},
    balance: { type: GraphQLFloat},
    profile: {
      type: Profile,
      resolve({ id }: { id: string }, args, prisma: PrismaClient) {
        return prisma.profile.findUnique({ where: { userId: id } });
      },
    },
    posts: {
      type: new GraphQLList(Post),
      resolve({ id }: { id: string }, args, prisma: PrismaClient) {
        return prisma.post.findMany({ where: { authorId: id } });
      },
    },
    subscribedToUser: {
      type: new GraphQLList(User),
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
      type: new GraphQLList(User),
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
      type: new GraphQLList(Post),
      async resolve (parent, args, prisma: PrismaClient) {
        return await prisma.post.findMany();
      }
    },
    post: {
      type: Post,
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
      type: new GraphQLList(User),
      async resolve (parent, args, prisma: PrismaClient) {
        return await prisma.user.findMany();
      }
    },
     user: {
      type: User,
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
      type: new GraphQLList(Profile),
      async resolve (parent, args, prisma: PrismaClient) {
        return await prisma.profile.findMany();
      }
    },
    profile: {
      type: Profile,
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

const CreateUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: {
    name: {
      type: GraphQLString
    },
    balance: {
      type: GraphQLFloat
    },
  },
});


const  CreatePostInput = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: {
    ...PostFields
  },
});

const  CreateProfileInput = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: {
    ...ProfileFields
  },
});

const  ChangePostInput = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: {
    ...PostFields
  },
});

const  ChangeProfileInput = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: {
    ...ProfileFields
  },
});

const  ChangeUserInput = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: {
    name: {
      type: GraphQLString
    },
    balance: {
      type: GraphQLFloat
    },
  },
});

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser: {
      type: User,
      args: {
        dto: { type: CreateUserInput },
      },
      async resolve(parent, { dto }: { dto: CreateUserDto }, prisma: PrismaClient) {
        return prisma.user.create({
          data: dto,
        });
      },
    },
    createPost: {
      type: Post,
      args: {
        dto: { type: CreatePostInput },
      },
      async resolve(parent, { dto }: { dto: CreatePostDto }, prisma: PrismaClient) {
        return prisma.post.create({
          data: dto,
        });
      },
    },
    createProfile: {
      type: Profile,
      args: {
        dto: { type: CreateProfileInput },
      },
      async resolve(parent, { dto }: { dto: CreateProfileDto }, prisma: PrismaClient) {
        return prisma.profile.create({
          data: dto,
        });
      },
    },
    deletePost: {
      type: GraphQLBoolean,
      args: {
        id: { type: UUIDType },
      },
      async resolve(parent, { id }: { id: string }, prisma: PrismaClient) {
         await prisma.post.delete({
          where: {
            id,
          },
        });
      },
    },
    deleteUser: {
      type: GraphQLBoolean,
      args: {
        id: { type: UUIDType },
      },
      async resolve(parent, { id }: { id: string }, prisma: PrismaClient) {
         await prisma.user.delete({
          where: {
            id,
          },
        });
      },
    },
    deleteProfile: {
      type: GraphQLBoolean,
      args: {
        id: { type: UUIDType },
      },
      async resolve(parent, { id }: { id: string }, prisma: PrismaClient) {
         await prisma.profile.delete({
          where: {
            id,
          },
        });
      },
    },
    changePost: {
      type: Post,
      args: {
        id: { type: UUIDType },
        dto: { type: ChangePostInput },
      },
      async resolve(parent, { id, dto }: {id: string, dto: CreatePostDto}, prisma: PrismaClient) {
         const updatedPost = await prisma.post.update({
          where: { id },
          data: dto,
        });
        return updatedPost;
      },
    },
    changeUser: {
      type: User,
      args: {
        id: { type: UUIDType },
        dto: { type: ChangeUserInput },
      },
      async resolve(parent, { id, dto }: {id: string, dto: CreateUserDto}, prisma: PrismaClient) {
         const updatedUser = await prisma.user.update({
          where: { id },
          data: dto,
        });
        return updatedUser;
      },
    },
    changeProfile: {
      type: Profile,
      args: {
        id: { type: UUIDType },
        dto: { type: ChangeProfileInput },
      },
      async resolve(parent, { id, dto }: {id: string, dto: CreateProfileDto}, prisma: PrismaClient) {
          const profile = await prisma.profile.findUnique({ where: { id } });
          if (!profile) {
            throw new Error(`Field "userId" is not defined by type "ChangeProfileInput"`);
          }
          const updatedProfile = await prisma.profile.update({
            where: { id },
            data: dto,
          });
        return updatedProfile;
      },
    },
    subscribeTo: {
      type: User,
      args: {
        userId: { type: UUIDType },
        authorId: { type: UUIDType },
      },
      async resolve(parent, { userId, authorId }: {userId: string, authorId: string}, prisma: PrismaClient) {
        return prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            userSubscribedTo: {
              create: {
                authorId: authorId,
              },
            },
          },
        });
      },
    },
    unsubscribeFrom: {
      type: GraphQLBoolean,
      args: {
        userId: { type: UUIDType },
        authorId: { type: UUIDType },
      },
      async resolve(parent, { userId, authorId }: {userId: string, authorId: string}, prisma: PrismaClient) {
        await prisma.subscribersOnAuthors.delete({
          where: {
            subscriberId_authorId: {
              subscriberId: userId,
              authorId: authorId,
            },
          },
        });
        return null
      },
    },
  },
});



export const schema = new GraphQLSchema({
  query,
  mutation,
});
