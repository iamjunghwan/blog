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

  type Slug {
    slug: String!
  }

  type Query {
    posts(tag: String): [Post!]
    post(slug: String!): Post
    tags: [String!]!
  }
`;
