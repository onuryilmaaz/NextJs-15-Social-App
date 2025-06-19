import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://echoverse.app";

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];

  try {
    // Get active users for user profile pages
    const users = await prisma.user.findMany({
      select: {
        username: true,
        updatedAt: true,
      },
      where: {
        // Only include users who have posted in the last 6 months
        posts: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 1000, // Limit to avoid huge sitemaps
    });

    const userPages = users.map((user) => ({
      url: `${baseUrl}/users/${user.username}`,
      lastModified: user.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    // Get popular hashtags
    const popularHashtags = await prisma.trendingTopic.findMany({
      select: {
        hashtag: true,
        updatedAt: true,
      },
      orderBy: {
        score: "desc",
      },
      take: 100, // Top 100 trending hashtags
    });

    const hashtagPages = popularHashtags.map((tag) => ({
      url: `${baseUrl}/hashtag/${tag.hashtag}`,
      lastModified: tag.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.5,
    }));

    // Get recent public posts
    const recentPosts = await prisma.post.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500, // Most recent 500 posts
    });

    const postPages = recentPosts.map((post) => ({
      url: `${baseUrl}/posts/${post.id}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));

    return [...staticPages, ...userPages, ...hashtagPages, ...postPages];
  } catch (error) {
    console.error("Error generating sitemap:", error);

    // Return at least static pages if database query fails
    return staticPages;
  }
}
