import { generateCommonMetadata } from "@/app/utils/metadata";

export async function generateMetadata() {
  return generateCommonMetadata({
    title: "About by iaman",
    description: "A blog by an.",
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
