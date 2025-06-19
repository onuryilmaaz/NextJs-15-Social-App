import { createError } from "@/lib/errors";

interface RateLimitOptions {
  window: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, you should use Redis or similar persistent store
const store = new Map<string, RateLimitStore>();

// Clean up expired entries every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (now > value.resetTime) {
        store.delete(key);
      }
    }
  },
  10 * 60 * 1000,
);

export function rateLimit({
  window,
  max,
  message = "Too many requests, please try again later",
  skipSuccessfulRequests = false,
  skipFailedRequests = false,
}: RateLimitOptions) {
  return {
    check: (identifier: string, response?: Response) => {
      const now = Date.now();
      const key = `rate_limit_${identifier}`;

      let limit = store.get(key);

      if (!limit || now > limit.resetTime) {
        limit = {
          count: 0,
          resetTime: now + window,
        };
        store.set(key, limit);
      }

      // Check if we should skip this request
      if (response) {
        const isSuccess = response.ok;
        if (
          (skipSuccessfulRequests && isSuccess) ||
          (skipFailedRequests && !isSuccess)
        ) {
          return {
            success: true,
            remaining: max - limit.count,
            reset: new Date(limit.resetTime),
            retryAfter: null,
          };
        }
      }

      if (limit.count >= max) {
        const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
        throw createError.rateLimit(
          `${message}. Try again in ${retryAfter} seconds.`,
        );
      }

      limit.count++;

      return {
        success: true,
        remaining: max - limit.count,
        reset: new Date(limit.resetTime),
        retryAfter: null,
      };
    },

    // Headers for rate limit info
    headers: (identifier: string) => {
      const limit = store.get(`rate_limit_${identifier}`);
      if (!limit) {
        return {
          "X-RateLimit-Limit": max.toString(),
          "X-RateLimit-Remaining": max.toString(),
          "X-RateLimit-Reset": new Date(Date.now() + window).toISOString(),
        };
      }

      return {
        "X-RateLimit-Limit": max.toString(),
        "X-RateLimit-Remaining": Math.max(0, max - limit.count).toString(),
        "X-RateLimit-Reset": new Date(limit.resetTime).toISOString(),
      };
    },
  };
}

// Common rate limit configurations
export const authLimiter = rateLimit({
  window: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: "Too many authentication attempts",
});

export const apiLimiter = rateLimit({
  window: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: "Too many API requests",
  skipSuccessfulRequests: false,
});

export const uploadLimiter = rateLimit({
  window: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: "Too many upload requests",
});

export const messageLimiter = rateLimit({
  window: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: "Too many messages sent",
});

export const postLimiter = rateLimit({
  window: 60 * 1000, // 1 minute
  max: 5, // 5 posts per minute
  message: "Too many posts created",
});

export const commentLimiter = rateLimit({
  window: 60 * 1000, // 1 minute
  max: 10, // 10 comments per minute
  message: "Too many comments posted",
});

export const searchLimiter = rateLimit({
  window: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: "Too many search requests",
});

// Helper to get client identifier for rate limiting
export function getClientIdentifier(request: Request): string {
  // Try to get user ID from headers (if authenticated)
  const userId = request.headers.get("x-user-id");
  if (userId) {
    return `user_${userId}`;
  }

  // Fallback to IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";

  return `ip_${ip}`;
}

// Middleware wrapper for API routes
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  limiter: ReturnType<typeof rateLimit>,
  options: { getUserId?: (req: Request) => Promise<string | null> } = {},
) {
  return async (req: Request): Promise<Response> => {
    let identifier = getClientIdentifier(req);

    // Try to get user-specific identifier if possible
    if (options.getUserId) {
      try {
        const userId = await options.getUserId(req);
        if (userId) {
          identifier = `user_${userId}`;
        }
      } catch {
        // Ignore errors, use IP-based identifier
      }
    }

    try {
      const result = limiter.check(identifier);
      const response = await handler(req);

      // Add rate limit headers
      const headers = limiter.headers(identifier);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      // Rate limit exceeded
      if (
        error &&
        typeof error === "object" &&
        "statusCode" in error &&
        error.statusCode === 429
      ) {
        const headers = limiter.headers(identifier);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        });
      }

      throw error;
    }
  };
}
