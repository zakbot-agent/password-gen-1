import * as crypto from "crypto";
import { WORD_LIST } from "./wordlist";

/**
 * Secure random int in [0, max) — same algo as generator.ts but kept local
 * to avoid circular deps and keep modules independent.
 */
function secureRandomInt(max: number): number {
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

/**
 * Generate a passphrase of N random words separated by dashes.
 */
export function generatePassphrase(wordCount: number = 4): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(WORD_LIST[secureRandomInt(WORD_LIST.length)]);
  }
  return words.join("-");
}
