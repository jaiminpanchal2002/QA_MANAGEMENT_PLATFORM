"use client";
import { createAuthClient } from "better-auth/react";
import { publicEnv } from "@/lib/env";

/**
 * Client-side Better Auth helpers (sign in/up/out, session hooks).
 * Only public config is used here — no secrets reach the client bundle.
 */
export const authClient = createAuthClient({
  baseURL: publicEnv.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
