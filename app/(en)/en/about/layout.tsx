import { generateCommonMetadata } from "@/app/utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "About by iaman",
    description: "A blog by an.",
    lang: "en",
    path: "/about",
    hasCounterpart: true,
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
