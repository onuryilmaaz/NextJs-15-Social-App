import { unstable_cache } from "next/cache";
import prisma from "./prisma";

// Cache configuration
const CACHE_TAGS = {
  users: "users",
  posts: "posts",
  notifications: "notifications",
  analytics: "analytics",
  trends: "trends",
} as const;

const CACHE_TIMES = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 900, // 15 minutes
  extraLong: 3600, // 1 hour
} as const;

// User-related caches
export const getCachedUserData = unstable_cache(
  async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });
  },
  ["user-data"],
  {
    revalidate: CACHE_TIMES.medium,
    tags: [CACHE_TAGS.users],
  },
);

export const getCachedUserStats = unstable_cache(
  async (userId: string) => {
    const [postsCount, followersCount, followingCount] = await Promise.all([
      prisma.post.count({ where: { userId } }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      postsCount,
      followersCount,
      followingCount,
    };
  },
  ["user-stats"],
  {
    revalidate: CACHE_TIMES.medium,
    tags: [CACHE_TAGS.users],
  },
);

// Post-related caches
export const getCachedPostEngagement = unstable_cache(
  async (postId: string) => {
    const [likesCount, commentsCount, bookmarksCount] = await Promise.all([
      prisma.like.count({ where: { postId } }),
      prisma.comment.count({ where: { postId } }),
      prisma.bookmark.count({ where: { postId } }),
    ]);

    return {
      likesCount,
      commentsCount,
      bookmarksCount,
    };
  },
  ["post-engagement"],
  {
    revalidate: CACHE_TIMES.short,
    tags: [CACHE_TAGS.posts],
  },
);

// Notification caches
export const getCachedUnreadCount = unstable_cache(
  async (userId: string) => {
    return prisma.notification.count({
      where: {
        recipientId: userId,
        read: false,
      },
    });
  },
  ["unread-notifications"],
  {
    revalidate: CACHE_TIMES.short,
    tags: [CACHE_TAGS.notifications],
  },
);

// Trending topics cache
export const getCachedTrendingTopics = unstable_cache(
  async (limit = 5) => {
    const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
      SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count
      FROM posts
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY hashtag
      ORDER BY count DESC, hashtag ASC
      LIMIT ${limit}
    `;

    return result.map((row) => ({
      hashtag: row.hashtag,
      count: Number(row.count),
    }));
  },
  ["trending-topics"],
  {
    revalidate: CACHE_TIMES.long,
    tags: [CACHE_TAGS.trends],
  },
);

// Analytics caches
export const getCachedDailyStats = unstable_cache(
  async (days = 7) => {
    return prisma.dailyStats.findMany({
      orderBy: { date: "desc" },
      take: days,
    });
  },
  ["daily-stats"],
  {
    revalidate: CACHE_TIMES.extraLong,
    tags: [CACHE_TAGS.analytics],
  },
);

export const getCachedPlatformMetrics = unstable_cache(
  async () => {
    const [totalUsers, totalPosts, totalComments, activeUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.comment.count(),
        prisma.user.count({
          where: {
            sessions: {
              some: {
                expiresAt: { gt: new Date() },
              },
            },
          },
        }),
      ]);

    return {
      totalUsers,
      totalPosts,
      totalComments,
      activeUsers,
    };
  },
  ["platform-metrics"],
  {
    revalidate: CACHE_TIMES.long,
    tags: [CACHE_TAGS.analytics],
  },
);

// Search-related caches
export const getCachedSearchSuggestions = unstable_cache(
  async (query: string, limit = 10) => {
    if (!query.trim() || query.length < 2) return [];

    return prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            displayName: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
      take: limit,
    });
  },
  ["search-suggestions"],
  {
    revalidate: CACHE_TIMES.medium,
    tags: [CACHE_TAGS.users],
  },
);

// Cache invalidation helpers
export const invalidateUserCache = (userId: string) => {
  // This would need to be implemented with a proper cache invalidation system
  // For now, we rely on Next.js revalidation
};

export const invalidatePostCache = (postId: string) => {
  // Similar to user cache invalidation
};

// Performance monitoring cache
export const getCachedPerformanceMetrics = unstable_cache(
  async () => {
    const startTime = Date.now();

    // Test basic queries
    const testQueries = await Promise.all([
      prisma.user.findFirst(),
      prisma.post.findFirst(),
      prisma.notification.findFirst(),
    ]);

    const queryTime = Date.now() - startTime;

    return {
      queryTime,
      dbConnected: testQueries.every((q) => q !== null),
      timestamp: new Date(),
    };
  },
  ["performance-metrics"],
  {
    revalidate: CACHE_TIMES.short,
  },
);
