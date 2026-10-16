"""Package all project source, preserving paths, and verify every archived byte."""
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
EXCLUDED_DIRS = {".git", ".next", "node_modules", ".engine-test", "__pycache__", "__MACOSX", ".vercel"}
MANIFEST = "SOURCE_MANIFEST.json"


def project_files():
    for directory, dirs, files in os.walk(ROOT):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDED_DIRS and not (Path(directory) / d).is_symlink())
        for name in sorted(files):
            p = Path(directory) / name
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
                "excluded": sorted(EXCLUDED_DIRS) + ["local environment credentials (template included)", "OS metadata", "compiled caches", "nested archives", "symlinks"]}
    (ROOT / MANIFEST).write_text(json.dumps(manifest, indent=2) + "\n")
    files.append(ROOT / MANIFEST)
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
