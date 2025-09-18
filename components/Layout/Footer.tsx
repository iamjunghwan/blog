"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Footer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <footer>
      <div className="pt-10 pb-10 flex flex-col items-center">
        <div className="flex">
          <div className="mr-2"> © 2025</div>
          <div className="w-px bg-[#d3d5d7] mx-2"></div>
          <div className="mr-2"> iaman </div>
          <div className="w-px bg-[#d3d5d7] mx-2"></div>
          <div>
            <Link href="/">https://iaman.kr</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
