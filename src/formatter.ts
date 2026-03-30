import { StrengthResult, StrengthLevel } from "./strength";

/** ANSI color codes */
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  brightGreen: "\x1b[92m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
} as const;

/** Map strength level to color */
function strengthColor(level: StrengthLevel): string {
  switch (level) {
    case "weak": return C.red;
    case "medium": return C.yellow;
    case "strong": return C.green;
    case "very strong": return C.brightGreen;
  }
}

/** Format a generated password for terminal output */
export function formatPassword(password: string, index?: number): string {
  const prefix = index !== undefined ? `${C.gray}[${index + 1}]${C.reset} ` : "";
  return `${prefix}${C.bold}${C.white}${password}${C.reset}`;
}

/** Format strength result for terminal output */
export function formatStrength(result: StrengthResult, password: string): string {
  const color = strengthColor(result.level);
  const bar = buildBar(result.score);
  const lines = [
    ``,
    `${C.gray}Password:${C.reset}  ${C.bold}${password}${C.reset}`,
    `${C.gray}Score:${C.reset}     ${color}${C.bold}${result.score}/100${C.reset} ${color}(${result.level})${C.reset}`,
    `${C.gray}Entropy:${C.reset}   ${result.entropy} bits`,
    `${C.gray}Strength:${C.reset}  ${bar}`,
    ``,
  ];

  if (result.feedback.length > 0) {
    lines.push(`${C.gray}Feedback:${C.reset}`);
    for (const f of result.feedback) {
      lines.push(`  ${C.cyan}-${C.reset} ${f}`);
    }
  }

  return lines.join("\n");
}

/** Build a visual strength bar */
function buildBar(score: number): string {
  const width = 30;
  const filled = Math.round((score / 100) * width);
  let color: string;
  if (score >= 80) color = C.brightGreen;
  else if (score >= 60) color = C.green;
  else if (score >= 35) color = C.yellow;
  else color = C.red;

  const bar = color + "█".repeat(filled) + C.gray + "░".repeat(width - filled) + C.reset;
  return `[${bar}]`;
}

/** Format a passphrase for terminal output */
export function formatPassphrase(passphrase: string): string {
  return `${C.bold}${C.cyan}${passphrase}${C.reset}`;
}

/** Format a PIN for terminal output */
export function formatPin(pin: string): string {
  return `${C.bold}${C.yellow}${pin}${C.reset}`;
}

/** Print header */
export function printHeader(): void {
  console.log(`${C.cyan}${C.bold}password-gen${C.reset} ${C.gray}v1.0.0${C.reset}`);
  console.log();
}
