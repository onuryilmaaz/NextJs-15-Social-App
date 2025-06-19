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
  const isConnectingRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Stable references for handlers
  const handleNewNotificationRef =
    useRef<(notification: NotificationData) => void>();
  const handleUnreadCountUpdateRef = useRef<(count: number) => void>();

  // Update refs when dependencies change
  useEffect(() => {
    handleNewNotificationRef.current = (notification: NotificationData) => {
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
    };
  }, [queryClient, showToasts, onNotification, showNotificationToast]);

  useEffect(() => {
    handleUnreadCountUpdateRef.current = (count: number) => {
      queryClient.setQueryData(["unread-notification-count"], {
        unreadCount: count,
      });
    };
  }, [queryClient]);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connections
    if (
      !enabled ||
      eventSourceRef.current?.readyState === EventSource.OPEN ||
      isConnectingRef.current
    ) {
      return;
    }

    isConnectingRef.current = true;
    setConnectionStatus("connecting");

    try {
      const eventSource = new EventSource("/api/notifications/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.log("Real-time notifications connected");
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const eventData: NotificationEvent = JSON.parse(event.data);

          switch (eventData.type) {
            case "connected":
              // Only log in development
              if (process.env.NODE_ENV === "development") {
                console.log("SSE connection established");
              }
              break;

            case "heartbeat":
              // Keep connection alive
              break;

            case "notification":
              if (eventData.data && handleNewNotificationRef.current) {
                handleNewNotificationRef.current(eventData.data);
              }
              break;

            case "unread_count":
              if (
                typeof eventData.count === "number" &&
                handleUnreadCountUpdateRef.current
              ) {
                handleUnreadCountUpdateRef.current(eventData.count);
              }
              break;
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };

      eventSource.onerror = () => {
        setConnectionStatus("disconnected");
        isConnectingRef.current = false;
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
      isConnectingRef.current = false;
    }
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    isConnectingRef.current = false;
    setConnectionStatus("disconnected");
  }, []);

  // Connect on mount and when enabled changes
  useEffect(() => {
    if (enabled && mounted) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, mounted]); // Depend on both enabled and mounted

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
