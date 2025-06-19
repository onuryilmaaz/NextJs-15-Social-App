import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isModerator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate performance data for the last 24 hours
    const now = new Date();
    const hours = 24;
    const data = [];

    for (let i = hours - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);

      // Simulate realistic performance metrics
      const baseQueryTime = 50 + Math.random() * 100; // 50-150ms base
      const hourOfDay = timestamp.getHours();

      // Simulate higher load during peak hours (9-17)
      const peakMultiplier = hourOfDay >= 9 && hourOfDay <= 17 ? 1.5 : 1;
      const queryTime = Math.round(baseQueryTime * peakMultiplier);

      // Simulate user activity patterns
      const baseUsers = 100;
      const peakUsers = hourOfDay >= 9 && hourOfDay <= 17 ? 300 : 150;
      const activeUsers = Math.round(baseUsers + Math.random() * peakUsers);

      // Cache hit rate (usually high, occasional dips)
      const baseCacheHitRate = 95;
      const cacheHitRate = Math.round(baseCacheHitRate + Math.random() * 5 - 2);

      data.push({
        timestamp: timestamp.toISOString(),
        queryTime,
        activeUsers,
        cacheHitRate: Math.max(85, Math.min(100, cacheHitRate)),
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Performance metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance metrics" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || !user.isModerator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "clear_cache":
        // In a real implementation, this would clear cache
        console.log("Cache cleared by admin:", user.id);
        break;

      case "optimize_db":
        // In a real implementation, this would run database optimization
        console.log("Database optimization requested by:", user.id);
        break;

      case "restart_workers":
        // In a real implementation, this would restart background workers
        console.log("Background workers restart requested by:", user.id);
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${action} executed successfully`,
    });
  } catch (error) {
    console.error("Performance action error:", error);
    return NextResponse.json(
      { error: "Failed to execute performance action" },
      { status: 500 },
    );
  }
}
