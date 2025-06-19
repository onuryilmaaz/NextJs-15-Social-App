import { EngagementType } from "@prisma/client";
import kyInstance from "./ky";

/**
 * Client-side analytics tracking functions
 * These functions send tracking events to the server via API routes
 */

export interface TrackEventParams {
  eventType: EngagementType;
  targetId: string;
  metadata?: Record<string, any>;
}

// Rate limiting for analytics requests
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // Max 60 analytics requests per minute
const requestTracker = new Map<string, number[]>();

function isRateLimited(): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean old requests
  const currentRequests = requestTracker.get("analytics") || [];
  const validRequests = currentRequests.filter(
    (timestamp) => timestamp > windowStart,
  );

  requestTracker.set("analytics", validRequests);

  return validRequests.length >= MAX_REQUESTS_PER_WINDOW;
}

function recordRequest(): void {
  const now = Date.now();
  const currentRequests = requestTracker.get("analytics") || [];
  currentRequests.push(now);
  requestTracker.set("analytics", currentRequests);
}

/**
 * Track an engagement event on the client-side
 * This is the main function for tracking events from client components
 */
export async function trackEvent(
  eventType: EngagementType,
  targetId: string,
  metadata?: Record<string, any>,
): Promise<void> {
  try {
    // Temporarily disable analytics in development to prevent errors
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Analytics] Would track: ${eventType} for ${targetId}`,
        metadata,
      );
      return;
    }

    // Check rate limit
    if (isRateLimited()) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Analytics rate limit exceeded, skipping event");
      }
      return;
    }

    recordRequest();

    // Don't block the UI for analytics
    await kyInstance.post("/api/analytics/track", {
      json: {
        eventType,
        targetId,
        metadata,
      },
      timeout: 10000, // Increased to 10 seconds
      retry: {
        limit: 2,
        methods: ["post"],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
      },
    });
  } catch (error) {
    // Silently fail for analytics - don't disrupt user experience
    if (process.env.NODE_ENV === "development") {
      console.warn("Analytics tracking failed:", error);
    }
    // Don't throw - analytics failures should never break the UI
  }
}

/**
 * Track post view event
 */
export async function trackPostView(
  postId: string,
  metadata?: Record<string, any>,
): Promise<void> {
  return trackEvent("POST_VIEW", postId, metadata);
}

/**
 * Track profile view event
 */
export async function trackProfileView(
  userId: string,
  metadata?: Record<string, any>,
): Promise<void> {
  return trackEvent("PROFILE_VIEW", userId, metadata);
}

/**
 * Track search query event
 */
export async function trackSearchQuery(
  query: string,
  metadata?: Record<string, any>,
): Promise<void> {
  return trackEvent("SEARCH_QUERY", query, metadata);
}

/**
 * Track login event
 */
export async function trackLogin(
  metadata?: Record<string, any>,
): Promise<void> {
  return trackEvent("LOGIN", "system", metadata);
}

/**
 * Track logout event
 */
export async function trackLogout(
  metadata?: Record<string, any>,
): Promise<void> {
  return trackEvent("LOGOUT", "system", metadata);
}

/**
 * Debounced tracking for frequent events
 */
const trackingQueue = new Map<
  string,
  { timer: NodeJS.Timeout; params: TrackEventParams }
>();

export function trackEventDebounced(
  eventType: EngagementType,
  targetId: string,
  metadata?: Record<string, any>,
  debounceMs = 1000,
): void {
  const key = `${eventType}-${targetId}`;

  // Clear existing timer for this event
  const existing = trackingQueue.get(key);
  if (existing) {
    clearTimeout(existing.timer);
  }

  // Set new timer
  const timer = setTimeout(async () => {
    await trackEvent(eventType, targetId, metadata);
    trackingQueue.delete(key);
  }, debounceMs);

  trackingQueue.set(key, { timer, params: { eventType, targetId, metadata } });
}

/**
 * Batch tracking for multiple events
 */
let batchQueue: TrackEventParams[] = [];
let batchTimer: NodeJS.Timeout | null = null;
const BATCH_SIZE = 10;
const BATCH_TIMEOUT = 5000; // 5 seconds

export async function trackEventBatched(
  eventType: EngagementType,
  targetId: string,
  metadata?: Record<string, any>,
): Promise<void> {
  // Add to batch queue
  batchQueue.push({ eventType, targetId, metadata });

  // Process immediately if batch is full
  if (batchQueue.length >= BATCH_SIZE) {
    await processBatch();
    return;
  }

  // Set timer for batch processing if not already set
  if (!batchTimer) {
    batchTimer = setTimeout(processBatch, BATCH_TIMEOUT);
  }
}

async function processBatch(): Promise<void> {
  if (batchQueue.length === 0) return;

  const events = [...batchQueue];
  batchQueue = [];

  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  // Process events one by one with small delay to avoid overwhelming the server
  for (const event of events) {
    await trackEvent(event.eventType, event.targetId, event.metadata);
    // Small delay between events
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
