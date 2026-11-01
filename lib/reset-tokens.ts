/**
 * Singleton In-Memory Password Reset Code Store.
 * Bound to globalThis to ensure cross-module persistence across Next.js App Router chunk boundaries.
 */

interface ResetEntry {
  code: string;
  expiresAt: number;
}

const globalForReset = globalThis as unknown as {
  passwordResetCodes?: Map<string, ResetEntry>;
};

export const passwordResetCodes =
  globalForReset.passwordResetCodes || new Map<string, ResetEntry>();

if (process.env.NODE_ENV !== "production") {
  globalForReset.passwordResetCodes = passwordResetCodes;
}

