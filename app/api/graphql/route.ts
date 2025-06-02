import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import { resolvers } from "@/graphql/schema/resolvers";
import { typeDefs } from "@/graphql/schema/typeDefs";

// Apollo Server 인스턴스 생성
const server = new ApolloServer({ typeDefs, resolvers });
// Next.js용 핸들러 반환
const handler = startServerAndCreateNextHandler<NextRequest>(server);

export { handler as GET, handler as POST };
