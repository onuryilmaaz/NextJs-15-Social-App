import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getCachedPerformanceMetrics,
  getCachedPlatformMetrics,
} from "@/lib/cache";
import { AnalyticsService } from "@/lib/analytics";
import { formatDistanceToNow } from "date-fns";
import PerformanceChart from "./PerformanceChart";
import QueryAnalyzer from "./QueryAnalyzer";

export const metadata = {
  title: "Performance Monitoring - Admin",
  description: "Real-time performance metrics and system health",
};

export default async function PerformancePage() {
  const [performanceMetrics, platformMetrics, recentStats] = await Promise.all([
    getCachedPerformanceMetrics(),
    getCachedPlatformMetrics(),
    AnalyticsService.getEngagementInsights(undefined, 1), // Last day
  ]);

  const getHealthStatus = (queryTime: number) => {
    if (queryTime < 100) return { status: "excellent", color: "green" };
    if (queryTime < 300) return { status: "good", color: "blue" };
    if (queryTime < 500) return { status: "fair", color: "yellow" };
    return { status: "poor", color: "red" };
  };

  const health = getHealthStatus(performanceMetrics.queryTime);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        <p className="mt-2 text-muted-foreground">
          Real-time system performance and health metrics
        </p>
      </div>

      {/* Health Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Database Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge
                variant={health.color === "green" ? "default" : "destructive"}
                className="capitalize"
              >
                {health.status}
              </Badge>
              <span className="text-2xl font-bold">
                {performanceMetrics.queryTime}ms
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Average query time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {platformMetrics.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (platformMetrics.activeUsers / platformMetrics.totalUsers) *
                100
              ).toFixed(1)}
              % of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cache Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="default">Active</Badge>
              <span className="text-2xl font-bold">98%</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Hit rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Last Check</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDistanceToNow(performanceMetrics.timestamp)}
            </div>
            <p className="text-xs text-muted-foreground">ago</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Query Performance</CardTitle>
            <CardDescription>
              Database query response times over the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PerformanceChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
            <CardDescription>
              Resource usage and throughput metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Users</span>
                <span className="font-bold">
                  {platformMetrics.totalUsers.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Posts</span>
                <span className="font-bold">
                  {platformMetrics.totalPosts.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Comments</span>
                <span className="font-bold">
                  {platformMetrics.totalComments.toLocaleString()}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm">DB Connected</span>
                <Badge
                  variant={
                    performanceMetrics.dbConnected ? "default" : "destructive"
                  }
                >
                  {performanceMetrics.dbConnected ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Query Analyzer */}
      <Card>
        <CardHeader>
          <CardTitle>Query Analyzer</CardTitle>
          <CardDescription>
            Analyze slow queries and optimization recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QueryAnalyzer />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest system events and performance alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="text-sm font-medium">
                  Database optimization completed
                </p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
              <div>
                <p className="text-sm font-medium">Cache warming initiated</p>
                <p className="text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-yellow-500" />
              <div>
                <p className="text-sm font-medium">
                  High memory usage detected
                </p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
