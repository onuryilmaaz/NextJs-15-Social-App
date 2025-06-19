import { validateRequest } from "@/auth";
import TrendsSidebar from "@/components/TrendsSidebar";
import { redirect } from "next/navigation";
import BlockedUsersList from "./BlockedUsersList";

export default async function BlockedUsersPage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="text-2xl font-bold">Blocked Users</h1>
          <p className="mt-2 text-muted-foreground">
            Manage users you have blocked. You can unblock them to restore
            normal interactions.
          </p>
        </div>
        <BlockedUsersList />
      </div>
      <TrendsSidebar />
    </main>
  );
}
