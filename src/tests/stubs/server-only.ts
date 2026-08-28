// Vitest stub for the `server-only` package. In the real app this module
// throws if imported into a client bundle; under test we neutralize it so
// server modules (db, repositories) can be exercised directly in Node.
export {};
