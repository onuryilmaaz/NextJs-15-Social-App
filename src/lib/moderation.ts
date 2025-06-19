import {
  ContentType,
  ModerationLevel,
  NotificationType,
  ReportStatus,
  ReportType,
  User,
} from "@prisma/client";
import prisma from "./prisma";
import { NotificationService } from "./notifications";
import { createNotification } from "./notifications";

// Profanity and inappropriate content keywords
const INAPPROPRIATE_WORDS = [
  // Add your profanity filter words here
  "spam",
  "scam",
  "fake",
  "bot",
  "hate",
  "harassment",
];

const PROFANITY_KEYWORDS = new Set([
  "küfür1",
  "küfür2",
  "argo1", // Daha fazla kelime eklenebilir
]);

const HATE_SPEECH_PATTERNS = [
  /\b(hate|kill|die|stupid|idiot)\s+(you|them|him|her)\b/i,
  /\b(go\s+die|kill\s+yourself)\b/i,
  /ırkçı ifade/i,
  /ayrımcı söylem/i,
];

const SPAM_PATTERNS = [
  /(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.){1,}[a-zA-Z]{2,}(\/[^\s]*)?/gi, // URL'ler
  /(\d{1,4}[-.\s]?){7,}/, // Telefon numaraları
  /BUY NOW|FREE MONEY|CLICK HERE/i, // Klasik spam ifadeleri
];

export interface ModerationResult {
  isViolation: boolean;
  severity: ModerationLevel;
  reasons: string[];
  matchedKeywords: string[];
}

export interface ReportData {
  type: ReportType;
  reason: string;
  description?: string;
  reporterId: string;
  reportedId?: string;
  postId?: string;
  commentId?: string;
}

export class ModerationService {
  /**
   * Automatically moderate content using basic rules
   */
  static analyzeContent(content: string): ModerationResult {
    const result: ModerationResult = {
      isViolation: false,
      severity: ModerationLevel.LOW,
      reasons: [],
      matchedKeywords: [],
    };

    const lowerCaseContent = content.toLowerCase();

    // 1. Profanity Check
    const words = lowerCaseContent.split(/\s+/);
    const profanityFound = words.filter((word) => PROFANITY_KEYWORDS.has(word));
    if (profanityFound.length > 0) {
      result.isViolation = true;
      result.severity = ModerationLevel.MEDIUM;
      result.reasons.push("Profanity Detected");
      result.matchedKeywords.push(...profanityFound);
    }

    // 2. Spam Check
    const spamMatches = SPAM_PATTERNS.flatMap(
      (pattern) => content.match(pattern) || [],
    );
    if (spamMatches.length > 2) {
      // Allow up to 2 links/matches
      result.isViolation = true;
      result.severity = ModerationLevel.HIGH;
      result.reasons.push("Potential Spam Detected");
      result.matchedKeywords.push(...spamMatches);
    }

    // 3. Hate Speech Check
    const hateSpeechMatches = HATE_SPEECH_PATTERNS.flatMap(
      (p) => content.match(p) || [],
    );
    if (hateSpeechMatches.length > 0) {
      result.isViolation = true;
      result.severity = ModerationLevel.CRITICAL;
      result.reasons.push("Hate Speech Detected");
      result.matchedKeywords.push(...hateSpeechMatches);
    }

    if (
      result.isViolation &&
      result.severity === ModerationLevel.LOW &&
      profanityFound.length < 3
    ) {
      result.severity = ModerationLevel.LOW;
    } else if (
      result.isViolation &&
      result.severity === ModerationLevel.MEDIUM &&
      profanityFound.length > 5
    ) {
      result.severity = ModerationLevel.HIGH;
    }

    return result;
  }

  /**
   * Create a moderation record for content
   */
  static async flagContent(
    contentType: ContentType,
    contentId: string,
    content: string,
    author: User,
  ) {
    const analysis = this.analyzeContent(content);

    if (!analysis.isViolation) {
      return;
    }

    const flag = await prisma.contentModeration.create({
      data: {
        contentType,
        contentId,
        flaggedReason: analysis.reasons.join(", "),
        severity: analysis.severity,
        autoModerated: true,
        reviewed: false,
        notes: `Matched keywords: ${analysis.matchedKeywords.join(", ")}`,
      },
    });

    if (analysis.severity === ModerationLevel.CRITICAL) {
      await this.suspendUser(
        author.id,
        1,
        "Automatic suspension for critical violation.",
      );
      await NotificationService.create({
        type: NotificationType.MODERATION_ACTION,
        recipientId: author.id,
        issuerId: "system",
        message:
          "Your account has been temporarily suspended due to a critical violation of our community guidelines.",
      });
    } else {
      await NotificationService.create({
        type: NotificationType.CONTENT_FLAGGED,
        recipientId: author.id,
        issuerId: "system",
        postId: contentType === "POST" ? contentId : undefined,
        commentId: contentType === "COMMENT" ? contentId : undefined,
        message:
          "Your content was automatically flagged for review. Please adhere to community guidelines.",
      });
    }

    return flag;
  }

  /**
   * Submit a report
   */
  static async submitReport(data: ReportData) {
    try {
      // Check if user already reported this content
      const existingReport = await prisma.report.findFirst({
        where: {
          reporterId: data.reporterId,
          ...(data.postId && { postId: data.postId }),
          ...(data.commentId && { commentId: data.commentId }),
          ...(data.reportedId && { reportedId: data.reportedId }),
        },
      });

      if (existingReport) {
        throw new Error("You have already reported this content");
      }

      const report = await prisma.report.create({
        data: {
          type: data.type,
          reason: data.reason,
          description: data.description,
          reporterId: data.reporterId,
          reportedId: data.reportedId,
          postId: data.postId,
          commentId: data.commentId,
          status: ReportStatus.PENDING,
        },
      });

      // Auto-escalate certain report types
      if (
        [
          ReportType.HATE_SPEECH,
          ReportType.VIOLENCE,
          ReportType.SELF_HARM,
        ].includes(data.type)
      ) {
        await this.escalateReport(report.id);
      }

      return report;
    } catch (error) {
      console.error("Error submitting report:", error);
      throw error;
    }
  }

  /**
   * Block a user
   */
  static async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new Error("Cannot block yourself");
    }

    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (existingBlock) {
      throw new Error("User is already blocked");
    }

    const block = await prisma.block.create({
      data: {
        blockerId,
        blockedId,
      },
    });

    // Also unfollow each other
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    });

    return block;
  }

  /**
   * Unblock a user
   */
  static async unblockUser(blockerId: string, blockedId: string) {
    return prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });
  }

  /**
   * Check if user is blocked
   */
  static async isUserBlocked(
    blockerId: string,
    blockedId: string,
  ): Promise<boolean> {
    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return !!block;
  }

  /**
   * Get blocked users for a user
   */
  static async getBlockedUsers(userId: string) {
    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return blocks.map((block) => block.blocked);
  }

  /**
   * Escalate a report for manual review
   */
  static async escalateReport(reportId: string) {
    return prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.UNDER_REVIEW },
    });
  }

  /**
   * Resolve a report (moderator action)
   */
  static async resolveReport(
    reportId: string,
    moderatorId: string,
    approved: boolean,
    notes?: string,
  ) {
    const report = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: approved ? ReportStatus.RESOLVED : ReportStatus.DISMISSED,
        moderatorId,
        resolvedAt: new Date(),
      },
      include: {
        reporter: true,
        reported: true,
        post: true,
        comment: true,
      },
    });

    // If report is approved, take action
    if (approved) {
      await this.takeActionOnReport(report);
    }

    // Notify reporter of resolution
    if (report.reporter) {
      await createNotification({
        type: NotificationType.FOLLOW, // We'll extend this for moderation notifications
        recipientId: report.reporterId,
        issuerId: moderatorId,
      });
    }

    return report;
  }

  /**
   * Take action based on approved report
   */
  private static async takeActionOnReport(report: any) {
    switch (report.type) {
      case ReportType.SPAM:
      case ReportType.INAPPROPRIATE_CONTENT:
        // Delete content or suspend user temporarily
        if (report.postId) {
          await prisma.post.delete({ where: { id: report.postId } });
        }
        if (report.commentId) {
          await prisma.comment.delete({ where: { id: report.commentId } });
        }
        break;

      case ReportType.HATE_SPEECH:
      case ReportType.HARASSMENT:
        // Suspend user
        if (report.reportedId) {
          await this.suspendUser(report.reportedId, 7); // 7 days
        }
        break;

      case ReportType.VIOLENCE:
      case ReportType.SELF_HARM:
        // Permanent ban
        if (report.reportedId) {
          await this.banUser(report.reportedId);
        }
        break;
    }
  }

  /**
   * Suspend a user for a specified number of days
   */
  static async suspendUser(userId: string, days: number) {
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + days);

    return prisma.user.update({
      where: { id: userId },
      data: { suspendedUntil },
    });
  }

  /**
   * Ban a user permanently
   */
  static async banUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });
  }

  /**
   * Get user's moderation status
   */
  static async getUserModerationStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isBlocked: true,
        suspendedUntil: true,
        isModerator: true,
      },
    });

    if (!user) return null;

    const now = new Date();
    const isSuspended = user.suspendedUntil && user.suspendedUntil > now;

    return {
      isBlocked: user.isBlocked,
      isSuspended,
      suspendedUntil: user.suspendedUntil,
      isModerator: user.isModerator,
    };
  }

  /**
   * Check if user can perform action (not blocked/suspended)
   */
  static async canUserPerformAction(userId: string): Promise<boolean> {
    const status = await this.getUserModerationStatus(userId);
    if (!status) return false;

    return !status.isBlocked && !status.isSuspended;
  }

  /**
   * Get reports for moderation dashboard
   */
  static async getReportsForModeration(
    status?: ReportStatus,
    limit = 20,
    offset = 0,
  ) {
    return prisma.report.findMany({
      where: status ? { status } : undefined,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reported: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  static async getAutoModeratedContent(limit = 50, offset = 0) {
    return prisma.contentModeration.findMany({
      where: {
        autoModerated: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  static async takeActionOnReportedContent(
    reportId: string,
    action: "delete" | "suspend" | "ban",
    notes?: string,
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    if (action === "delete") {
      if (report.postId) {
        await prisma.post.delete({ where: { id: report.postId } });
      }
      if (report.commentId) {
        await prisma.comment.delete({ where: { id: report.commentId } });
      }
    } else if (report.reportedId) {
      if (action === "suspend") {
        await this.suspendUser(report.reportedId, 7, notes);
      } else if (action === "ban") {
        await this.banUser(report.reportedId, notes);
      }
    }
  }
}

// Export convenience functions
export const analyzeContent =
  ModerationService.analyzeContent.bind(ModerationService);
export const submitReport =
  ModerationService.submitReport.bind(ModerationService);
export const blockUser = ModerationService.blockUser.bind(ModerationService);
export const unblockUser =
  ModerationService.unblockUser.bind(ModerationService);
export const isUserBlocked =
  ModerationService.isUserBlocked.bind(ModerationService);
export const canUserPerformAction =
  ModerationService.canUserPerformAction.bind(ModerationService);
export const getReportsForModeration =
  ModerationService.getReportsForModeration.bind(ModerationService);
export const getAutoModeratedContent =
  ModerationService.getAutoModeratedContent.bind(ModerationService);
