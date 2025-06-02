import { gql } from "graphql-tag";

//단일 아티클 정보
export const GET_ARTICLE = gql`
  query getArticle($slug: String!) {
    post(slug: $slug) {
      id
      title
      content
      slug
    }
  }
`;

//slug에 따른 단일 아티클 정보

export const GET_ARTICLES_BY_SLUG = gql`
  query getArticlesBySlug($slug: String!) {
    postsBySlug(slug: $slug) {
      title
      content
    }
  }
`;

//모든 아티클's
export const GET_ARTICLES = gql`
  query getArticles {
    posts {
      id
      title
      content
      slug
      tag
    }
  }
`;

//태그에 따른 아티클's
export const GET_ARTICLES_BY_TAG = gql`
  query getArticlesByTag($tag: String!) {
    postsByTag(tag: $tag) {
      id
      title
      content
      slug
      tag
      createdAt
    }
  }
`;

export const GET_ALL_TAGS = gql`
  query {
    tags
  }
`;
