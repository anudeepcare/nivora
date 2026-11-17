#!/usr/bin/env node
// Install the exact AURYN source in an existing repository, retaining a recovery copy.
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const keep = (name) =>
  name === ".git" ||
  name === ".vercel" ||
  name === ".env" ||
  (name.startsWith(".env.") && name !== ".env.example");
function files(root, relative = "") {
  return fs
    .readdirSync(path.join(root, relative), { withFileTypes: true })
    .flatMap((entry) => {
      const name = path.posix.join(relative, entry.name);
      if (entry.isSymbolicLink())
        throw Error("Source package contains a symbolic link.");
      if (entry.isDirectory()) return files(root, name);
      if (!entry.isFile())
        throw Error("Source package contains a non-file entry.");
      return [name];
    });
}
function validate(source) {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(source, "package.json"), "utf8"),
  );
  if (
    pkg.name !== "auryn-product" ||
    !fs.existsSync(path.join(source, "app/layout.tsx"))
  )
    throw Error("This is not the standalone AURYN source package.");
  const manifest = fs
    .readFileSync(path.join(source, "MANIFEST.sha256"), "utf8")
    .trim()
    .split(/\r?\n/);
  const expected = new Set(["MANIFEST.sha256"]);
  for (const line of manifest) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match) throw Error("Invalid source manifest.");
    const [, digest, name] = match;
    if (
      name.startsWith("/") ||
      name.includes("\\") ||
      name.split("/").some((p) => p === ".." || keep(p)) ||
      expected.has(name)
    )
      throw Error("Unsafe or duplicated source path.");
    const file = path.join(source, name);
    if (
      !fs.existsSync(file) ||
      fs.lstatSync(file).isSymbolicLink() ||
      createHash("sha256").update(fs.readFileSync(file)).digest("hex") !==
        digest
    )
      throw Error("Source checksum mismatch: " + name);
    expected.add(name);
  }
  for (const name of files(source))
    if (!expected.has(name)) throw Error("Unlisted source file: " + name);
}
function applySource(root, source) {
  root = fs.realpathSync(root);
  source = fs.realpathSync(source);
  if (
    !fs.existsSync(path.join(root, ".git")) ||
    !fs.existsSync(path.join(root, "package.json"))
  )
    throw Error("Run this inside your existing AURYN Git folder.");
  if (source === root || source.startsWith(root + path.sep))
    throw Error("Incoming source must be staged outside the existing app.");
  validate(source);
  const backup = fs.mkdtempSync(
    path.join(path.dirname(root), "AURYN-source-backup-"),
  );
  const moved = [],
    installed = [];
  try {
    for (const name of fs.readdirSync(root))
      if (!keep(name)) {
        fs.renameSync(path.join(root, name), path.join(backup, name));
        moved.push(name);
      }
    for (const name of fs.readdirSync(source)) {
      fs.renameSync(path.join(source, name), path.join(root, name));
      installed.push(name);
    }
  } catch (error) {
    for (const name of installed.reverse())
      fs.renameSync(path.join(root, name), path.join(source, name));
    for (const name of moved.reverse())
      fs.renameSync(path.join(backup, name), path.join(root, name));
    throw error;
  }
  return backup;
}
module.exports = { applySource };
if (require.main === module) {
  let stage;
  try {
    const archive = path.resolve(process.argv[2] || "");
    if (!process.argv[2] || !fs.statSync(archive).isFile())
      throw Error("Pass the full path to AURYN-full-source-handoff.zip.");
    const root = fs.realpathSync(process.cwd());
    if (
      execFileSync("git", ["rev-parse", "--show-toplevel"], {
        encoding: "utf8",
      }).trim() !== root
    )
      throw Error("Run this from the AURYN repository root.");
    const names = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" })
      .trim()
      .split(/\r?\n/);
    if (
      names.some(
        (n) =>
          !n.startsWith("AURYN/") ||
          n.includes("\\") ||
          n.split("/").some((p) => p === ".." || keep(p)),
      )
    )
      throw Error("Unexpected archive paths.");
    const listing = execFileSync("unzip", ["-Z", "-l", archive], {
      encoding: "utf8",
    });
    if (/^l[rwx-]{9}\s/m.test(listing))
      throw Error("Archive links are not allowed.");
    execFileSync("unzip", ["-tq", archive], { stdio: "pipe" });
    stage = fs.mkdtempSync(path.join(path.dirname(root), "auryn-incoming-"));
    execFileSync("unzip", ["-q", archive, "-d", stage]);
    const backup = applySource(root, path.join(stage, "AURYN"));
    console.log("Installed the exact AURYN source in " + root);
    console.log("Previous source and generated files saved in " + backup);
    console.log(
      "Git history, local environment files and Vercel link preserved. Run npm ci, npm run verify and npm run test:api before pushing.",
    );
  } catch (error) {
    console.error("Install stopped: " + error.message);
    process.exitCode = 1;
  } finally {
    if (stage) fs.rmSync(stage, { recursive: true, force: true });
  }
}
