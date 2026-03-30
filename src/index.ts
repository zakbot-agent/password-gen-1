#!/usr/bin/env node

import { generatePassword, generatePin, generateMany } from "./generator";
import { generatePassphrase } from "./passphrase";
import { checkStrength } from "./strength";
import { formatPassword, formatStrength, formatPassphrase, formatPin, printHeader } from "./formatter";
import { startServer } from "./server";
import { execSync } from "child_process";

/** Minimal arg parser — zero deps */
function parseArgs(argv: string[]): Map<string, string | boolean> {
  const args = new Map<string, string | boolean>();
  const raw = argv.slice(2);

  for (let i = 0; i < raw.length; i++) {
    const arg = raw[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = raw[i + 1];
      if (next && !next.startsWith("--")) {
        args.set(key, next);
        i++;
      } else {
        args.set(key, true);
      }
    }
  }
  return args;
}

function showHelp(): void {
  console.log(`
\x1b[1mpassword-gen\x1b[0m — Secure password generator

\x1b[36mUsage:\x1b[0m
  password-gen                        Generate 1 strong password (16 chars)
  password-gen --length 32            Custom length
  password-gen --count 5              Generate 5 passwords
  password-gen --no-symbols           Exclude symbols
  password-gen --no-numbers           Exclude numbers
  password-gen --no-uppercase         Only lowercase + enabled types
  password-gen --only-alpha           Only letters (a-z, A-Z)
  password-gen --passphrase           Generate passphrase (4 words)
  password-gen --passphrase --words 6 6-word passphrase
  password-gen --pin 6                Generate numeric PIN
  password-gen --strength "pass"      Check password strength
  password-gen --copy                 Copy result to clipboard
  password-gen --serve                Start web UI (port 3462)
  password-gen --help                 Show this help
`);
}

function copyToClipboard(text: string): boolean {
  try {
    execSync(`echo -n ${JSON.stringify(text)} | xclip -selection clipboard 2>/dev/null || echo -n ${JSON.stringify(text)} | xsel --clipboard 2>/dev/null || echo -n ${JSON.stringify(text)} | pbcopy 2>/dev/null`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function main(): void {
  const args = parseArgs(process.argv);

  if (args.has("help")) {
    showHelp();
    return;
  }

  if (args.has("serve")) {
    const port = typeof args.get("serve") === "string" ? parseInt(args.get("serve") as string, 10) : 3462;
    startServer(port);
    return;
  }

  printHeader();

  // Strength check mode
  if (args.has("strength")) {
    const password = args.get("strength") as string;
    if (!password || password === true as unknown) {
      console.error("Usage: password-gen --strength \"YourPassword\"");
      process.exit(1);
    }
    const result = checkStrength(password);
    console.log(formatStrength(result, password));
    return;
  }

  let output = "";

  // PIN mode
  if (args.has("pin")) {
    const len = parseInt(args.get("pin") as string, 10) || 6;
    const pin = generatePin(len);
    output = pin;
    console.log(formatPin(pin));
    maybeCopy(args, output);
    return;
  }

  // Passphrase mode
  if (args.has("passphrase")) {
    const wordCount = args.has("words") ? parseInt(args.get("words") as string, 10) : 4;
    const passphrase = generatePassphrase(wordCount);
    output = passphrase;
    console.log(formatPassphrase(passphrase));

    // Show strength
    const result = checkStrength(passphrase);
    console.log(formatStrength(result, passphrase));
    maybeCopy(args, output);
    return;
  }

  // Password mode
  const opts = {
    length: args.has("length") ? parseInt(args.get("length") as string, 10) : 16,
    uppercase: !args.has("no-uppercase") && !args.has("only-alpha") ? true : !args.has("no-uppercase"),
    numbers: !args.has("no-numbers") && !args.has("only-alpha"),
    symbols: !args.has("no-symbols") && !args.has("only-alpha"),
  };

  // Fix: only-alpha should keep uppercase
  if (args.has("only-alpha")) {
    opts.uppercase = true;
    opts.numbers = false;
    opts.symbols = false;
  }

  const count = args.has("count") ? parseInt(args.get("count") as string, 10) : 1;

  if (count === 1) {
    const pw = generatePassword(opts);
    output = pw;
    console.log(formatPassword(pw));
    const result = checkStrength(pw);
    console.log(formatStrength(result, pw));
  } else {
    const passwords = generateMany(count, opts);
    output = passwords.join("\n");
    passwords.forEach((pw, i) => {
      console.log(formatPassword(pw, i));
    });
    console.log();
  }

  maybeCopy(args, output);
}

function maybeCopy(args: Map<string, string | boolean>, text: string): void {
  if (args.has("copy")) {
    if (copyToClipboard(text)) {
      console.log(`\n\x1b[32m✓\x1b[0m Copied to clipboard`);
    } else {
      console.log(`\n\x1b[33m!\x1b[0m Clipboard not available (install xclip or xsel)`);
    }
  }
}

main();
