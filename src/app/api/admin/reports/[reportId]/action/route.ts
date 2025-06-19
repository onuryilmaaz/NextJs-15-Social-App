import { validateRequest } from "@/auth";
import { createError, handleApiError } from "@/lib/errors";
import { ModerationService } from "@/lib/moderation";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { reportId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isModerator) {
      throw createError.authentication("Not authorized");
    }

    const { reportId } = params;
    const { action, notes } = await req.json();

    if (!action) {
      throw createError.validation("Action is required");
    }

    switch (action) {
      case "approve":
        await ModerationService.resolveReport(reportId, user.id, true, notes);
        break;
      case "dismiss":
        await ModerationService.resolveReport(reportId, user.id, false, notes);
        break;
      case "delete-content":
        await ModerationService.takeActionOnReportedContent(reportId, "delete");
        break;
      case "suspend-user":
        await ModerationService.takeActionOnReportedContent(
          reportId,
          "suspend",
          notes,
        );
        break;
      case "ban-user":
        await ModerationService.takeActionOnReportedContent(reportId, "ban");
        break;
      default:
        throw createError.validation("Invalid action");
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
