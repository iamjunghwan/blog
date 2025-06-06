import { prisma } from "@/app/lib/prisma";
// GraphQL 리졸버
export const resolvers = {
  Query: {
    // 상세 아티클
    post: async (_: any, { slug }: { slug: string }) => {
      const post = await prisma.post.findFirst({
        where: { slug },
      });

      if (!post) return null;
      return {
        ...post,
      };
    },

    // 전체 아티클 및 태그 조건에 따른 아티클 정보's
    posts: async (_: any, { tag }: { tag?: string }) => {
      if (!tag) {
        return await prisma.post.findMany();
      }

      return await prisma.post.findMany({
        where: {
          OR: [
            { tag: { equals: tag, mode: "insensitive" } },
            { tag: { startsWith: `${tag},`, mode: "insensitive" } },
            { tag: { endsWith: `,${tag}`, mode: "insensitive" } },
            { tag: { contains: `,${tag},`, mode: "insensitive" } },
          ],
        },
      });
    },

    // 각 아티클에 속한 태그's
    tags: async () => {
      const posts = await prisma.post.findMany({
        select: { tag: true },
      });

      const allTags = posts
        .flatMap((post) => post.tag?.split(",") ?? [])
        .map((tag) => tag.trim())
        .filter(Boolean);

      const uniqueTags = [...new Set(allTags)];

      return uniqueTags;
    },
  },

  Mutation: {
    updateArticle: async (
      _: any,
      { slug, title }: { slug: string; title: string }
    ) => {
      const updatedPost = await prisma.post.update({
        where: { slug },
        data: { title },
      });

      return updatedPost;
    },
  },
};
