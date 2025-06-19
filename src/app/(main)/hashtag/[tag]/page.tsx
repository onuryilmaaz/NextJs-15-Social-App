import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import HashtagFeed from "./HashtagFeed";
import HashtagHeader from "./HashtagHeader";

interface PageProps {
  params: { tag: string };
  searchParams: { sortBy?: string };
}

export function generateMetadata({ params: { tag } }: PageProps): Metadata {
  const decodedTag = decodeURIComponent(tag);
  return {
    title: `#${decodedTag} - BugBook`,
    description: `Explore posts tagged with #${decodedTag}`,
  };
}

export default function HashtagPage({
  params: { tag },
  searchParams: { sortBy = "recent" },
}: PageProps) {
  const decodedTag = decodeURIComponent(tag);

  // Basic validation
  if (!decodedTag || decodedTag.length > 50) {
    notFound();
  }

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <HashtagHeader hashtag={decodedTag} sortBy={sortBy} />
        <HashtagFeed hashtag={decodedTag} sortBy={sortBy} />
      </div>
      <TrendsSidebar />
    </main>
  );
}
