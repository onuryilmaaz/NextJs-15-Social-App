"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { trackProfileView } from "@/lib/client-analytics";
import { useEffect } from "react";

interface ProfileViewTrackerProps {
  profileUserId: string;
}

export default function ProfileViewTracker({
  profileUserId,
}: ProfileViewTrackerProps) {
  const { user } = useSession();

  useEffect(() => {
    // Only track if viewing someone else's profile
    if (user.id !== profileUserId) {
      trackProfileView(profileUserId, { viewedBy: user.id });
    }
  }, [user.id, profileUserId]);

  return null; // This component doesn't render anything
}
