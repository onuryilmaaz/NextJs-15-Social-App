import { validateRequest } from "@/auth";
import { ModerationService } from "@/lib/moderation";
import { createError, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      throw createError.authentication();
    }

    const blockedUsers = await ModerationService.getBlockedUsers(user.id);

    return Response.json(blockedUsers);
  } catch (error) {
    return handleApiError(error);
  }
}
