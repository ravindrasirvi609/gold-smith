/**
 * Password strength policy.
 *
 * Rules (all must be satisfied):
 *  - Minimum 12 characters
 *  - Contains at least one lowercase letter
 *  - Contains at least one uppercase letter
 *  - Contains at least one digit
 *  - Contains at least one special character
 *  - Not one of the well-known-weak passwords
 */

const COMMON_WEAK = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "qwerty12345",
  "welcome123",
  "admin@123",
  "changeme123",
  "goldsmith123",
  "letmein123",
]);

export type PasswordCheckResult = {
  ok: boolean;
  errors: string[];
};

export function checkPasswordStrength(password: string): PasswordCheckResult {
  const errors: string[] = [];

  if (!password || password.length < 12) {
    errors.push("Password must be at least 12 characters long.");
  }
  if (password.length > 128) {
    errors.push("Password must not exceed 128 characters.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one digit.");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }
  if (COMMON_WEAK.has(password.toLowerCase())) {
    errors.push("This password is too common. Choose something less predictable.");
  }

  return { ok: errors.length === 0, errors };
}

export function assertPasswordStrength(password: string): void {
  const result = checkPasswordStrength(password);
  if (!result.ok) {
    throw new Error(result.errors.join(" "));
  }
}
