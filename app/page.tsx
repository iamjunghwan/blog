import Image from "next/image";

export default function Home() {
  const dataList = [
    { date: "2025-01-01", title: "node.js에 대해서..." },
    { date: "2025-01-02", title: "node.js에 대해서..." },
    { date: "2025-01-03", title: "node.js에 대해서..." },
    { date: "2025-01-04", title: "node.js에 대해서..." },
  ];

  return (
    <>
      <ul>
        {dataList.map((obj) => (
          <li style={{ paddingBottom: "3rem", paddingTop: "3rem" }}>
            <article>
              <dl>
                <dd>
                  <time>{obj.date}</time>
                  <code style={{ color: "#ec4899" }}>
                    {"select * from iaman"}{" "}
                  </code>
                </dd>
              </dl>
              <h2>{obj.title}</h2>
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
