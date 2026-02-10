#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function usage(exitCode) {
  // Intentionally do not echo the password back to stdout/stderr.
  console.error(
    "Usage: node scripts/store_remote_desktop_password.mjs --password \"<password>\" [--out \"<path>\"]",
  );
  process.exit(exitCode);
}

const args = process.argv.slice(2);
let password = null;
let outPath = null;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--password") {
    password = args[++i] ?? null;
    continue;
  }
  if (a === "--out") {
    outPath = args[++i] ?? null;
    continue;
  }
  if (a === "-h" || a === "--help") usage(0);
  // Unknown arg
  usage(2);
}

if (!password) usage(2);

if (!outPath) {
  outPath = path.join(os.tmpdir(), "cloudbrowser-remote-desktop-password.txt");
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${password}\n`, { encoding: "utf8", mode: 0o600 });

// Print only the location, never the secret.
process.stdout.write(`${outPath}\n`);

