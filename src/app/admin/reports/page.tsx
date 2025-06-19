import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportStatus } from "@prisma/client";
import ReportsTable from "./ReportsTable";
import { ModerationService } from "@/lib/moderation";
import AutoModerationTable from "./AutoModerationTable";

export default async function ReportsPage() {
  const pendingReports = await ModerationService.getReportsForModeration(
    ReportStatus.PENDING,
  );
  const reviewedReports = await ModerationService.getReportsForModeration(
    ReportStatus.UNDER_REVIEW,
  );
  const resolvedReports = await ModerationService.getReportsForModeration(
    ReportStatus.RESOLVED,
  );
  const dismissedReports = await ModerationService.getReportsForModeration(
    ReportStatus.DISMISSED,
  );

  const autoModeratedContent =
    await ModerationService.getAutoModeratedContent();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moderation Center</CardTitle>
        <CardDescription>
          Review user reports and automatically flagged content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending">
              Pending ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="auto-moderated">
              Auto-Flagged ({autoModeratedContent.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              Under Review ({reviewedReports.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedReports.length})
            </TabsTrigger>
            <TabsTrigger value="dismissed">
              Dismissed ({dismissedReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <ReportsTable reports={pendingReports} />
          </TabsContent>
          <TabsContent value="auto-moderated" className="mt-4">
            <AutoModerationTable items={autoModeratedContent} />
          </TabsContent>
          <TabsContent value="reviewed" className="mt-4">
            <ReportsTable reports={reviewedReports} />
          </TabsContent>
          <TabsContent value="resolved" className="mt-4">
            <ReportsTable reports={resolvedReports} />
          </TabsContent>
          <TabsContent value="dismissed" className="mt-4">
            <ReportsTable reports={dismissedReports} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
