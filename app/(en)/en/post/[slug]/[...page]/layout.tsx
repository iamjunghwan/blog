import { generateCommonMetadata } from "@/app/utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "Posts by iaman",
    description: "A blog by an.",
    lang: "en",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
