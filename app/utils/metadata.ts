import { Metadata } from "next";

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
    imageUrl = "https://iaman.kr/iaman.png",
    type = "article",
    locale = "en_US",
  } = options;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "iaman's Blog",
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
