#!/usr/bin/env node
/**
 * Minimal JSON-RPC client for CloudBrowser MCP HTTP endpoints.
 *
 * Examples:
 *   node scripts/mcp_http_call.mjs --token <uuid> --method tools/list
 *   node scripts/mcp_http_call.mjs --token <uuid> --tool open_browser --args '{"headless":true,"keepOpen":300}'
 *   node scripts/mcp_http_call.mjs --token <uuid> --tool take_screenshot --args '{"sessionId":"s","type":"jpeg"}' --save-screenshot
 *   node scripts/mcp_http_call.mjs --endpoint http://localhost:3000/ --token <uuid> --tool tools/list
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

function usageAndExit(code) {
  const msg = [
    "Usage:",
    "  node scripts/mcp_http_call.mjs --token <uuid> [--endpoint <url>] --method tools/list",
    "  node scripts/mcp_http_call.mjs --token <uuid> [--endpoint <url>] --tool <tool_name> [--args <json>]",
    "  node scripts/mcp_http_call.mjs --token <uuid> [--endpoint <url>] --tool take_screenshot --args <json> --save-screenshot [--out <file_or_dir>]",
    "",
    "Options:",
    "  --endpoint   Default: https://mcp.cloudbrowser.ai",
    "  --token      CloudBrowser API token (UUID). Sent as Authorization: Bearer <token>",
    "  --method     JSON-RPC method (default: tools/list). Use tools/list, tools/call, initialize, ...",
    "  --tool       Convenience: call tools/call with params.name=<tool>",
    "  --args       JSON object for params.arguments (default: {})",
    "  --id         JSON-RPC id (default: 1)",
    "  --save-screenshot  If the response includes result.screenshot as a data URL, save it to Desktop by default.",
    "  --out        Output file path or directory (used with --save-screenshot).",
  ].join("\n");
  console.error(msg);
  process.exit(code);
}

function guessDesktopDir() {
  if (process.platform === "win32") {
    const home = process.env.USERPROFILE || os.homedir();
    return path.join(home, "Desktop");
  }
  return path.join(os.homedir(), "Desktop");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function timestamp() {
  const d = new Date();
  return [
    d.getFullYear(),
    pad2(d.getMonth() + 1),
    pad2(d.getDate()),
    "_",
    pad2(d.getHours()),
    pad2(d.getMinutes()),
    pad2(d.getSeconds()),
  ].join("");
}

function parseDataUrl(dataUrl) {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i.exec(String(dataUrl).trim());
  if (!m) return null;
  return { mime: m[1].toLowerCase(), b64: m[2].replace(/\s+/g, "") };
}

function extForMime(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

function saveScreenshotDataUrl({ dataUrl, out }) {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;

  const buf = Buffer.from(parsed.b64, "base64");
  if (!buf.length) throw new Error("Decoded screenshot buffer is empty.");

  const ext = extForMime(parsed.mime);
  const desktop = guessDesktopDir();
  const defaultDir = path.join(desktop, "CloudBrowser Screenshots");

  let outPath;
  if (typeof out === "string" && out.length > 0) {
    const p = path.resolve(out);
    const looksLikeDir = p.endsWith(path.sep) || (fs.existsSync(p) && fs.statSync(p).isDirectory());
    if (looksLikeDir) {
      ensureDir(p);
      outPath = path.join(p, `cloudbrowser_screenshot_${timestamp()}.${ext}`);
    } else {
      ensureDir(path.dirname(p));
      outPath = p;
    }
  } else {
    ensureDir(defaultDir);
    outPath = path.join(defaultDir, `cloudbrowser_screenshot_${timestamp()}.${ext}`);
  }

  fs.writeFileSync(outPath, buf);
  return outPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const endpoint = args.endpoint || "https://mcp.cloudbrowser.ai";
  const token = args.token;
  const id = args.id ? Number(args.id) : 1;

  if (!token) usageAndExit(2);

  const method = args.tool ? "tools/call" : (args.method || "tools/list");
  let params = {};

  if (args.tool) {
    let toolArgs = {};
    if (args.args) {
      try {
        toolArgs = JSON.parse(args.args);
      } catch (e) {
        console.error("Invalid JSON passed to --args");
        process.exit(2);
      }
    }
    params = { name: args.tool, arguments: toolArgs };
  } else if (args.params) {
    try {
      params = JSON.parse(args.params);
    } catch (e) {
      console.error("Invalid JSON passed to --params");
      process.exit(2);
    }
  }

  const payload = { jsonrpc: "2.0", id, method, params };
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { _raw: text };
  }

  const out = {
    http: { ok: res.ok, status: res.status, statusText: res.statusText },
    jsonrpc: body,
  };

  if (args["save-screenshot"]) {
    const dataUrl = body?.result?.screenshot || body?.result?.screenshotDataUrl;
    if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/")) {
      const savedTo = saveScreenshotDataUrl({ dataUrl, out: args.out });
      out.saved = { screenshot: savedTo };
    } else {
      out.saved = { screenshot: null, note: "No result.screenshot data URL found in response." };
    }
  }

  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
