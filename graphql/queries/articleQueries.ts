import { gql } from "graphql-tag";

//모든 아티클 또는 태그별 아티클 조회
export const GET_ALL_ARTICLES = gql`
  query getArticles($tag: String) {
    posts(tag: $tag) {
      title
      content
      slug
      tag
      createdAt
    }
  }
`;

//단일 아티클 정보 & generateMetadata 참고 데이터
export const GET_ARTICLE = gql`
  query getArticle($slug: String!) {
    post(slug: $slug) {
      title
      content
    }
  }
`;

//모든 아티클의 태그만 추출
export const GET_ALL_TAGS = gql`
  query {
    tags
  }
`;

export const UPDATE_ARTICLE_TITLE = gql`
  mutation updateArticleTitle($slug: String!, $title: String!) {
    updateArticle(slug: $slug, title: $title) {
      title
      slug
    }
  }
`;
