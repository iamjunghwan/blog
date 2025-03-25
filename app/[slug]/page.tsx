"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import DOMPurify from "dompurify";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";

// function sanitizer(content: string) {
//   return DOMPurify.sanitize(content); // DOMPurify로 HTML을 안전하게 정리
// }

export default function Detail() {
  const [detailData, setDetailData] = useState<string>("");
  const refHtml = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  const { slug } = useParams();

  const getData = async () => {
    const params = { slug };

    const { content } = await fetch(`/api/slug`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }).then((res) => res.json());

    if (content !== "") {
      setDetailData(DOMPurify.sanitize(content));
      return;
    }

    setError(true);
  };

  useEffect(
    function handleDataProcessFromUrl() {
      if (!slug) return;

      getData();
    },
    [slug]
  );

  useEffect(
    function handelExceptByData() {
      if (error) notFound();
    },
    [error]
  );

  const scrollToRef = (id: string) => {
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
  console.log(DOMPurify);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div ref={refHtml} dangerouslySetInnerHTML={{ __html: detailData }}></div>
    </Suspense>
  );
}
