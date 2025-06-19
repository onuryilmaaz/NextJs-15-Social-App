import { validateRequest } from "@/auth";
import TrendsSidebar from "@/components/TrendsSidebar";
import { redirect } from "next/navigation";
import UserAnalyticsDashboard from "./UserAnalyticsDashboard";

export const metadata = {
  title: "Analytics - BugBook",
  description: "View your engagement metrics and content performance",
};

export default async function AnalyticsPage() {
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
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <p className="mt-2 text-muted-foreground">
                Track your engagement, growth, and content performance
              </p>
            </div>
            <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-3">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>
        <UserAnalyticsDashboard userId={user.id} />
      </div>
      <TrendsSidebar />
    </main>
  );
}
