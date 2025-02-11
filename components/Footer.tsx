"use client";

import { useState, useEffect } from "react";

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
      <div
        style={{
          paddingTop: "2.5rem",
          paddingBottom: "2.5rem",
          border: "1px solid yellow",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex" }}>
          <div style={{ marginRight: ".5rem" }}>2025</div>
          <div
            style={{
              content: "",
              width: "1px",
              backgroundColor: "#d3d5d7",
              margin: "0 10px",
            }}
          ></div>
          <div style={{ marginRight: ".5rem" }}> IamAn Blog </div>
          <div
            style={{
              content: "",
              width: "1px",
              backgroundColor: "#d3d5d7",
              margin: "0 10px",
            }}
          ></div>
          <div>
            {" "}
            <a href="/">localhost:3000</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
