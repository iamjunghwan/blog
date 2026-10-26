import "@/app/globals.css";
import RootShell from "@/components/Layout/RootShell";
import { generateCommonMetadata } from "@/app/utils/metadata";
import { SITE_COPY } from "@/app/lib/i18n/site-copy";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "iaman",
    description: SITE_COPY.en.home,
    lang: "en",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="en">{children}</RootShell>;
}
