#!/usr/bin/env node
/**
 * @cloudbrowser/skills
 *
 * Wrapper around the upstream `skills` CLI that defaults to installing from:
 *   CloudBrowser-AI/skills
 *
 * Usage:
 *   npx @cloudbrowser/skills
 *   npx @cloudbrowser/skills --global --skill cloudbrowser -y
 *   npx @cloudbrowser/skills add --list
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const DEFAULT_REPO = "CloudBrowser-AI/skills";

function resolveSkillsCli() {
  const pkgPath = require.resolve("skills/package.json");
  const pkgDir = path.dirname(pkgPath);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  let binRel = null;
  if (typeof pkg.bin === "string") {
    binRel = pkg.bin;
  } else if (pkg.bin && typeof pkg.bin === "object") {
    binRel = pkg.bin.skills || Object.values(pkg.bin)[0];
  }

  if (!binRel) throw new Error("Could not resolve skills CLI bin from dependency.");
  return path.join(pkgDir, binRel);
}

function main() {
  const args = process.argv.slice(2);

  const first = args[0];
  const isFlagOnly = !first || String(first).startsWith("-");

  // If the user isn't explicitly running a top-level command, default to:
  //   skills add CloudBrowser-AI/skills <args>
  const passthroughCommands = new Set(["remove", "list", "ls", "find", "init", "check", "update"]);

  let finalArgs;
  if (isFlagOnly) {
    finalArgs = ["add", DEFAULT_REPO, ...args];
  } else if (first === "add") {
    const repo = args[1];
    if (repo && !String(repo).startsWith("-")) {
      finalArgs = args; // user provided repo
    } else {
      finalArgs = ["add", DEFAULT_REPO, ...args.slice(1)];
    }
  } else if (passthroughCommands.has(first)) {
    finalArgs = args;
  } else {
    // Treat unknown command as "add" options to keep `npx @cloudbrowser/skills --list` style working.
    finalArgs = ["add", DEFAULT_REPO, ...args];
  }

  const cliPath = resolveSkillsCli();
  const child = spawn(process.execPath, [cliPath, ...finalArgs], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

main();

