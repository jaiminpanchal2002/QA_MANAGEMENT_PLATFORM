// Preloaded via `node --import ./scripts/load-env.mjs` so environment variables
// are populated BEFORE any application module (which may read env at import
// time) is evaluated. Loads .env.local first, then .env as a fallback.
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });
