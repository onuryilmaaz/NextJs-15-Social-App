"use client";

import { useMemo } from "react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { NotificationData } from "@/lib/types";
import { useSession } from "./SessionProvider";
import ClientOnly from "@/components/ClientOnly";

interface RealtimeNotificationsProviderProps {
  children: React.ReactNode;
}

function RealtimeNotificationsContent({
  children,
}: RealtimeNotificationsProviderProps) {
  const { user } = useSession();

  // Memoize the notification handler to prevent re-renders
  const handleNotification = useMemo(
    () => (notification: NotificationData) => {
      // Custom logic for handling notifications can be added here
      if (process.env.NODE_ENV === "development") {
        console.log("New notification received:", notification.type);
      }
    },
    [],
  );

  const { connectionStatus } = useRealtimeNotifications({
    enabled: !!user, // Only enable if user is logged in
    showToasts: true,
    onNotification: handleNotification,
  });

  // Don't render connection status if user is not logged in
  if (!user) {
    return <>{children}</>;
  }

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
            {connectionStatus}
          </div>
        </div>
      )}
    </>
  );
}

export default function RealtimeNotificationsProvider({
  children,
}: RealtimeNotificationsProviderProps) {
  return (
    <ClientOnly fallback={<>{children}</>}>
      <RealtimeNotificationsContent>{children}</RealtimeNotificationsContent>
    </ClientOnly>
  );
}
