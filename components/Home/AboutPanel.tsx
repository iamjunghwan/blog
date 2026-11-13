/****************************************
 *
 * AboutPanel : 메인 히어로 — 에디터 창 모양의 자기소개
 *
 * 이 페이지의 h1 이다. "The Latest Article" 은 섹션 이름이지 페이지 제목이
 * 아니어서, 방문자에게도 검색엔진에도 이 블로그가 무엇인지 한 글자도
 * 말하지 않고 있었다.
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
    <div className="code-panel">
      <div className="code-panel-chrome">
        <i className="code-dot code-dot-r" />
        <i className="code-dot code-dot-y" />
        <i className="code-dot code-dot-g" />
        <span className="code-panel-name">intro.ts</span>
      </div>

      <div className="code-panel-body">
        <h1 className="code-line">
          <span className="tok-k">const</span>{" "}
          <span className="tok-n">iaman</span> = {"{"}
          {"\n  "}
          <span className="tok-p">name</span>:{" "}
          <span className="tok-s">&quot;{NAME}&quot;</span>,{"\n  "}
          <span className="tok-p">role</span>:{" "}
          <span className="tok-s">&quot;{m.heroRole}&quot;</span>,{"\n  "}
          {/*
            배열을 두 벌 그려 두고 CSS 로 하나만 보인다.
            - 넓은 화면: 한 줄. 패널이 가로로 길어져 에디터 창처럼 보인다.
            - 좁은 화면: 줄로 편다. 한 줄로 두면 "Next.js" 가 잘리는데,
              이건 페이지의 h1 이라 잘리면 안 된다.
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
          <span className="tok-s">&quot;{m.heroAsks}&quot;</span>,{"\n"}
          {"}"} <span className="tok-k">as const</span>;
          <span className="code-cursor" aria-hidden="true" />
        </h1>

        {since && (
          <p className="code-comment">
            {"// "}
            {m.heroSince(since)}
          </p>
        )}
      </div>
    </div>
  );
};

export default AboutPanel;
