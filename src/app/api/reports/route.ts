import { validateRequest } from "@/auth";
import { submitReport } from "@/lib/moderation";
import { ReportType } from "@prisma/client";
import { createError, handleApiError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      throw createError.authentication();
    }

    const body = await req.json();
    const { type, reason, description, reportedUserId, postId, commentId } =
      body;

    if (!type || !reason?.trim()) {
      throw createError.validation("Report type and reason are required");
    }

    if (!Object.values(ReportType).includes(type)) {
      throw createError.validation("Invalid report type");
    }

    // Ensure at least one target is specified
    if (!reportedUserId && !postId && !commentId) {
      throw createError.validation("Must specify what to report");
    }

    const report = await submitReport({
      type,
      reason: reason.trim(),
      description: description?.trim(),
      reporterId: user.id,
      reportedId: reportedUserId,
      postId,
      commentId,
    });

    return Response.json({ success: true, reportId: report.id });
  } catch (error) {
    return handleApiError(error);
  }
}
