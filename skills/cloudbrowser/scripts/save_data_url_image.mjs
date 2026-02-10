#!/usr/bin/env node
/**
 * Save a data URL image (e.g. "data:image/jpeg;base64,...") to a file.
 *
 * Default behavior (no args):
 * - Read stdin (either the data URL OR JSON that contains a screenshot data URL)
 * - Write to Desktop/CloudBrowser Screenshots/
 * - Print the saved path to stdout
 *
 * Examples:
 *   # Save a raw data URL from stdin
 *   echo "data:image/jpeg;base64,..." | node scripts/save_data_url_image.mjs
 *
 *   # Save JSON-RPC output from scripts/mcp_http_call.mjs (extracts jsonrpc.result.screenshot)
 *   node scripts/mcp_http_call.mjs --token <uuid> --tool take_screenshot --args '{"sessionId":"s","type":"jpeg"}' --save-screenshot
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
    "  node scripts/save_data_url_image.mjs [--out <file_or_dir>]",
    "",
    "Reads stdin and writes an image file.",
    "Stdin can be:",
    "  - a data URL: data:image/jpeg;base64,...",
    "  - JSON containing a screenshot data URL (tries common paths like jsonrpc.result.screenshot).",
    "",
    "Options:",
    "  --out    Output file path or directory. Default: Desktop/CloudBrowser Screenshots/",
  ].join("\n");
  console.error(msg);
  process.exit(code);
}

function guessDesktopDir() {
  // "Desktop" isn't guaranteed to exist on all systems, but it's the best default.
  if (process.platform === "win32") {
    const home = process.env.USERPROFILE || os.homedir();
    // Many Windows setups redirect Desktop into OneDrive.
    const oneDrive =
      process.env.OneDrive || process.env.OneDriveConsumer || process.env.OneDriveCommercial || null;
    if (oneDrive) {
      const odDesktop = path.join(oneDrive, "Desktop");
      if (fs.existsSync(odDesktop)) return odDesktop;
    }
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

function pickScreenshotDataUrlFromJson(obj) {
  const candidates = [];

  // Most common output from scripts/mcp_http_call.mjs
  candidates.push(obj?.jsonrpc?.result?.screenshot);
  candidates.push(obj?.jsonrpc?.result?.screenshotDataUrl);
  candidates.push(obj?.jsonrpc?.result?.content?.[0]?.image_url?.url);
  candidates.push(obj?.jsonrpc?.result?.content?.[0]?.imageUrl?.url);
  candidates.push(obj?.result?.screenshot);
  candidates.push(obj?.result?.screenshotDataUrl);
  candidates.push(obj?.result?.content?.[0]?.image_url?.url);
  candidates.push(obj?.result?.content?.[0]?.imageUrl?.url);
  candidates.push(obj?.screenshot);
  candidates.push(obj?.screenshotDataUrl);

  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("data:image/")) return c;
  }

  // Arrays: search shallowly
  if (Array.isArray(obj)) {
    for (const it of obj) {
      const v = pickScreenshotDataUrlFromJson(it);
      if (v) return v;
    }
  }

  return null;
}

function parseDataUrl(dataUrl) {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  return { mime: m[1].toLowerCase(), b64: normalizeBase64(m[2]) };
}

function extForMime(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

function normalizeBase64(b64) {
  // Copy/paste often introduces quotes/backticks/commas/braces. Node's base64 decoder is permissive
  // and can silently produce corrupted output; sanitize + pad.
  let s = String(b64).trim();
  if (
    (s.startsWith("\"") && s.endsWith("\"")) ||
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith("`") && s.endsWith("`"))
  ) {
    s = s.slice(1, -1);
  }
  s = s.replace(/\s+/g, "");
  // Convert base64url -> base64 if needed.
  if (s.includes("-") || s.includes("_")) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
  }
  // Drop any remaining non-base64 chars (e.g. trailing `",` or `}`).
  s = s.replace(/[^A-Za-z0-9+/=]/g, "");
  const mod = s.length % 4;
  if (mod === 2) s += "==";
  else if (mod === 3) s += "=";
  return s;
}

function sniffImageMime(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

function looksTruncated(mime, buf) {
  if (mime === "image/jpeg") {
    return !(buf.length >= 2 && buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9);
  }
  if (mime === "image/png") {
    // Quick check for IEND marker near end. Not exhaustive.
    const tail = buf.slice(Math.max(0, buf.length - 64));
    return !tail.includes(Buffer.from("IEND"));
  }
  return false;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) usageAndExit(0);

  const input = (await readStdin()).trim();
  if (!input) {
    console.error("No input on stdin.");
    usageAndExit(2);
  }

  let dataUrl = null;
  if (input.startsWith("{") || input.startsWith("[")) {
    try {
      const obj = JSON.parse(input);
      dataUrl = pickScreenshotDataUrlFromJson(obj);
    } catch {
      // fall through to treat as raw string
    }
  }
  if (!dataUrl) dataUrl = input;

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    console.error("Input is not a valid image data URL (expected data:image/...;base64,...).");
    process.exit(2);
  }

  const buf = Buffer.from(parsed.b64, "base64");
  if (!buf.length) {
    console.error("Decoded image buffer is empty.");
    process.exit(2);
  }

  // Prefer actual bytes over declared mime (mislabels happen, and users sometimes force --out ...jpg).
  const sniffedMime = sniffImageMime(buf) || parsed.mime;
  const ext = extForMime(sniffedMime);

  const desktop = guessDesktopDir();
  const defaultDir = path.join(desktop, "CloudBrowser Screenshots");

  let outPath = null;
  if (typeof args.out === "string" && args.out.length > 0) {
    const p = path.resolve(args.out);
    const looksLikeDir = p.endsWith(path.sep) || (fs.existsSync(p) && fs.statSync(p).isDirectory());
    if (looksLikeDir) {
      ensureDir(p);
      outPath = path.join(p, `cloudbrowser_screenshot_${timestamp()}.${ext}`);
    } else {
      ensureDir(path.dirname(p));
      // If user provided an explicit extension that doesn't match the decoded bytes, adjust it.
      const providedExt = path.extname(p).toLowerCase();
      const normalizedProvided = providedExt === ".jpeg" ? ".jpg" : providedExt;
      const targetExt = "." + ext;
      outPath = normalizedProvided && normalizedProvided !== targetExt ? p.slice(0, -providedExt.length) + targetExt : p;
      if (normalizedProvided && normalizedProvided !== targetExt) {
        console.error(
          `Note: output extension ${normalizedProvided} did not match detected type (${sniffedMime}); saved as ${path.basename(outPath)}`
        );
      }
    }
  } else {
    ensureDir(defaultDir);
    outPath = path.join(defaultDir, `cloudbrowser_screenshot_${timestamp()}.${ext}`);
  }

  fs.writeFileSync(outPath, buf);
  if (looksTruncated(sniffedMime, buf)) {
    console.error("Warning: image bytes look truncated. If you copy/pasted the data URL, it may have been cut off.");
  }
  process.stdout.write(outPath + "\n");
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
