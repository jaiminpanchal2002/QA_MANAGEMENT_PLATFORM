import next from "eslint-config-next";

/**
 * ESLint flat config (Next 16 removed `next lint`; we run the ESLint CLI).
 * `eslint-config-next` ships a native flat-config array (core-web-vitals +
 * typescript); we spread it and layer the project's rule overrides on top.
 */
const config = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "src/db/migrations/**",
      "playwright-report/**",
      "coverage/**",
      "test-results/**",
    ],
  },
  ...next,
  {
    // Core-rule overrides only (no plugin needed here). The @typescript-eslint
    // rules come from eslint-config-next's bundled flat config above.
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];

export default config;
