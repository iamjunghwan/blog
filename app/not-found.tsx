import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 page not found",
  description: "404 page not found",
};

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
