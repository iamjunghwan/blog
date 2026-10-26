import HomePage from "@/components/pages/HomePage";
import { generateCommonMetadata } from "@/app/utils/metadata";
import { SITE_COPY } from "@/app/lib/i18n/site-copy";
import { JsonLd, websiteJsonLd } from "@/app/lib/seo/json-ld";

// canonical은 페이지마다 달라야 해서 루트 layout이 아니라 여기에 둔다.
// 루트 layout에 두면 그 언어의 모든 페이지(글·목록·소개)가 메인의 canonical을
// 물려받아, 구글이 목록 전체를 메인의 중복으로 보고 색인에서 뺀다.
export async function generateMetadata() {
  return generateCommonMetadata({
    title: "iaman",
    description: SITE_COPY.en.home,
    lang: "en",
    path: "/",
    hasCounterpart: true,
  });
}

export default function Page() {
  return (
    <>
      <JsonLd data={websiteJsonLd("en")} />
      <HomePage lang="en" />
    </>
  );
}
