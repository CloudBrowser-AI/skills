#!/usr/bin/env node
/**
 * Convert a CloudBrowser websocket address to the direct Remote Desktop URL.
 *
 * Example:
 *   node scripts/ws_to_remote_desktop_url.mjs --ws "ws://browser.cloudbrowser.ai/128/devtools/browser/<id>"
 *   -> https://app.cloudbrowser.ai/remote-desktop/128/0
 */

import { URL } from "node:url";

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
  console.error("Usage: node scripts/ws_to_remote_desktop_url.mjs --ws <ws_address>");
  process.exit(code);
}

function wsToRemoteDesktopUrl(wsAddr) {
  const u = new URL(wsAddr);
  // Expected: /<num>/devtools/browser/<id>
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 1) return null;
  const num = parts[0];
  if (!/^\d+$/.test(num)) return null;
  return `https://app.cloudbrowser.ai/remote-desktop/${num}/0`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ws = args.ws;
  if (!ws) usageAndExit(2);

  let out;
  try {
    out = wsToRemoteDesktopUrl(ws);
  } catch {
    out = null;
  }

  if (!out) {
    console.error("Could not parse remote desktop URL from --ws. Expected ws://browser.cloudbrowser.ai/<num>/devtools/browser/<id>");
    process.exit(2);
  }

  process.stdout.write(out + "\n");
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});

