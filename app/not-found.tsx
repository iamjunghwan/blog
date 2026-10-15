import "@/app/globals.css";
import Link from "next/link";

/**
 * 루트 레이아웃이 (ko)/(en) 둘로 나뉘면 최상위 not-found는 어느 쪽에도 감싸이지 않아
 * <html>과 <body> 없이 렌더된다. 그래서 여기서 직접 들고 있는다.
 *
 * 이 페이지는 어떤 언어 폴더에도 속하지 않는 주소(예: /aaa)에서 나오므로
 * 언어를 알 수 없다. 영어로 적고 양쪽 홈으로 가는 링크를 둔다.
 */
export default function NotFound() {
  return (
    <html lang="en">
      <body className="font-custom bg-white dark:bg-black text-black dark:text-white">
        <div className="mx-auto max-w-3xl px-6 flex flex-col items-center justify-center min-h-screen gap-6">
          <p className="text-5xl font-black">404</p>
          <p className="font-bold text-2xl">Can Not Find This Page !</p>
          <div className="flex gap-3">
            <Link href="/">
              <button className="bg-yellow-200 rounded-lg text-base py-4 px-8 text-black">
                한국어 홈
              </button>
            </Link>
            <Link href="/en">
              <button className="bg-yellow-200 rounded-lg text-base py-4 px-8 text-black">
                English home
              </button>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
