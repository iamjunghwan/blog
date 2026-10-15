import "@/app/globals.css";
import RootShell from "@/components/Layout/RootShell";
import { generateCommonMetadata } from "@/app/utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "iaman",
    description: "This blog was created by an.",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="ko">{children}</RootShell>;
}
