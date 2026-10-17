#!/usr/bin/env python3
"""Package the standalone source with an exact manifest; omit generated output/secrets."""
import hashlib,json,os,pathlib,sys,zipfile
root=pathlib.Path(__file__).resolve().parents[1]
output=pathlib.Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root.parent/'AURYN-full-source-handoff.zip'
skip={'node_modules','.next','.git','.superpowers','test-results','playwright-report','__pycache__'}
files=[]
for path in sorted(root.rglob('*')):
 if not path.is_file() or path.is_symlink():continue
 rel=path.relative_to(root)
 if any(p in skip for p in rel.parts) or path.suffix in {'.zip','.tsbuildinfo','.pyc'}:continue
 if path.name.startswith('.env') and path.name!='.env.example':continue
 if path.name in {'MANIFEST.sha256','test-current.log'}:continue
 files.append(path)
scan=os.environ.get('AURYN_SECRET_SCAN_FILE')
if scan:
 values=[str(v).encode() for v in json.load(open(scan)).values() if isinstance(v,str) and len(v)>=8]
 for path in files:
  data=path.read_bytes()
  if any(value in data for value in values):raise SystemExit('Private configuration content detected; packaging stopped.')
manifest=''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(root).as_posix()+'\n' for p in files)
(root/'MANIFEST.sha256').write_text(manifest)
files.append(root/'MANIFEST.sha256')
output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
 for path in files:archive.write(path,'AURYN/'+path.relative_to(root).as_posix())
with zipfile.ZipFile(output) as archive:
 bad=archive.testzip()
 if bad:raise SystemExit('Archive integrity failure: '+bad)
 for line in manifest.splitlines():
  expected,name=line.split('  ',1)
  if hashlib.sha256(archive.read('AURYN/'+name)).hexdigest()!=expected:raise SystemExit('Manifest mismatch: '+name)
 names=set(archive.namelist())
 for expected in ['package.json','package-lock.json','app/layout.tsx','lib/engine.ts','supabase/migrations/202610170000_workspace_base.sql','tests/database.test.mjs','verification/REPORT.json','.github/workflows/auryn-product-verify.yml','docs/DEPLOYMENT.md']:
  if 'AURYN/'+expected not in names:raise SystemExit('Required source missing: '+expected)
print(json.dumps({'archive':str(output),'files':len(files),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'crc':'passed','manifest':'passed','privateConfigurationScan':'passed' if scan else 'not requested'}))
