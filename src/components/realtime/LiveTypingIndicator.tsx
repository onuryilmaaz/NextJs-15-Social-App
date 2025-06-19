"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface TypingUser {
  id: string;
  name: string;
  avatar?: string;
}

interface LiveTypingIndicatorProps {
  channelId: string;
  currentUserId: string;
  className?: string;
}

export default function LiveTypingIndicator({
  channelId,
  currentUserId,
  className,
}: LiveTypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/realtime/typing/${channelId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "typing") {
          setTypingUsers((current) => {
            // Remove user if they stopped typing
            if (!data.isTyping) {
              return current.filter((user) => user.id !== data.user.id);
            }

            // Add user if they started typing and it's not the current user
            if (data.user.id !== currentUserId) {
              const exists = current.some((user) => user.id === data.user.id);
              if (!exists) {
                return [...current, data.user];
              }
            }

            return current;
          });
        }
      } catch (error) {
        console.error("Error parsing typing data:", error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [channelId, currentUserId]);

  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    } else {
      return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <MessageCircle className="h-4 w-4 animate-pulse" />
      <span className="italic">{getTypingText()}</span>
      <div className="flex gap-1">
        <div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
        <div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.1s]" />
        <div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
      </div>
    </div>
  );
}

// Hook for sending typing events
export function useTypingIndicator(channelId: string, userId: string) {
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  const startTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingEvent(channelId, userId, true);
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      stopTyping();
    }, 3000);

    setTypingTimeout(timeout);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      sendTypingEvent(channelId, userId, false);
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      if (isTyping) {
        sendTypingEvent(channelId, userId, false);
      }
    };
  }, [channelId, userId, isTyping, typingTimeout]);

  return {
    startTyping,
    stopTyping,
    isTyping,
  };
}

// Function to send typing events to the server
async function sendTypingEvent(
  channelId: string,
  userId: string,
  isTyping: boolean,
) {
  try {
    await fetch(`/api/realtime/typing/${channelId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        isTyping,
      }),
    });
  } catch (error) {
    console.error("Error sending typing event:", error);
  }
}
