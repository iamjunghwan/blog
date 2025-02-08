import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "iaman blog write",
  description: "blog write for iaman",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div style={{ border: "5px solid red" }}>{children}</div>;
}
