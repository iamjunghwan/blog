import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 page not found",
  description: "404 page not found",
};

export default function NotFound() {
  return (
    <>
      <div>{"can not find this page"}</div>
      <Link href="/">
        <button
          style={{
            backgroundColor: "yellow",
            color: "black",
            borderRadius: ".5rem",
          }}
        >
          go to main
        </button>
      </Link>
    </>
  );
}
