import prisma from "./prisma";

/**
 * Extract hashtags from text content
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#[a-zA-Z0-9_]+/g;
  const matches = content.match(hashtagRegex) || [];

  // Normalize hashtags (remove # and convert to lowercase)
  return matches
    .map((hashtag) => hashtag.slice(1).toLowerCase())
    .filter((hashtag) => hashtag.length > 0);
}

/**
 * Update trending topics when hashtags are used in posts
 */
export async function updateTrendingTopics(hashtags: string[]): Promise<void> {
  if (hashtags.length === 0) return;

  try {
    // Use transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      for (const hashtag of hashtags) {
        // Try to find existing trending topic
        const existingTopic = await tx.trendingTopic.findUnique({
          where: { keyword: hashtag },
        });

        if (existingTopic) {
          // Update existing topic
          await tx.trendingTopic.update({
            where: { keyword: hashtag },
            data: {
              mentions: existingTopic.mentions + 1,
              lastSeenAt: new Date(),
              isActive: true,
              // Simple scoring algorithm: mentions * recency factor
              score: await calculateTrendingScore(
                existingTopic.mentions + 1,
                new Date(),
              ),
            },
          });
        } else {
          // Create new trending topic
          await tx.trendingTopic.create({
            data: {
              keyword: hashtag,
              mentions: 1,
              lastSeenAt: new Date(),
              isActive: true,
              score: await calculateTrendingScore(1, new Date()),
            },
          });
        }
      }
    });

    // Invalidate cache after updating trending topics
    if (typeof window === "undefined") {
      // Only on server side
      try {
        const baseUrl =
          process.env.NEXTAUTH_URL ||
          process.env.VERCEL_URL ||
          "http://localhost:3000";
        await fetch(`${baseUrl}/api/trending-topics/revalidate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(2000), // 2 second timeout
        });
      } catch (error) {
        console.warn("Failed to invalidate trending topics cache:", error);
        // Don't throw as this is not critical
      }
    }
  } catch (error) {
    console.error("Error updating trending topics:", error);
    // Don't throw error to avoid disrupting post creation
  }
}

/**
 * Calculate trending score based on mentions and recency
 */
async function calculateTrendingScore(
  mentions: number,
  lastSeenAt: Date,
): Promise<number> {
  const now = new Date();
  const hoursSinceLastSeen =
    (now.getTime() - lastSeenAt.getTime()) / (1000 * 60 * 60);

  // Recency factor: newer hashtags get higher scores
  const recencyFactor = Math.max(0.1, 1 / (1 + hoursSinceLastSeen * 0.1));

  // Trending score: mentions weighted by recency
  return mentions * recencyFactor;
}

/**
 * Get current trending topics
 */
export async function getTrendingTopicsFromDB(
  limit = 5,
): Promise<Array<{ keyword: string; mentions: number; score: number }>> {
  try {
    const topics = await prisma.trendingTopic.findMany({
      where: {
        isActive: true,
        // Only include topics from the last 7 days
        lastSeenAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: [
        { score: "desc" },
        { mentions: "desc" },
        { lastSeenAt: "desc" },
      ],
      take: limit,
      select: {
        keyword: true,
        mentions: true,
        score: true,
      },
    });

    return topics;
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return [];
  }
}

/**
 * Clean up old trending topics (run this periodically)
 */
export async function cleanupOldTrendingTopics(): Promise<void> {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Mark old topics as inactive instead of deleting them
    await prisma.trendingTopic.updateMany({
      where: {
        lastSeenAt: {
          lt: oneWeekAgo,
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    console.log("Cleaned up old trending topics");
  } catch (error) {
    console.error("Error cleaning up trending topics:", error);
  }
}

/**
 * Recalculate all trending scores (run this periodically)
 */
export async function recalculateTrendingScores(): Promise<void> {
  try {
    const activeTopics = await prisma.trendingTopic.findMany({
      where: { isActive: true },
    });

    await prisma.$transaction(async (tx) => {
      for (const topic of activeTopics) {
        const newScore = await calculateTrendingScore(
          topic.mentions,
          topic.lastSeenAt,
        );
        await tx.trendingTopic.update({
          where: { id: topic.id },
          data: { score: newScore },
        });
      }
    });

    console.log("Recalculated trending scores");
  } catch (error) {
    console.error("Error recalculating trending scores:", error);
  }
}
