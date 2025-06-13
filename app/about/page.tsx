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
