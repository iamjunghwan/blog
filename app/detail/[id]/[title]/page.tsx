"use client";

import { Suspense, use, useEffect, useState, useRef } from "react";
import dompurify from "dompurify";

// function sanitizer(content: string) {
//   return DOMPurify.sanitize(content); // DOMPurify로 HTML을 안전하게 정리
// }

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

  const getData = async () => {
    const response = await fetch(
      // "https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/7fbf49a0f996438ba3e6184345a0a11e/v2",
      "https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/search/v2",
      {
        //  method: "GET",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token":
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJSRUJFTDkiLCJpYXQiOjE3Mzk3NzcxMzUsImV4cCI6MjA1NTEzNzEzNSwiSUQiOiIwZTljMTQ4YiIsIkRPTUFJTiI6WyIqIl0sIlRZUEUiOiJFWFRFUk5BTCJ9.i-PuX7QzNpJiqncP06Tc5FyDbFpAg11D-W5csSTdRkg",
          "X-Forwarded-Host": "localhost:3000",
        },

        body: JSON.stringify({
          size: 10,
          page: 0,
          direction: "DESC",
        }),
      }
    );

    const getdata = await response.json();
    setFakeData(getdata.list[0].data.content);
    console.log("response : ", getdata);
  };

  useEffect(() => {
    if (window.localStorage.getItem("fakeData")) {
      const fackHtml: string = window.localStorage.getItem("fakeData") ?? "";
      //setFakeData(fackHtml);

      getData();
    }
  }, []);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div ref={refHtml} dangerouslySetInnerHTML={{ __html: fakeData }}></div>
    </Suspense>
  );
}
