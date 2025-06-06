"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { TagListProps } from "@/type/index";

export default function TagList({ currTag, tagNames }: TagListProps) {
  const [activeTag, setActiveTag] = useState<string>(currTag);
  const router = useRouter();

  //여기다가 client 구현을 해보자.

  const handleClick = useCallback(
    (tag: string) => {
      if (tag === currTag) return;

      setActiveTag(tag);
      router.push(`/post/${tag}`);
    },
    [currTag, router]
  );

  return (
    <div className="w-full flex overflow-x-auto space-x-1 whitespace-nowrap mt-4 pb-2 px-2">
      {["all", ...tagNames].map((tag, index) => (
        <div
          key={index}
          onClick={() => handleClick(tag)}
          className={`shrink-0 px-3 py-1 rounded-full text-sm uppercase cursor-pointer ${
            activeTag === tag
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          {tag}
        </div>
      ))}
    </div>
  );
}
