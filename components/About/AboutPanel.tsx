/****************************************
 *
 * AboutPanel : About 페이지의 자기소개 — 에디터 창 모양
 *
 * 원래 메인 히어로(페이지 h1)였다. About 으로 옮기면서 제목 태그를 뗐다 —
 * About 의 제목은 페이지 머리와 이름이 맡으므로, 코드 조각은 본문 블록으로 둔다.
 *
 * 서버 컴포넌트다. 문법 하이라이팅은 span 에 색을 직접 칠해서 끝낸다 —
 * 히어로 한 덩어리 때문에 Shiki·Prism 을 넣을 이유가 없다. 커서 깜빡임도
 * CSS 뿐이라 이 화면이 늘리는 클라이언트 JS 는 0 이다.
 *
 * 패널 안의 객체 값은 두 언어가 같다. 코드 조각에 한국어를 섞으면 모노
 * 글꼴에 한글이 없어 그 글자만 다른 서체로 떨어진다. 문장으로 읽히는
 * 주석만 번역한다.
 *
 ****************************************/

import { messages } from "@/app/lib/i18n/messages";
import type { Lang } from "@/app/lib/posts/types";

interface AboutPanelProps {
  lang: Lang;
  since: string | null;
}

const NAME = "iaman";
const STACK = ["JavaScript", "React", "Next.js"];

const AboutPanel = ({ lang, since }: AboutPanelProps) => {
  const m = messages(lang);

  return (
    <div className="code-panel-wrap">
      <div className="code-panel">
        <div className="code-panel-chrome">
          <i className="code-dot code-dot-r" />
          <i className="code-dot code-dot-y" />
          <i className="code-dot code-dot-g" />
          <span className="code-panel-name">intro.ts</span>
        </div>

        <div className="code-panel-body">
          <p className="code-line">
            <span className="tok-k">const</span>{" "}
            <span className="tok-n">iaman</span> = {"{"}
            {"\n  "}
            <span className="tok-p">name</span>:{" "}
            <span className="tok-s">&quot;{NAME}&quot;</span>,{"\n  "}
            <span className="tok-p">role</span>:{" "}
            <span className="tok-s">&quot;{m.aboutRole}&quot;</span>,{"\n  "}
            {/*
              배열을 두 벌 그려 두고 CSS 로 하나만 보인다 (기준은 패널이 놓인 칸의 폭).
              - 넓은 칸: 한 줄. 패널이 가로로 길어져 에디터 창처럼 보인다.
              - 좁은 칸: 줄로 편다. 한 줄로 두면 "Next.js" 가 잘리는데,
                자기소개 본문이라 잘리면 안 된다.
              display:none 인 쪽은 white-space:pre 에서도 자리를 차지하지 않는다.
              같은 STACK 배열을 돌리므로 둘이 어긋날 일은 없다.
            */}
            <span className="stack-wide">
              <span className="tok-p">stack</span>: [
              {STACK.map((item, i) => (
                <span key={item}>
                  <span className="tok-s">&quot;{item}&quot;</span>
                  {i < STACK.length - 1 ? ", " : ""}
                </span>
              ))}
              ],
            </span>
            <span className="stack-narrow">
              <span className="tok-p">stack</span>: [
              {STACK.map((item) => (
                <span key={item}>
                  {"\n    "}
                  <span className="tok-s">&quot;{item}&quot;</span>,
                </span>
              ))}
              {"\n  "}],
            </span>
            {"\n  "}
            <span className="tok-p">asks</span>:{" "}
            <span className="tok-s">&quot;{m.aboutAsks}&quot;</span>,{"\n"}
            {"}"} <span className="tok-k">as const</span>;
            <span className="code-cursor" aria-hidden="true" />
          </p>

          {since && (
            <p className="code-comment">
              {"// "}
              {m.aboutSince(since)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutPanel;
