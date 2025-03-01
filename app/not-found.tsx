import type { Metadata } from "next";
import Link from "next/link";
import Head from "next/head";

// export async function generateMetadata() {
//   return {
//     title: "404 - Page Not Found",
//     description: "The page you are looking for cannot be found.",
//     robots: {
//       index: true,
//       follow: true, // 'noindex'를 제거하여 검색엔진이 페이지를 크롤링할 수 있도록 허용
//     },
//   };
// }

export default function NotFound() {
  return (
    <>
      <div
        style={{
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
        }}
      >
        <h1 style={{ fontSize: "3rem", fontWeight: 900 }}>404</h1>
      </div>
      <hr />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          marginTop: "3rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "3rem",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: "2rem" }}>
            {"Can Not Find This Page !"}
          </p>
          <div>
            <Link href="/">
              <button
                style={{
                  backgroundColor: "yellow",
                  borderRadius: ".5rem",
                  fontSize: "1rem",
                  padding: "1rem 2rem",
                }}
              >
                go to main
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
