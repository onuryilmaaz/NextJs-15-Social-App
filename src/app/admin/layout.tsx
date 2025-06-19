import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";

export const metadata = {
  title: "Admin Dashboard - BugBook",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();

  if (!user || !user.isModerator) {
    redirect("/");
  }

  const stats = await prisma.$transaction([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.report.count({ where: { status: ReportStatus.PENDING } }),
  ]);

  const [userCount, postCount, commentCount, pendingReports] = stats;

  return (
    <div className="flex min-h-screen w-full">
      <AdminSidebar />
      <main className="flex-1 space-y-6 p-6 sm:p-10">
        <header>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome, {user.displayName}. Here you can manage the platform.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
              <CardDescription>All registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{userCount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Posts</CardTitle>
              <CardDescription>All posts on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{postCount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Comments</CardTitle>
              <CardDescription>All comments on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {commentCount.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle>Pending Reports</CardTitle>
              <CardDescription>Reports needing review</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-500">
                {pendingReports.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </section>

        {children}
      </main>
    </div>
  );
}
