import { useState, useCallback } from "react";
import DOMPurify from "dompurify";

export const useArticleFetch = (slug: string | string[] | undefined) => {
  const [detailData, setDetailData] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<string> => {
    const { content } = await fetch(`/api/slug`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slug: Array.isArray(slug) ? slug[0] : slug }),
    }).then((res) => res.json());

    return content;
  }, [slug]);

  const sanitizeContent = (content: string): string => {
    return DOMPurify.sanitize(content);
  };

  const fetchArticle = useCallback(async () => {
    if (!slug) return;

    const articleContent = await fetchData();

    if (articleContent !== "") {
      setDetailData(sanitizeContent(articleContent));
      return;
    }
    setError(true);
  }, [slug, fetchData]);

  return { detailData, error, fetchArticle };
};
