"use client";

import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { NotificationData } from "@/lib/types";
import { useSession } from "./SessionProvider";

interface RealtimeNotificationsProviderProps {
  children: React.ReactNode;
}

export default function RealtimeNotificationsProvider({
  children,
}: RealtimeNotificationsProviderProps) {
  const { user } = useSession();

  const { connectionStatus } = useRealtimeNotifications({
    enabled: true,
    showToasts: true,
    onNotification: (notification: NotificationData) => {
      // Custom logic for handling notifications can be added here
      console.log("New notification received:", notification.type);
    },
  });

  return (
    <>
      {children}
      {/* Optional: Connection status indicator */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 z-50">
          <div
            className={`rounded px-2 py-1 font-mono text-xs ${
              connectionStatus === "connected"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : connectionStatus === "connecting"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}
          >
            SSE: {connectionStatus}
          </div>
        </div>
      )}
    </>
  );
}
