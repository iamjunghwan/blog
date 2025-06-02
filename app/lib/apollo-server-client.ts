import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const baseUrl = process.env.BASE_URL || `http://localhost:3000`;

export const getClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: `${baseUrl}/api/graphql`,
  }),
});
