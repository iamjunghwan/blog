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
    imageUrl = `${SITE_URL}/default-thumbnail.png`,
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
          alt: title,
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
