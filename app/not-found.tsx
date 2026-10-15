import "@/app/globals.css";
import Link from "next/link";
import { fonts } from "@/app/utils/fonts";

/**
 * 어떤 언어 폴더에도 속하지 않는 주소(예: /aaa)에서 나오는 페이지.
 *
 * 루트 레이아웃이 (ko)/(en) 둘로 나뉘어 이 페이지는 어느 쪽에도 감싸이지 않는다.
 * 그렇다고 <html>을 직접 들고 있으면 안 된다 — Next가 최상위 not-found에 바깥
 * 래퍼를 이미 씌워서 <html>과 <body>가 두 벌이 된다(실측으로 확인했다).
 * 그래서 내용만 그리고, 폰트 변수는 감싸는 div에 얹는다. CSS 변수는 상속되므로
 * <html>에 없어도 이 하위에서는 font-custom이 제대로 해석된다.
 *
 * 레이아웃이 없다는 건 <html lang>·<title>·ThemeProvider도 없다는 뜻이다.
 * 셋 다 아래 스크립트가 직접 채운다. 특히 테마가 없으면 darkMode:"class"가
 * 절대 켜지지 않아 다크 모드 독자가 흰 화면을 보게 된다.
 *
 * 언어를 알 수 없는 페이지라 영어로 적고 양쪽 홈으로 가는 링크를 둔다.
 */
export default function NotFound() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              var root = document.documentElement;
              root.lang = 'en';
              document.title = '404 | iaman';
              try {
                var saved = localStorage.getItem('blog-Theme');
                var dark =
                  saved === 'dark' ||
                  (saved === 'system' &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (dark) root.classList.add('dark');
              } catch (e) {}
            })();
          `,
        }}
      />
      <div
        className={`${fonts.variable} font-custom bg-white dark:bg-black text-black dark:text-white`}
      >
        <div className="mx-auto max-w-3xl px-6 flex flex-col items-center justify-center min-h-screen gap-6">
          <p className="text-5xl font-black">404</p>
          <p className="font-bold text-2xl">Can Not Find This Page !</p>
          <div className="flex gap-3">
            <Link href="/">
              <button className="bg-yellow-200 rounded-lg text-base py-4 px-8 text-black">
                <span lang="ko">한국어 홈</span>
              </button>
            </Link>
            <Link href="/en">
              <button className="bg-yellow-200 rounded-lg text-base py-4 px-8 text-black">
                English home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
