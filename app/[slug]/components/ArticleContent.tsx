"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_ARTICLE,
  UPDATE_ARTICLE_TITLE,
} from "@/graphql/queries/articleQueries";

export default function ArticleContent({ content }: { content: string }) {
  const refHtml = useRef<HTMLDivElement>(null);
  const [updateArticleTitle, { data: tt }] = useMutation(UPDATE_ARTICLE_TITLE);

  const { loading, error, data } = useQuery(GET_ARTICLE, {
    variables: { slug: "code-caching" },
  });

  if (tt) {
    console.log("tt :", tt);
  }

  const scrollToRef = (id: string): void => {
    const ref = document.getElementById(id);
    if (ref) {
      ref.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  const handleUpdateTitle = async () => {
    try {
      await updateArticleTitle({
        variables: {
          slug: "code-caching",
          title: "새로운 제목이 들어왓다!", // 여기에 실제 새로운 제목을 넣어주세요
        },
      });

      // 성공 시 처리
      alert("제목이 성공적으로 업데이트되었습니다.");
    } catch (error) {
      // 에러 처리
      console.error("제목 업데이트 중 오류 발생:", error);
      alert("제목 업데이트에 실패했습니다.");
    }
  };

  useEffect(() => {
    const container = refHtml.current;
    if (!container) return;

    const h2Elements = container.querySelectorAll("h2");
    const clickHandlers = Array.from(h2Elements).map((h2) => {
      const handler = () => scrollToRef(h2.id);
      h2.addEventListener("click", handler);
      return { element: h2, handler };
    });

    return () => {
      clickHandlers.forEach(({ element, handler }) => {
        element.removeEventListener("click", handler);
      });
    };
  }, [content]);

  return (
    <article className="font-body">
      <button onClick={handleUpdateTitle}>제목 변경</button>
      <div ref={refHtml} dangerouslySetInnerHTML={{ __html: content }}></div>
    </article>
  );
}
