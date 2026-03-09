#!/usr/bin/env node
/**
 * Ensure the `skills` executable resolves to this wrapper package, not the
 * upstream `skills` dependency (both declare the same bin name).
 */

const fs = require("node:fs");
const path = require("node:path");

function writeFileIfPossible(filePath, contents) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, contents, "utf8");
    return true;
  } catch {
    return false;
  }
}

function chmodIfPossible(filePath, mode) {
  try {
    fs.chmodSync(filePath, mode);
  } catch {
    // ignore
  }
}

function main() {
  const pkgRoot = path.resolve(__dirname, "..");
  const scopeDir = path.dirname(pkgRoot);
  const nodeModulesDir = path.dirname(scopeDir);

  const isGlobal = String(process.env.npm_config_global || "").toLowerCase() === "true";
  const prefix = process.env.npm_config_prefix;

  const binDirs = [];
  // 1) Dev/local install: <pkgRoot>/node_modules/.bin
  binDirs.push(path.join(pkgRoot, "node_modules", ".bin"));
  // 2) Installed as a dependency: <projectRoot>/node_modules/.bin
  if (nodeModulesDir) binDirs.push(path.join(nodeModulesDir, ".bin"));
  if (isGlobal && prefix) binDirs.push(prefix);

  const cliAbs = path.join(pkgRoot, "bin", "cli.cjs");

  for (const binDir of binDirs) {
    if (!binDir || !fs.existsSync(binDir)) continue;

    const rel = path.relative(binDir, cliAbs);
    const relPosix = rel.split(path.sep).join("/");
    const relForRequire = relPosix.startsWith(".") ? relPosix : `./${relPosix}`;

    const sh = `#!/usr/bin/env node
require(${JSON.stringify(relForRequire)});
`;

    const cmdRel = rel.split(path.sep).join("\\");
    const cmd = `@ECHO off\r
SETLOCAL\r
node "%~dp0${cmdRel}" %*\r
`;

    const ps1Rel = cmdRel;
    const ps1 = `$basedir = Split-Path $MyInvocation.MyCommand.Definition -Parent
$cli = Join-Path $basedir ${JSON.stringify(ps1Rel)}
node $cli $args
`;

    const didWriteSh = writeFileIfPossible(path.join(binDir, "skills"), sh);
    if (didWriteSh) chmodIfPossible(path.join(binDir, "skills"), 0o755);

    writeFileIfPossible(path.join(binDir, "skills.cmd"), cmd);
    writeFileIfPossible(path.join(binDir, "skills.ps1"), ps1);
  }
}

main();
