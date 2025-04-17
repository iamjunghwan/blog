import "@/app/globals.css";
import InnerHeader from "@/components/InnerHeader";
import Image from "next/image";

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
          <div className="pt-4 flex flex-col items-center">
            <h2 className="font-bold">iaman</h2>
            <div className="flex pt-4">
              <p> ahndks47@gmail.com</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col pl-4">
          <div className="pt-6 pb-6">
            <h3>ko.</h3>
            <p>
              <br />
              안녕하세요.
              <br />
              <br />
              문제에 있어 항상 “왜?”라는 이유로 접근하여 문제를 해결하는 프론트
              개발자 입니다.
            </p>
          </div>
          <hr />
          <div className="pt-6">
            <h3>en.</h3>
            <p>
              <br />
              Hello.
              <br />
              <br />A front developer who always approaches and solves problems
              for why?
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
