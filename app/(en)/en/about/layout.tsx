import { generateCommonMetadata } from "@/app/utils/metadata";
import { SITE_COPY } from "@/app/lib/i18n/site-copy";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "About by iaman",
    description: SITE_COPY.en.about,
    lang: "en",
    path: "/about",
    hasCounterpart: true,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
