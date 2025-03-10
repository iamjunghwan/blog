"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import dompurify from "dompurify";
import { useParams } from "next/navigation";

// function sanitizer(content: string) {
//   return DOMPurify.sanitize(content); // DOMPurify로 HTML을 안전하게 정리
// }

export default function Detail(props: any) {
  const [detailData, setDetailData] = useState<string>("");
  const refHtml = useRef<HTMLDivElement>(null);

  const { slug } = useParams();
  const sanitizer = dompurify.sanitize;

  const getData = async () => {
    const params = { slug: slug };

    const { data } = await fetch(`/api/slug`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }).then((res) => res.json());

    setDetailData(data);
  };

  useEffect(() => {
    if (!slug) return;

    getData();
  }, [slug]);

  const scrollToRef = (id: string) => {
    const ref = document.getElementById(id);
    if (ref) {
      ref.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(() => {
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
  }, [detailData]);

  // const getData = async () => {
  //   const str = "db565b295aff478c8e0b4eac0f6f667f";

  //   const response = await fetch(
  //     `https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/${str}/v2`,
  //     {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json",
  //         "Access-Token":
  //           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJSRUJFTDkiLCJpYXQiOjE3Mzk3NzcxMzUsImV4cCI6MjA1NTEzNzEzNSwiSUQiOiIwZTljMTQ4YiIsIkRPTUFJTiI6WyIqIl0sIlRZUEUiOiJFWFRFUk5BTCJ9.i-PuX7QzNpJiqncP06Tc5FyDbFpAg11D-W5csSTdRkg",
  //         "X-Forwarded-Host": "localhost:3000",
  //       },
  //     }
  //   );

  //   const getdata = await response.json();
  //   setDetailData(getdata.data.content);
  // };

  // useEffect(() => {
  //   getData();
  // }, []);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div ref={refHtml} dangerouslySetInnerHTML={{ __html: detailData }}></div>
    </Suspense>
  );
}
