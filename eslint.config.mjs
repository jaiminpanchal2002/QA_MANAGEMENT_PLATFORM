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
      // React Compiler advisory that fires on react-hook-form (it returns
      // functions the compiler won't memoize). RHF is used intentionally and
      // works correctly, so this is noise — silence it.
      "react-hooks/incompatible-library": "off",
    },
  },
];

export default config;
