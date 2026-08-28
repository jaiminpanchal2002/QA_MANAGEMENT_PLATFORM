import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/auth";

/**
 * Better Auth catch-all handler. Serves sign-in/up/out, session, email
 * verification and password reset endpoints under /api/auth/*.
 */
export const { GET, POST } = toNextJsHandler(auth);
