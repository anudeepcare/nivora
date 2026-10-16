"""Select reproducible current Chromium captures for the source ZIP, without modifying images."""
from pathlib import Path
import shutil, html, json
root=Path(__file__).resolve().parent.parent
out=root/'verification/next-build/visual-review';(out/'captures').mkdir(parents=True,exist_ok=True)
source=root/'verification/next-build/browser-release/screenshots'
names=['light-390-dashboard','light-1440-analyze','light-390-login','light-1440-home','light-390-research-Overview','light-1440-research-Overview','dark-390-research-Overview','light-390-research-Business','light-1440-research-Valuation','light-390-research-Technicals','dark-1440-research-Technicals','light-390-populated-portfolio','light-1440-populated-portfolio','light-390-trading-lab','dark-390-watchlist','light-390-profile','synthetic-complete-journey-today-390','synthetic-planning-journal-390','light-390-accumulation-replay','light-1440-accumulation-replay','dark-390-accumulation-replay']
missing=[]
for name in names:
 p=source/(name+'.png')
 if not p.exists():missing.append(name);continue
 shutil.copy2(p,out/'captures'/p.name)
if missing:raise SystemExit('Missing selected current captures: '+', '.join(missing))
report=json.loads((source.parent/'report.json').read_text())
notes='''Actual current app renders use synthetic QA data. Approved boards specify the visual hierarchy, blue/navy palette and restrained glass direction; their illustrative numbers are not live financial data. Today and accumulation planning are added surfaces without exact per-page approved pixel exports. On narrow screens cards stack, tables scroll inside their own containers, and chart period controls wrap to preserve touch targets. Full-page captures show the fixed mobile dock once at the initial viewport position; this is not a second dock or a component inserted into document flow. No pixel-match, physical iPhone/Safari or screen-reader certification is claimed. All matrix checks are in the JSON report; only this representative image selection is bundled.'''
head='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AURYN actual release visuals</title><style>body{font:16px/1.6 system-ui;background:#f3f6fc;color:#112943;margin:0;padding:clamp(16px,4vw,48px)}h1{line-height:1.2}section{background:white;border:1px solid #ced9eb;border-radius:18px;padding:22px;margin:28px 0}img{display:block;max-width:100%;height:auto;margin:auto}h2{font-size:20px}p{max-width:1000px}nav{display:flex;gap:20px;flex-wrap:wrap}a{color:#2468ff}.mobile img{max-width:430px}</style><h1>AURYN — current source release visuals</h1>'''
body='<p>'+html.escape(notes)+'</p><p>Build: '+html.escape(str(report['release'].get('.next/BUILD_ID')))+'. Browser summary: '+html.escape(str(report['summary']))+'</p><nav><a href="../REQUIREMENTS_STATUS.md">104-item evidence ledger</a><a href="../REMAINING_GAPS.md">Remaining gaps</a><a href="../browser-release/report.json">Full matrix report</a></nav>'
for board in sorted((root/'docs/redesign/approved-2026-10-16').glob('*.png')):body+=f'<section><h2>Approved reference: {html.escape(board.stem)}</h2><img loading="lazy" src="../../../docs/redesign/approved-2026-10-16/{board.name}" alt="Approved {html.escape(board.stem)} collage"></section>'
for name in names:body+=f'<section class="{"mobile" if "-390" in name else "desktop"}"><h2>Actual app: {html.escape(name)}</h2><img loading="lazy" src="captures/{name}.png" alt="Current synthetic QA app capture {html.escape(name)}"></section>'
(out/'index.html').write_text(head+body+'</html>')
(out/'README.md').write_text('# Current visual comparison\n\n'+notes+'\n\nOpen index.html for approved reference boards and '+str(len(names))+' selected actual app captures. No image has been generated to stand in for a running app.\n')
print('Selected current captures:',len(names))
