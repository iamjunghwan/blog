"use client";

import { useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { useArticleFetch } from "./hooks/useArticleFetch";
import { useHeadingClickHandler } from "./hooks/useHeadingClickHandler";

export default function Detail() {
  const { slug } = useParams();
  const { detailData, error, fetchArticle } = useArticleFetch(slug);
  const { refHtml } = useHeadingClickHandler(detailData);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  useEffect(() => {
    if (error) notFound();
  }, [error]);

  return (
    <div ref={refHtml} dangerouslySetInnerHTML={{ __html: detailData }}></div>
  );
}
