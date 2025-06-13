import "@/app/globals.css";
import InnerHeader from "@/components/InnerHeader";
import Image from "next/image";
import { GithubIcon, MailIcon } from "@/components/social/index";

export default function Page() {
  return (
    <>
      <InnerHeader title={`About`} />
      <div className="grid [grid-template-columns:1fr_2.5fr] max-[500px]:flex max-[500px]:flex-col">
        <div className="pt-6 flex flex-col items-center">
          <Image
            src="/iaman.png"
            alt=""
            className="w-[10rem] h-[10rem] rounded-full mr-2"
            width={100}
            height={100}
          />
          <h3 className="pt-4 pb-2 text-2xl font-bold leading-8 tracking-tight ">
            Junghwan An
          </h3>
          <div>Software Engineer</div>
          <div>Korea</div>
          <div className="flex pt-4">
            <a href="mailto:ahndks47@gmail.com" className="mr-4">
              <MailIcon className="w-8 h-8" />
            </a>
            <a href="https://github.com/iamjunghwan">
              <GithubIcon className="w-8 h-8" />
            </a>
          </div>
        </div>

        <div className="flex flex-col pl-4 pt-14">
          <p>
            Hello.
            <br />A front developer who always approaches and solves problems
            for why?
          </p>
        </div>
      </div>
    </>
  );
}
