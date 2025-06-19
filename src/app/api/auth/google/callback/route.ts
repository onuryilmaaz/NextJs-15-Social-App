import { google, lucia } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = cookies().get("google_oauth_state")?.value ?? null;
  const codeVerifier = cookies().get("google_code_verifier")?.value ?? null;

  if (
    !code ||
    !state ||
    !storedState ||
    state !== storedState ||
    !codeVerifier
  ) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      },
    );
    const googleUser = await response.json();

    const existingUser = await prisma.user.findUnique({
      where: {
        googleId: googleUser.sub,
      },
    });

    if (existingUser) {
      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    // Check if user exists with the same email
    const existingEmailUser = await prisma.user.findUnique({
      where: {
        email: googleUser.email,
      },
    });

    if (existingEmailUser) {
      // Link Google account to existing user
      await prisma.user.update({
        where: {
          id: existingEmailUser.id,
        },
        data: {
          googleId: googleUser.sub,
        },
      });

      const session = await lucia.createSession(existingEmailUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    // Create new user
    const userId = generateIdFromEntropySize(10);
    const username = await generateUniqueUsername(
      googleUser.given_name || googleUser.name.split(" ")[0] || "user",
    );

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: googleUser.name,
          email: googleUser.email,
          googleId: googleUser.sub,
          avatarUrl: googleUser.picture,
        },
      });
      await streamServerClient.upsertUser({
        id: userId,
        username,
        name: googleUser.name,
      });
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (e) {
    console.error(e);
    if (e instanceof OAuth2RequestError) {
      return new Response(null, {
        status: 400,
      });
    }
    return new Response(null, {
      status: 500,
    });
  }
}

async function generateUniqueUsername(baseName: string): Promise<string> {
  const cleanBaseName = baseName.toLowerCase().replace(/[^a-z0-9]/g, "");
  let username = cleanBaseName;
  let counter = 1;

  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      return username;
    }

    username = `${cleanBaseName}${counter}`;
    counter++;
  }
}
