"use client";
import { createAuthClient } from "better-auth/react";
import { publicEnv } from "@/lib/env";

/**
 * Client-side Better Auth helpers (sign in/up/out, session hooks).
 * Only public config is used here — no secrets reach the client bundle.
 */
export const authClient = createAuthClient({
  // Always talk to the same origin the app is served from — robust across
  // preview, production and custom domains (the build-inlined env can differ).
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : publicEnv.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
