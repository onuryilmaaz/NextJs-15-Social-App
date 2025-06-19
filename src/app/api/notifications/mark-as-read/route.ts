import { validateRequest } from "@/auth";
import { markNotificationsAsRead } from "@/lib/notifications";

export async function PATCH() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark all notifications as read using the new notification service
    await markNotificationsAsRead(user.id);

    return new Response();
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
