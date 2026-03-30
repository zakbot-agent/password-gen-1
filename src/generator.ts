import * as crypto from "crypto";

/** Character sets used for password generation */
const CHARSETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}|;:,.<>?/~`",
} as const;

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const DEFAULT_OPTIONS: GeneratorOptions = {
  length: 16,
  uppercase: true,
  numbers: true,
  symbols: true,
};

/**
 * Generate a cryptographically secure random integer in [0, max).
 * Uses rejection sampling to avoid modulo bias.
 */
function secureRandomInt(max: number): number {
  if (max <= 0) throw new Error("max must be positive");
  const byteCount = Math.ceil(Math.log2(max) / 8) || 1;
  const maxValid = Math.floor(256 ** byteCount / max) * max;
  let value: number;
  do {
    const buf = crypto.randomBytes(byteCount);
    value = 0;
    for (let i = 0; i < byteCount; i++) {
      value = value * 256 + buf[i];
    }
  } while (value >= maxValid);
  return value % max;
}

/** Pick a random character from a string */
function randomChar(charset: string): string {
  return charset[secureRandomInt(charset.length)];
}

/** Fisher-Yates shuffle using crypto random */
function secureShuffle(arr: string[]): string[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Build the combined charset from options */
function buildCharset(opts: GeneratorOptions): string {
  let charset = CHARSETS.lowercase;
  if (opts.uppercase) charset += CHARSETS.uppercase;
  if (opts.numbers) charset += CHARSETS.numbers;
  if (opts.symbols) charset += CHARSETS.symbols;
  return charset;
}

/**
 * Generate a single password with the given options.
 * Guarantees at least one character from each enabled set.
 */
export function generatePassword(partial?: Partial<GeneratorOptions>): string {
  const opts: GeneratorOptions = { ...DEFAULT_OPTIONS, ...partial };

  if (opts.length < 4) opts.length = 4;

  // Guarantee at least one char from each enabled set
  const guaranteed: string[] = [randomChar(CHARSETS.lowercase)];
  if (opts.uppercase) guaranteed.push(randomChar(CHARSETS.uppercase));
  if (opts.numbers) guaranteed.push(randomChar(CHARSETS.numbers));
  if (opts.symbols) guaranteed.push(randomChar(CHARSETS.symbols));

  const charset = buildCharset(opts);
  const remaining = opts.length - guaranteed.length;
  const chars = [...guaranteed];

  for (let i = 0; i < remaining; i++) {
    chars.push(randomChar(charset));
  }

  return secureShuffle(chars).join("");
}

/**
 * Generate a numeric PIN of the specified length.
 */
export function generatePin(length: number): string {
  const digits: string[] = [];
  for (let i = 0; i < length; i++) {
    digits.push(randomChar(CHARSETS.numbers));
  }
  return digits.join("");
}

/**
 * Generate multiple passwords.
 */
export function generateMany(count: number, partial?: Partial<GeneratorOptions>): string[] {
  return Array.from({ length: count }, () => generatePassword(partial));
}
