"use client";

import Image from "next/image";

export default function Page() {
  return (
    <>
      <div
        style={{
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
        }}
      >
        <h1 style={{ fontSize: "3rem", fontWeight: 900 }}>About</h1>
      </div>
      <hr />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2.5fr",
        }}
      >
        <div
          style={{
            paddingTop: "1.5rem",
            alignItems: "center",
            flexDirection: "column",
            display: "flex",
          }}
        >
          <Image
            style={{ width: "10rem", height: "10rem" }}
            src="/image4.png"
            alt=""
            className="leftHeaderInImgArea"
          />
          <div
            style={{
              paddingTop: "1rem",
              alignItems: "center",
            }}
          >
            <h3 style={{ fontWeight: "700" }}>IamAn</h3>
            <div style={{ display: "flex" }}>
              {/* <a>
                
              </a>
              <a>

              </a>
              <a>

              </a> */}
            </div>
          </div>
        </div>

        <div style={{ display: "column" }}>
          <div
            style={{
              paddingTop: "1.5rem",
              paddingBottom: "1.5rem",
            }}
          >
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
          <div
            style={{
              paddingTop: "1.5rem",
            }}
          >
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
