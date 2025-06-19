"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { loginSchema, LoginValues } from "@/lib/validation";
import { createError, ErrorType } from "@/lib/errors";
import { verify } from "@node-rs/argon2";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(
  credentials: LoginValues,
): Promise<{ error: string; type?: ErrorType }> {
  try {
    const { username, password } = loginSchema.parse(credentials);

    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (!existingUser || !existingUser.passwordHash) {
      return {
        error:
          "Invalid username or password. Please check your credentials and try again.",
        type: ErrorType.AUTHENTICATION_ERROR,
      };
    }

    const validPassword = await verify(existingUser.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      return {
        error:
          "Invalid username or password. Please check your credentials and try again.",
        type: ErrorType.AUTHENTICATION_ERROR,
      };
    }

    const session = await lucia.createSession(existingUser.id, {});
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
      return {
        error: "Please check your input and try again.",
        type: ErrorType.VALIDATION_ERROR,
      };
    }

    return {
      error: "Unable to sign in at this time. Please try again later.",
      type: ErrorType.UNKNOWN_ERROR,
    };
  }
}
