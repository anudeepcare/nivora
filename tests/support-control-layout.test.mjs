import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('support controls preserve actions with dedicated responsive label tracks', () => {
 const source=fs.readFileSync('components/SupportInbox.tsx','utf8');
 const css=fs.readFileSync('components/SupportInbox.module.css','utf8');
 assert.match(source,/className={s.ticketControls}/);
 assert.match(source,/Status for/);
 assert.match(source,/change\({ id: r.id, priority: e.target.value }\)/);
 assert.match(source,/change\({ id: r.id, status: e.target.value }\)/);
 assert.match(source,/data.get\("assignee"\)/);
 assert.match(css,/\.ticketControls[\s\S]*overflow-wrap: normal/);
 assert.match(css,/@media \(max-width: 900px\)/);
});
