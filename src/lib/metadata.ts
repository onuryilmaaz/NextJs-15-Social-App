import { Metadata } from "next";

interface MetadataProps {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  url?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}

export function generateMetadata({
  title,
  description = "Connect and share in the digital echo chamber - where every voice resonates",
  image = "/og-image.png",
  noIndex = false,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  tags,
}: MetadataProps = {}): Metadata {
  const fullTitle = title ? `${title} | EchoVerse` : "EchoVerse";
  const fullUrl = url ? `https://echoverse.app${url}` : "https://echoverse.app";
  const fullImage = image.startsWith("http")
    ? image
    : `https://echoverse.app${image}`;

  return {
    metadataBase: new URL("https://echoverse.app"),
    title: fullTitle,
    description,
    keywords: [
      "social media",
      "social network",
      "connect",
      "share",
      "posts",
      "messages",
      "community",
      ...(tags || []),
    ],
    authors: author ? [{ name: author }] : [{ name: "EchoVerse Team" }],
    creator: "EchoVerse Team",
    publisher: "EchoVerse",
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type,
      locale: "en_US",
      url: fullUrl,
      title: fullTitle,
      description,
      siteName: "EchoVerse",
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt:
            title ||
            "EchoVerse - Connect and share in the digital echo chamber",
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && type === "article" && { authors: [author] }),
    },
    twitter: {
      card: "summary_large_image",
      site: "@echoverse",
      creator: author ? `@${author}` : "@echoverse",
      title: fullTitle,
      description,
      images: [fullImage],
    },
    alternates: {
      canonical: fullUrl,
    },
    other: {
      "application-name": "EchoVerse",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": "EchoVerse",
      "format-detection": "telephone=no",
      "mobile-web-app-capable": "yes",
      "msapplication-TileColor": "#000000",
      "msapplication-tap-highlight": "no",
      "theme-color": "#000000",
    },
  };
}

// Common metadata patterns
export const defaultMetadata = generateMetadata();

export const authMetadata = generateMetadata({
  title: "Authentication",
  description: "Join EchoVerse to connect with others and share your voice",
  noIndex: true,
});

export const profileMetadata = (username: string, displayName?: string) =>
  generateMetadata({
    title: displayName || username,
    description: `Follow ${displayName || username} on EchoVerse`,
    type: "profile",
    url: `/users/${username}`,
  });

export const postMetadata = (
  content: string,
  author: string,
  createdAt: Date,
) =>
  generateMetadata({
    title: `Post by ${author}`,
    description: content.slice(0, 160) + (content.length > 160 ? "..." : ""),
    type: "article",
    author,
    publishedTime: createdAt.toISOString(),
  });

export const hashtagMetadata = (tag: string, postCount?: number) =>
  generateMetadata({
    title: `#${tag}`,
    description: `Explore posts tagged with #${tag} on EchoVerse${
      postCount ? ` (${postCount.toLocaleString()} posts)` : ""
    }`,
    url: `/hashtag/${tag}`,
    tags: [tag],
  });
