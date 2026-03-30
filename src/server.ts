import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { generatePassword, generatePin, GeneratorOptions } from "./generator";
import { generatePassphrase } from "./passphrase";
import { checkStrength } from "./strength";

/**
 * Start the web UI server on the given port.
 */
export function startServer(port: number = 3462): void {
  const server = http.createServer((req, res) => {
    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      serveHTML(res);
    } else if (req.method === "POST" && req.url === "/api/generate") {
      handleGenerate(req, res);
    } else if (req.method === "POST" && req.url === "/api/strength") {
      handleStrength(req, res);
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  server.listen(port, () => {
    console.log(`\x1b[32m✓\x1b[0m Web UI running at \x1b[1mhttp://localhost:${port}\x1b[0m`);
    console.log(`\x1b[90m  Press Ctrl+C to stop\x1b[0m\n`);
  });
}

function serveHTML(res: http.ServerResponse): void {
  // Try multiple paths: dist/../public, src/../public, cwd/public
  const candidates = [
    path.join(__dirname, "..", "public", "index.html"),
    path.join(process.cwd(), "public", "index.html"),
  ];

  for (const htmlPath of candidates) {
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, "utf-8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }
  }

  res.writeHead(500, { "Content-Type": "text/plain" });
  res.end("index.html not found");
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function jsonResponse(res: http.ServerResponse, data: unknown): void {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}

async function handleGenerate(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  try {
    const body = JSON.parse(await readBody(req));
    const mode: string = body.mode || "password";

    if (mode === "passphrase") {
      const passphrase = generatePassphrase(body.words || 4);
      const strength = checkStrength(passphrase);
      jsonResponse(res, { password: passphrase, strength });
      return;
    }

    if (mode === "pin") {
      const pin = generatePin(body.length || 6);
      const strength = checkStrength(pin);
      jsonResponse(res, { password: pin, strength });
      return;
    }

    // Default: password
    const opts: Partial<GeneratorOptions> = {
      length: body.length || 16,
      uppercase: body.uppercase !== false,
      numbers: body.numbers !== false,
      symbols: body.symbols !== false,
    };
    const password = generatePassword(opts);
    const strength = checkStrength(password);
    jsonResponse(res, { password, strength });
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid request" }));
  }
}

async function handleStrength(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  try {
    const body = JSON.parse(await readBody(req));
    const result = checkStrength(body.password || "");
    jsonResponse(res, result);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid request" }));
  }
}
