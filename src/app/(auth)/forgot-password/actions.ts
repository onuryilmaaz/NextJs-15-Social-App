"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { createError, ErrorType } from "@/lib/errors";
import { randomBytes } from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export async function forgotPassword(
  values: ForgotPasswordValues,
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { email } = forgotPasswordSchema.parse(values);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    // Even if user doesn't exist, we return success
    if (!user) {
      return { success: true };
    }

    // Generate password reset token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store the reset token in database
    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: {
        token,
        expiresAt,
      },
      create: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // In production, send email here
    // For now, we'll just log it (remove in production)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `Password reset link for ${email}: /reset-password?token=${token}`,
      );
    }

    // TODO: Send password reset email
    // await sendPasswordResetEmail(email, token);

    return { success: true };
  } catch (error) {
    console.error("Forgot password error:", error);

    if (error && typeof error === "object" && "issues" in error) {
      return {
        error: "Please enter a valid email address",
      };
    }

    return {
      error: "Unable to process request at this time. Please try again later.",
    };
  }
}
