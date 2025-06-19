import { validateRequest } from "@/auth";
import TrendsSidebar from "@/components/TrendsSidebar";
import { redirect } from "next/navigation";
import DiscoverFeed from "./DiscoverFeed";
import DiscoverTabs from "./DiscoverTabs";

export const metadata = {
  title: "Discover - BugBook",
  description: "Discover trending content and new users to follow",
};

interface PageProps {
  searchParams: {
    tab?: string;
    category?: string;
  };
}

export default async function DiscoverPage({
  searchParams: { tab = "trending", category = "all" },
}: PageProps) {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Discover</h1>
              <p className="mt-2 text-muted-foreground">
                Find trending content and connect with new people
              </p>
            </div>
            <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 p-3">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
        </div>

        <DiscoverTabs currentTab={tab} currentCategory={category} />
        <DiscoverFeed tab={tab} category={category} />
      </div>
      <TrendsSidebar />
    </main>
  );
}
