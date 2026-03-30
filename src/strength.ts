/**
 * Password strength checker.
 * Evaluates: length, character variety, common patterns, entropy.
 */

/** Common weak passwords / patterns */
const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "qwerty", "abc123", "letmein",
  "admin", "welcome", "monkey", "master", "dragon", "login",
  "princess", "football", "shadow", "sunshine", "trustno1",
  "iloveyou", "batman", "access", "hello", "charlie",
]);

const KEYBOARD_PATTERNS = [
  "qwerty", "asdfgh", "zxcvbn", "qazwsx", "123456", "654321",
  "abcdef", "fedcba",
];

export type StrengthLevel = "weak" | "medium" | "strong" | "very strong";

export interface StrengthResult {
  score: number;         // 0-100
  level: StrengthLevel;
  entropy: number;       // bits
  feedback: string[];
}

/** Calculate Shannon entropy in bits */
function calcEntropy(password: string): number {
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;
  if (poolSize === 0) return 0;
  return password.length * Math.log2(poolSize);
}

/** Check for repeated characters (e.g. "aaa") */
function hasRepeats(password: string): boolean {
  return /(.)\1{2,}/.test(password);
}

/** Check for sequential chars */
function hasSequential(password: string): boolean {
  const lower = password.toLowerCase();
  for (const pattern of KEYBOARD_PATTERNS) {
    if (lower.includes(pattern)) return true;
  }
  // Check ascending/descending sequences of 4+
  for (let i = 0; i <= lower.length - 4; i++) {
    const c0 = lower.charCodeAt(i);
    if (
      lower.charCodeAt(i + 1) === c0 + 1 &&
      lower.charCodeAt(i + 2) === c0 + 2 &&
      lower.charCodeAt(i + 3) === c0 + 3
    ) return true;
  }
  return false;
}

/**
 * Evaluate password strength. Returns score 0-100, level, entropy, and feedback.
 */
export function checkStrength(password: string): StrengthResult {
  const feedback: string[] = [];
  let score = 0;

  // --- Length scoring (0-30) ---
  if (password.length >= 16) score += 30;
  else if (password.length >= 12) score += 22;
  else if (password.length >= 8) score += 14;
  else if (password.length >= 6) score += 8;
  else { score += 2; feedback.push("Too short (min 8 recommended)"); }

  // --- Character variety (0-30) ---
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  score += variety * 7.5;
  if (variety < 3) feedback.push("Add more character types (uppercase, numbers, symbols)");

  // --- Entropy scoring (0-20) ---
  const entropy = calcEntropy(password);
  if (entropy >= 80) score += 20;
  else if (entropy >= 60) score += 15;
  else if (entropy >= 40) score += 10;
  else if (entropy >= 25) score += 5;
  else { score += 1; feedback.push("Low entropy — password is too predictable"); }

  // --- Penalties ---
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    score = Math.min(score, 5);
    feedback.push("This is a commonly used password");
  }

  if (hasRepeats(password)) {
    score -= 10;
    feedback.push("Avoid repeated characters (e.g. aaa)");
  }

  if (hasSequential(password)) {
    score -= 10;
    feedback.push("Avoid sequential patterns (e.g. abc, 123)");
  }

  // Only digits
  if (/^\d+$/.test(password)) {
    score -= 15;
    feedback.push("Numeric-only passwords are weak");
  }

  // Only lowercase
  if (/^[a-z]+$/.test(password)) {
    score -= 10;
    feedback.push("Lowercase-only passwords are weak");
  }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (feedback.length === 0) feedback.push("Excellent password!");

  // Level
  let level: StrengthLevel;
  if (score >= 80) level = "very strong";
  else if (score >= 60) level = "strong";
  else if (score >= 35) level = "medium";
  else level = "weak";

  return { score, level, entropy: Math.round(entropy * 10) / 10, feedback };
}
