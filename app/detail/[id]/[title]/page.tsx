"use client";

import { Suspense, use, useEffect, useState, useRef } from "react";
import dompurify from "dompurify";

interface Params {
  id: string;
  title: string;
}

export default function Detail(props: any) {
  const [fakeData, setFakeData] = useState<string>("");
  const refHtml = useRef<HTMLDivElement>(null);

  const sanitizer = dompurify.sanitize;

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
    if (fakeData && refHtml.current) {
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
  }, [fakeData]);

  useEffect(() => {
    if (window.localStorage.getItem("fakeData")) {
      const fackHtml: string = window.localStorage.getItem("fakeData") ?? "";
      setFakeData(fackHtml);
    }
  }, []);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div
        ref={refHtml}
        dangerouslySetInnerHTML={{ __html: sanitizer(fakeData) }}
      ></div>
    </Suspense>
  );
}
