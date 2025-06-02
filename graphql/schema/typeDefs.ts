import { gql } from "graphql-tag";
// GraphQL 스키마
export const typeDefs = gql`
  type Post {
    id: ID!
    title: String
    content: String
    slug: String
    tag: String
    createdAt: String
  }

  type Query {
    posts: [Post!]!
    post(slug: String!): Post
    postsByTag(tag: String!): [Post!]!
    tags: [String!]!
  }
`;
