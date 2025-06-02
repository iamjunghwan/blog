import { prisma } from "@/app/lib/prisma";
// GraphQL 리졸버
export const resolvers = {
  Query: {
    post: async (_: any, args: { slug: string }) => {
      const post = await prisma.post.findFirst({
        where: { slug: args.slug },
      });
      if (!post) return null;
      return {
        ...post,
      };
    },

    posts: async () => {
      const posts = await prisma.post.findMany();
      return posts.map((post) => ({
        ...post,
      }));
    },

    postsByTag: async (_: any, { tag }: { tag: string }) => {
      return await prisma.post.findMany({
        where: {
          tag: {
            contains: tag,
            mode: "insensitive",
          },
        },
      });
    },
    tags: async () => {
      const posts = await prisma.post.findMany({
        select: { tag: true },
      });

      const allTags = posts
        .flatMap((post) => post.tag?.split(",") ?? []) // 문자열 분리
        .map((tag) => tag.trim()) // 공백 제거
        .filter(Boolean); // 빈 문자열 제거

      const uniqueTags = [...new Set(allTags)];

      return uniqueTags;
    },
  },
};
