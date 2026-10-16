"""Package all project source, preserving paths, and verify every archived byte."""
import hashlib
import json
import os
from pathlib import Path
import sys
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
EXCLUDED_DIRS = {".git", ".next", "node_modules", ".engine-test", "__pycache__", "__MACOSX", ".vercel", ".temp", "test-results", "playwright-report"}
MANIFEST = "SOURCE_MANIFEST.json"


def project_files():
    for directory, dirs, files in os.walk(ROOT):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDED_DIRS and not d.startswith(".engine-") and not (Path(directory) / d).is_symlink() and not (d == "screenshots" and "verification" in Path(directory).relative_to(ROOT).parts))
        for name in sorted(files):
            p = Path(directory) / name
            if name == "screenshots.html" and "verification" in p.relative_to(ROOT).parts:
                continue
            if p.is_symlink() or name == ".DS_Store" or name.startswith("._"):
                continue
            if name.startswith(".env") and name != ".env.example":
                continue
            if name.endswith((".tsbuildinfo", ".pyc", ".zip", ".tar.gz")):
                continue
            yield p


def main():
    output = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT.parent / "AURYN_REBUILD_SOURCE_AND_VERIFICATION.zip").resolve()
    required = ["package.json", "package-lock.json", "next.config.ts", "tsconfig.json", ".env.example", "app/layout.tsx", "supabase/schema.sql", "DEPLOYMENT.md"]
    for name in required:
        if not (ROOT / name).is_file():
            raise SystemExit(f"Required source file missing: {name}")
    files = [p for p in project_files() if p.relative_to(ROOT).as_posix() != MANIFEST]
    entries = [{"path": p.relative_to(ROOT).as_posix(), "bytes": p.stat().st_size, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
    manifest = {"format": 1, "root": "AURYN/", "files": entries, "manifest_excludes_itself": True,
                "excluded": sorted(EXCLUDED_DIRS) + ["local environment credentials (template included)", "OS metadata", "compiled caches", "nested archives", "symlinks", ".engine-* transient compilation", "bulk and historical screenshot captures (curated current visual-review included)"]}
    (ROOT / MANIFEST).write_text(json.dumps(manifest, indent=2) + "\n")
    files.append(ROOT / MANIFEST)
    # Verify full source preservation against Git, not only an ad-hoc folder list.
    tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().split("\0") if (ROOT / ".git").exists() else []
    packed = {p.relative_to(ROOT).as_posix() for p in files}
    source_prefixes = ("app/", "components/", "lib/", "tests/", "scripts/", "public/", "supabase/", ".github/")
    missing = [p for p in tracked if p.startswith(source_prefixes) and not p.endswith((".zip", ".pyc", ".tsbuildinfo")) and p not in packed]
    if missing:
        raise SystemExit("Tracked source missing from package: " + ", ".join(missing))
    output.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix="auryn-package-", suffix=".zip", dir=output.parent)
    os.close(fd)
    try:
        with zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
            for p in files:
                archive.write(p, "AURYN/" + p.relative_to(ROOT).as_posix())
        with zipfile.ZipFile(temp) as archive:
            if archive.testzip() is not None:
                raise RuntimeError("Archive CRC validation failed")
            if len(archive.namelist()) != len(files):
                raise RuntimeError("Archive file inventory differs from source")
            for entry in entries:
                data = archive.read("AURYN/" + entry["path"])
                if len(data) != entry["bytes"] or hashlib.sha256(data).hexdigest() != entry["sha256"]:
                    raise RuntimeError("Archive differs from source: " + entry["path"])
        os.replace(temp, output)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)
    print(json.dumps({"archive": str(output), "files": len(files), "bytes": output.stat().st_size,
                      "sha256": hashlib.sha256(output.read_bytes()).hexdigest(), "integrity": "PASS", "all_manifest_hashes": "PASS"}, indent=2))


if __name__ == "__main__":
    main()
