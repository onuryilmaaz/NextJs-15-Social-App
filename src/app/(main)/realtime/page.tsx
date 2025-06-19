import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ActivityFeed from "@/components/realtime/ActivityFeed";
import LiveUserStatus, {
  OnlineUsers,
} from "@/components/realtime/LiveUserStatus";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import { Radio, Users, Activity, MessageSquare, Eye } from "lucide-react";

export const metadata = {
  title: "Real-time Dashboard",
  description: "Live activity and user presence across the platform",
};

export default async function RealtimePage() {
  const { user } = await validateRequest();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Radio className="h-8 w-8 text-green-500" />
            Real-time Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Live activity, user presence, and real-time interactions
          </p>
        </div>
        <Badge variant="default" className="gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Live
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-green-500" />
              Online Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-blue-500" />
              Live Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2k</div>
            <p className="text-xs text-muted-foreground">Actions per minute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-purple-500" />
              Active Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              Ongoing conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-orange-500" />
              Live Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3k</div>
            <p className="text-xs text-muted-foreground">Pages being viewed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Feed */}
        <div className="space-y-6">
          <ActivityFeed />
        </div>

        {/* User Presence */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Status</CardTitle>
            </CardHeader>
            <CardContent>
              <LiveUserStatus
                userId={user.id}
                showActivity={true}
                size="lg"
                className="justify-start"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Online Users</CardTitle>
            </CardHeader>
            <CardContent>
              <OnlineUsers maxUsers={15} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Real-time Features Info */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <Activity className="h-4 w-4 text-blue-500" />
                Live Activity Feed
              </h4>
              <p className="text-sm text-muted-foreground">
                See user actions as they happen in real-time across the platform
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <Users className="h-4 w-4 text-green-500" />
                User Presence
              </h4>
              <p className="text-sm text-muted-foreground">
                Track who&apos;s online, away, or busy with live status updates
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <MessageSquare className="h-4 w-4 text-purple-500" />
                Live Notifications
              </h4>
              <p className="text-sm text-muted-foreground">
                Instant notifications for likes, comments, follows, and mentions
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <Radio className="h-4 w-4 text-red-500" />
                Live Chat
              </h4>
              <p className="text-sm text-muted-foreground">
                Real-time messaging with typing indicators and presence
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <Eye className="h-4 w-4 text-orange-500" />
                Live Updates
              </h4>
              <p className="text-sm text-muted-foreground">
                Posts, comments, and interactions update instantly without
                refresh
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <Activity className="h-4 w-4 text-indigo-500" />
                Performance Monitoring
              </h4>
              <p className="text-sm text-muted-foreground">
                Real-time system performance and health monitoring
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
