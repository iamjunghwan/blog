import InnerHeader from "@/components/InnerHeader";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <InnerHeader title={`404`} />
      <hr />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          marginTop: "3rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "3rem",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: "2rem" }}>
            {"Can Not Find This Page !"}
          </p>
          <div>
            <Link href="/">
              <button
                style={{
                  backgroundColor: "yellow",
                  borderRadius: ".5rem",
                  fontSize: "1rem",
                  padding: "1rem 2rem",
                }}
              >
                go to main
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
