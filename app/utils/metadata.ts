import { Metadata } from "next";
import { SITE_URL } from "@/app/lib/site";

export interface MetadataOptions {
  title: string;
  description: string;
  imageUrl?: string;
  type?: "article" | "website";
  locale?: string;
}

export function generateCommonMetadata(options: MetadataOptions): Metadata {
  const {
    title,
    description,
    imageUrl = `${SITE_URL}/iaman.png`,
    type = "article",
    locale = "ko_KR",
  } = options;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "iaman Blog",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: "Blog Post Image",
        },
      ],
      locale,
      type,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    icons: {
      icon: "/iaman.ico",
    },
  };
}
