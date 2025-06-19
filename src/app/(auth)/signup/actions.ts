"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { createError, ErrorType } from "@/lib/errors";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signUp(
  credentials: SignUpValues,
): Promise<{ error: string; type?: ErrorType; field?: string }> {
  try {
    const { username, email, password } = signUpSchema.parse(credentials);

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const userId = generateIdFromEntropySize(10);

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (existingUsername) {
      return {
        error: "This username is already taken. Please choose a different one.",
        type: ErrorType.CONFLICT_ERROR,
        field: "username",
      };
    }

    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existingEmail) {
      return {
        error:
          "An account with this email already exists. Try signing in instead.",
        type: ErrorType.CONFLICT_ERROR,
        field: "email",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: username,
          email,
          passwordHash,
        },
      });
      await streamServerClient.upsertUser({
        id: userId,
        username,
        name: username,
      });
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);

    // Handle validation errors specifically
    if (error && typeof error === "object" && "issues" in error) {
      const zodError = error as any;
      const firstIssue = zodError.issues?.[0];
      return {
        error: firstIssue?.message || "Please check your input and try again.",
        type: ErrorType.VALIDATION_ERROR,
        field: firstIssue?.path?.join("."),
      };
    }

    // Handle Stream service errors
    if (error && typeof error === "object" && "message" in error) {
      const errorMessage = (error as any).message;
      if (errorMessage.includes("stream") || errorMessage.includes("chat")) {
        return {
          error: "Unable to set up your account. Please try again.",
          type: ErrorType.NETWORK_ERROR,
        };
      }
    }

    return {
      error: "Unable to create account at this time. Please try again later.",
      type: ErrorType.UNKNOWN_ERROR,
    };
  }
}
