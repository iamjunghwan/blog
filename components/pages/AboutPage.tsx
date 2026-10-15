import "@/app/globals.css";
import InnerHeader from "@/components/Layout/InnerHeader";
import { GithubIcon, MailIcon } from "@/components/SvgIcon/index";
import type { Lang } from "@/app/lib/posts/types";

// lang은 지금 쓰지 않는다. 소개 본문에 번역할 문자열이 없기 때문인데,
// 라우트가 넘기는 모양은 다른 페이지와 같게 두어 나중에 번역을 넣을 때 배선이 끝나 있게 한다.
const AboutPage = ({ lang }: { lang: Lang }) => {
  return (
    <>
      <InnerHeader title={`About`} />
      <main className="grid [grid-template-columns:1fr_2.5fr] max-[500px]:flex max-[500px]:flex-col">
        <section className="pt-6 flex flex-col items-center">
          <img
            src="/iaman.png"
            alt="Junghwan An profile picture"
            className="w-[10rem] h-[10rem] rounded-full mr-2"
            width={100}
            height={100}
          />
          <h1 className="pt-4 pb-2 text-2xl font-bold leading-8 tracking-tight">
            Junghwan An
          </h1>
          <p className="text-lg">Software Engineer</p>
          <address className="not-italic">Korea</address>
          <nav aria-label="Social media links" className="flex pt-4">
            <a
              href="mailto:ahndks47@gmail.com"
              className="mr-4"
              aria-label="Send email to ahndks47@gmail.com"
            >
              <MailIcon className="w-8 h-8" />
            </a>
            <a
              href="https://github.com/iamjunghwan"
              aria-label="Visit GitHub profile"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon className="w-8 h-8" />
            </a>
          </nav>
        </section>

        <article className="flex flex-col pl-4 pt-14">
          <p>
            Hello.
            <br />A front developer who always approaches and solves problems
            for why?
          </p>
        </article>
      </main>
    </>
  );
};

export default AboutPage;
