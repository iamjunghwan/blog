import InnerHeader from "@/components/InnerHeader";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <InnerHeader title={`404`} />
      <hr />
      <div className="flex items-center justify-center flex-col mt-12">
        <div className="flex flex-col items-center justify-center mt-12">
          <p className="font-bold text-2xl">{"Can Not Find This Page !"}</p>
          <div>
            <Link href="/">
              <button className="bg-yellow-200 rounded-lg text-base py-4 px-8">
                go to main
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
