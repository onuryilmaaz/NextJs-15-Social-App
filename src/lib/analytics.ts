import { EngagementType } from "@prisma/client";
import prisma from "./prisma";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export interface UserAnalyticsData {
  profileViews: number;
  postsCreated: number;
  commentsCreated: number;
  likesReceived: number;
  likesGiven: number;
  followersGained: number;
  followingCount: number;
  totalEngagement: number;
  averagePostLikes: number;
  mostActiveHour?: number;
  growthRate: number;
  engagementRate: number;
}

export interface PostAnalyticsData {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  reachScore: number;
  performance: "low" | "average" | "high" | "viral";
}

export interface PlatformInsights {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalPosts: number;
  newPosts: number;
  totalEngagements: number;
  growthMetrics: {
    userGrowth: number;
    postGrowth: number;
    engagementGrowth: number;
  };
  topPerformers: {
    posts: Array<{ id: string; title: string; engagementRate: number }>;
    users: Array<{ id: string; username: string; engagement: number }>;
  };
  trends: Array<{ keyword: string; mentions: number; growth: number }>;
}

export interface EngagementInsights {
  timeline: Array<{
    date: string;
    likes: number;
    comments: number;
    follows: number;
    posts: number;
  }>;
  hourlyActivity: Array<{ hour: number; activity: number }>;
  contentPerformance: Array<{
    type: string;
    averageEngagement: number;
    totalContent: number;
  }>;
}

export class AnalyticsService {
  /**
   * Track an engagement event
   */
  static async trackEvent(
    userId: string,
    eventType: EngagementType,
    targetId: string,
    metadata?: Record<string, any>,
  ) {
    try {
      await prisma.engagementEvent.create({
        data: {
          userId,
          eventType,
          targetId,
          metadata: metadata || null,
        },
      });

      // Update relevant analytics
      await this.updateAnalytics(userId, eventType, targetId);
    } catch (error) {
      console.error("Error tracking engagement event:", error);
    }
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(userId: string): Promise<UserAnalyticsData> {
    const analytics = await prisma.userAnalytics.findUnique({
      where: { userId },
    });

    if (!analytics) {
      return this.initializeUserAnalytics(userId);
    }

    // Calculate growth rate (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const pastFollowerCount = await prisma.follow.count({
      where: {
        followingId: userId,
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    const currentFollowerCount = await prisma.follow.count({
      where: { followingId: userId },
    });

    const growthRate =
      pastFollowerCount > 0
        ? ((currentFollowerCount - pastFollowerCount) / pastFollowerCount) * 100
        : 0;

    // Calculate engagement rate
    const recentPosts = await prisma.post.count({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const engagementRate =
      recentPosts > 0 ? analytics.totalEngagement / recentPosts : 0;

    return {
      profileViews: analytics.profileViews,
      postsCreated: analytics.postsCreated,
      commentsCreated: analytics.commentsCreated,
      likesReceived: analytics.likesReceived,
      likesGiven: analytics.likesGiven,
      followersGained: analytics.followersGained,
      followingCount: analytics.followingCount,
      totalEngagement: analytics.totalEngagement,
      averagePostLikes: analytics.averagePostLikes,
      mostActiveHour: analytics.mostActiveHour,
      growthRate,
      engagementRate,
    };
  }

  /**
   * Get post analytics
   */
  static async getPostAnalytics(postId: string): Promise<PostAnalyticsData> {
    let analytics = await prisma.postAnalytics.findUnique({
      where: { postId },
    });

    if (!analytics) {
      analytics = await this.initializePostAnalytics(postId);
    }

    // Determine performance level
    const avgEngagement = await this.getAverageEngagementRate();
    let performance: "low" | "average" | "high" | "viral" = "average";

    if (analytics.engagementRate > avgEngagement * 3) {
      performance = "viral";
    } else if (analytics.engagementRate > avgEngagement * 1.5) {
      performance = "high";
    } else if (analytics.engagementRate < avgEngagement * 0.5) {
      performance = "low";
    }

    return {
      views: analytics.views,
      likes: analytics.likes,
      comments: analytics.comments,
      shares: analytics.shares,
      saves: analytics.saves,
      engagementRate: analytics.engagementRate,
      reachScore: analytics.reachScore,
      performance,
    };
  }

  /**
   * Get platform insights for admin dashboard
   */
  static async getPlatformInsights(days = 30): Promise<PlatformInsights> {
    const startDate = subDays(new Date(), days);
    const compareStartDate = subDays(startDate, days);

    // Current period stats
    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalPosts,
      newPosts,
      totalEngagements,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          sessions: {
            some: {
              expiresAt: { gt: new Date() },
            },
          },
        },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.post.count(),
      prisma.post.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.engagementEvent.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    // Previous period for comparison
    const [previousNewUsers, previousNewPosts, previousEngagements] =
      await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: compareStartDate,
              lt: startDate,
            },
          },
        }),
        prisma.post.count({
          where: {
            createdAt: {
              gte: compareStartDate,
              lt: startDate,
            },
          },
        }),
        prisma.engagementEvent.count({
          where: {
            createdAt: {
              gte: compareStartDate,
              lt: startDate,
            },
          },
        }),
      ]);

    // Calculate growth rates
    const userGrowth =
      previousNewUsers > 0
        ? ((newUsers - previousNewUsers) / previousNewUsers) * 100
        : 0;
    const postGrowth =
      previousNewPosts > 0
        ? ((newPosts - previousNewPosts) / previousNewPosts) * 100
        : 0;
    const engagementGrowth =
      previousEngagements > 0
        ? ((totalEngagements - previousEngagements) / previousEngagements) * 100
        : 0;

    // Top performing posts
    const topPosts = await prisma.post.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        analytics: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        analytics: {
          engagementRate: "desc",
        },
      },
      take: 5,
    });

    // Top performing users
    const topUsers = await prisma.user.findMany({
      include: {
        analytics: true,
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
      },
      orderBy: {
        analytics: {
          totalEngagement: "desc",
        },
      },
      take: 5,
    });

    // Trending topics
    const trends = await prisma.trendingTopic.findMany({
      where: { isActive: true },
      orderBy: { score: "desc" },
      take: 10,
    });

    return {
      totalUsers,
      activeUsers,
      newUsers,
      totalPosts,
      newPosts,
      totalEngagements,
      growthMetrics: {
        userGrowth,
        postGrowth,
        engagementGrowth,
      },
      topPerformers: {
        posts: topPosts.map((post) => ({
          id: post.id,
          title: post.content.substring(0, 100) + "...",
          engagementRate: post.analytics?.engagementRate || 0,
        })),
        users: topUsers.map((user) => ({
          id: user.id,
          username: user.username,
          engagement: user.analytics?.totalEngagement || 0,
        })),
      },
      trends: trends.map((trend) => ({
        keyword: trend.keyword,
        mentions: trend.mentions,
        growth: 0, // Could calculate based on historical data
      })),
    };
  }

  /**
   * Get engagement insights with timeline data
   */
  static async getEngagementInsights(
    userId?: string,
    days = 30,
  ): Promise<EngagementInsights> {
    const startDate = subDays(new Date(), days);

    // Build where clause based on userId
    const whereClause = userId ? { userId } : {};
    const postWhereClause = userId ? { userId } : {};

    // Timeline data (daily aggregations)
    const timelineData = await Promise.all(
      Array.from({ length: days }, (_, i) => {
        const date = subDays(new Date(), days - 1 - i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        return Promise.all([
          prisma.engagementEvent.count({
            where: {
              ...whereClause,
              eventType: "POST_LIKE",
              createdAt: { gte: dayStart, lte: dayEnd },
            },
          }),
          prisma.engagementEvent.count({
            where: {
              ...whereClause,
              eventType: "POST_COMMENT",
              createdAt: { gte: dayStart, lte: dayEnd },
            },
          }),
          prisma.engagementEvent.count({
            where: {
              ...whereClause,
              eventType: "USER_FOLLOW",
              createdAt: { gte: dayStart, lte: dayEnd },
            },
          }),
          prisma.post.count({
            where: {
              ...postWhereClause,
              createdAt: { gte: dayStart, lte: dayEnd },
            },
          }),
        ]).then(([likes, comments, follows, posts]) => ({
          date: format(date, "yyyy-MM-dd"),
          likes,
          comments,
          follows,
          posts,
        }));
      }),
    );

    // Hourly activity pattern
    const hourlyActivity = await Promise.all(
      Array.from({ length: 24 }, async (_, hour) => {
        const activity = await prisma.engagementEvent.count({
          where: {
            ...whereClause,
            createdAt: { gte: startDate },
            // Filter by hour using database function
          },
        });

        return { hour, activity };
      }),
    );

    // Content performance by type
    const contentTypes = ["text", "image", "video"]; // Could be expanded
    const contentPerformance = await Promise.all(
      contentTypes.map(async (type) => {
        const posts = await prisma.post.findMany({
          where: {
            ...postWhereClause,
            createdAt: { gte: startDate },
            // Could add content type filtering based on attachments
          },
          include: {
            analytics: true,
          },
        });

        const totalContent = posts.length;
        const averageEngagement =
          totalContent > 0
            ? posts.reduce(
                (sum, post) => sum + (post.analytics?.engagementRate || 0),
                0,
              ) / totalContent
            : 0;

        return {
          type,
          averageEngagement,
          totalContent,
        };
      }),
    );

    return {
      timeline: await Promise.all(timelineData),
      hourlyActivity,
      contentPerformance,
    };
  }

  /**
   * Update daily stats (for cron job)
   */
  static async updateDailyStats(date: Date = new Date()) {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      totalPosts,
      newPosts,
      totalComments,
      newComments,
      totalLikes,
      newLikes,
      totalEngagements,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          sessions: {
            some: {
              expiresAt: { gt: dayEnd },
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      prisma.post.count(),
      prisma.post.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      prisma.comment.count(),
      prisma.comment.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      prisma.like.count(),
      prisma.like.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      }),
      prisma.engagementEvent.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      }),
    ]);

    await prisma.dailyStats.upsert({
      where: { date: dayStart },
      update: {
        totalUsers,
        activeUsers,
        newUsers,
        totalPosts,
        newPosts,
        totalComments,
        newComments,
        totalLikes,
        newLikes,
        totalEngagements,
      },
      create: {
        date: dayStart,
        totalUsers,
        activeUsers,
        newUsers,
        totalPosts,
        newPosts,
        totalComments,
        newComments,
        totalLikes,
        newLikes,
        totalEngagements,
      },
    });
  }

  /**
   * Initialize user analytics
   */
  private static async initializeUserAnalytics(
    userId: string,
  ): Promise<UserAnalyticsData> {
    const initialData = {
      profileViews: 0,
      postsCreated: 0,
      commentsCreated: 0,
      likesReceived: 0,
      likesGiven: 0,
      followersGained: 0,
      followingCount: 0,
      totalEngagement: 0,
      averagePostLikes: 0,
      mostActiveHour: 0,
    };

    await prisma.userAnalytics.create({
      data: {
        userId,
        ...initialData,
      },
    });

    return {
      ...initialData,
      growthRate: 0,
      engagementRate: 0,
    };
  }

  /**
   * Initialize post analytics
   */
  private static async initializePostAnalytics(postId: string) {
    return prisma.postAnalytics.create({
      data: {
        postId,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        engagementRate: 0,
        reachScore: 0,
      },
    });
  }

  /**
   * Update analytics based on engagement events
   */
  private static async updateAnalytics(
    userId: string,
    eventType: EngagementType,
    targetId: string,
  ) {
    try {
      switch (eventType) {
        case "PROFILE_VIEW":
          await prisma.userAnalytics.upsert({
            where: { userId: targetId },
            update: { profileViews: { increment: 1 } },
            create: { userId: targetId, profileViews: 1 },
          });
          break;

        case "POST_VIEW":
          await prisma.postAnalytics.upsert({
            where: { postId: targetId },
            update: { views: { increment: 1 } },
            create: { postId: targetId, views: 1 },
          });
          break;

        case "POST_LIKE":
          // Update post analytics
          await prisma.postAnalytics.upsert({
            where: { postId: targetId },
            update: { likes: { increment: 1 } },
            create: { postId: targetId, likes: 1 },
          });

          // Update user analytics (post owner)
          const post = await prisma.post.findUnique({
            where: { id: targetId },
            select: { userId: true },
          });

          if (post) {
            await prisma.userAnalytics.upsert({
              where: { userId: post.userId },
              update: {
                likesReceived: { increment: 1 },
                totalEngagement: { increment: 1 },
              },
              create: {
                userId: post.userId,
                likesReceived: 1,
                totalEngagement: 1,
              },
            });
          }
          break;

        case "USER_FOLLOW":
          await prisma.userAnalytics.upsert({
            where: { userId: targetId },
            update: { followersGained: { increment: 1 } },
            create: { userId: targetId, followersGained: 1 },
          });
          break;
      }
    } catch (error) {
      console.error("Error updating analytics:", error);
    }
  }

  /**
   * Get average engagement rate across platform
   */
  private static async getAverageEngagementRate(): Promise<number> {
    const result = await prisma.postAnalytics.aggregate({
      _avg: { engagementRate: true },
    });

    return result._avg.engagementRate || 0;
  }

  /**
   * Track trending topics based on post content
   */
  static async updateTrendingTopics() {
    // This would analyze recent posts for trending keywords/hashtags
    // Implementation would involve text analysis of recent posts
    console.log("Updating trending topics...");
  }
}

// Export convenience functions
export const trackEvent = AnalyticsService.trackEvent.bind(AnalyticsService);
export const getUserAnalytics =
  AnalyticsService.getUserAnalytics.bind(AnalyticsService);
export const getPostAnalytics =
  AnalyticsService.getPostAnalytics.bind(AnalyticsService);
export const getPlatformInsights =
  AnalyticsService.getPlatformInsights.bind(AnalyticsService);
