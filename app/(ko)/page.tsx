import HomePage from "@/components/pages/HomePage";
import { generateCommonMetadata } from "@/app/utils/metadata";

// canonical은 페이지마다 달라야 해서 루트 layout이 아니라 여기에 둔다.
// 루트 layout에 두면 그 언어의 모든 페이지(글·목록·소개)가 메인의 canonical을
// 물려받아, 구글이 목록 전체를 메인의 중복으로 보고 색인에서 뺀다.
export async function generateMetadata() {
  return generateCommonMetadata({
    title: "iaman",
    description: "This blog was created by an.",
    lang: "ko",
    path: "/",
    hasCounterpart: true,
  });
}

export default function Page() {
  return <HomePage lang="ko" />;
}
