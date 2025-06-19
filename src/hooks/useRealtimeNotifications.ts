"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationData } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

interface NotificationEvent {
  type: "connected" | "heartbeat" | "notification" | "unread_count";
  data?: NotificationData;
  count?: number;
  timestamp: number;
}

interface UseRealtimeNotificationsOptions {
  enabled?: boolean;
  showToasts?: boolean;
  onNotification?: (notification: NotificationData) => void;
}

export function useRealtimeNotifications(
  options: UseRealtimeNotificationsOptions = {},
) {
  const { enabled = true, showToasts = true, onNotification } = options;
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const showNotificationToast = useCallback(
    (notification: NotificationData) => {
      const getMessage = () => {
        switch (notification.type) {
          case "LIKE":
            return `${notification.issuer.displayName} liked your post`;
          case "COMMENT":
            return `${notification.issuer.displayName} commented on your post`;
          case "FOLLOW":
            return `${notification.issuer.displayName} started following you`;
          case "MENTION":
            return `${notification.issuer.displayName} mentioned you`;
          case "POST_SHARE":
            return `${notification.issuer.displayName} shared your post`;
          case "FOLLOW_REQUEST":
            return `${notification.issuer.displayName} requested to follow you`;
          case "FOLLOW_ACCEPT":
            return `${notification.issuer.displayName} accepted your follow request`;
          default:
            return `New notification from ${notification.issuer.displayName}`;
        }
      };

      toast({
        title: "New Notification",
        description: getMessage(),
        duration: 4000,
      });
    },
    [toast],
  );

  const handleNewNotification = useCallback(
    (notification: NotificationData) => {
      // Update notifications list
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any, index: number) => {
            if (index === 0) {
              // Add to first page
              return {
                ...page,
                notifications: [notification, ...page.notifications],
              };
            }
            return page;
          }),
        };
      });

      // Show toast notification
      if (showToasts) {
        showNotificationToast(notification);
      }

      // Call custom handler
      onNotification?.(notification);
    },
    [queryClient, showToasts, onNotification, showNotificationToast],
  );

  const handleUnreadCountUpdate = useCallback(
    (count: number) => {
      queryClient.setQueryData(["unread-notification-count"], {
        unreadCount: count,
      });
    },
    [queryClient],
  );

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    setConnectionStatus("connecting");

    try {
      const eventSource = new EventSource("/api/notifications/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
        console.log("Real-time notifications connected");
      };

      eventSource.onmessage = (event) => {
        try {
          const eventData: NotificationEvent = JSON.parse(event.data);

          switch (eventData.type) {
            case "connected":
              console.log("SSE connection established");
              break;

            case "heartbeat":
              // Keep connection alive
              break;

            case "notification":
              if (eventData.data) {
                handleNewNotification(eventData.data);
              }
              break;

            case "unread_count":
              if (typeof eventData.count === "number") {
                handleUnreadCountUpdate(eventData.count);
              }
              break;
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };

      eventSource.onerror = () => {
        setConnectionStatus("disconnected");
        eventSource.close();

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000,
          );

          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.log("Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("Error creating EventSource:", error);
      setConnectionStatus("disconnected");
    }
  }, [enabled, handleNewNotification, handleUnreadCountUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionStatus("disconnected");
  }, []);

  // Connect on mount and when enabled changes
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Reconnect when browser comes back online
  useEffect(() => {
    const handleOnline = () => {
      if (enabled && connectionStatus === "disconnected") {
        connect();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [enabled, connectionStatus, connect]);

  return {
    connectionStatus,
    connect,
    disconnect,
  };
}
