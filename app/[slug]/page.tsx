"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import DOMPurify from "dompurify";
import { useParams, notFound } from "next/navigation";
import Loading from "@/components/Loading";

export default function Detail() {
  const [detailData, setDetailData] = useState<string>("");
  const refHtml = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<Boolean>(false);
  const { slug } = useParams();

  const fetchData = async (): Promise<string> => {
    const { content } = await fetch(`/api/slug`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slug }),
    }).then((res) => res.json());

    return content;
  };

  const sanitizeContent = (content: string): string => {
    return DOMPurify.sanitize(content);
  };

  const handleArticleFetch = async () => {
    if (!slug) return;

    const articleContent = await fetchData();

    if (articleContent !== "") {
      setDetailData(sanitizeContent(articleContent));
      return;
    }
    setError(true);
  };

  useEffect(
    function handleDataProcessFromUrlParam() {
      if (!slug) return;
      handleArticleFetch();
    },
    [slug]
  );

  useEffect(
    function handelExceptByData() {
      if (error) notFound();
    },
    [error]
  );

  const scrollToRef = (id: string): void => {
    const ref = document.getElementById(id);
    if (ref) {
      ref.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(
    function handleDataAndEventBinding() {
      if (detailData && refHtml.current) {
        const h2Elements = refHtml.current.querySelectorAll("h2");
        h2Elements.forEach((h2) => {
          h2.addEventListener("click", () => scrollToRef(h2.id));
        });
      }
      return () => {
        if (refHtml.current) {
          const h2Elements = refHtml.current.querySelectorAll("h2");
          h2Elements.forEach((h2) => {
            h2.removeEventListener("click", () => scrollToRef(h2.id));
          });
        }
      };
    },
    [detailData]
  );

  return (
    <div ref={refHtml} dangerouslySetInnerHTML={{ __html: detailData }}></div>
  );
}
