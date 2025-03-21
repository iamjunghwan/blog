"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <footer>
      <div className="centerFooterInTextArea">
        <div style={{ display: "flex" }}>
          <div style={{ marginRight: ".5rem" }}> © 2025</div>
          <div className="separation"></div>
          <div style={{ marginRight: ".5rem" }}> iaman </div>
          <div className="separation"></div>
          <div>
            <Link href="/">https://iaman.kr</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
