import test from 'node:test';
import assert from 'node:assert/strict';
import {recordExperience,experienceSnapshot} from '../lib/experience-metrics.ts';
test('performance diagnostics aggregate timings without retaining page or account data',()=>{
 recordExperience('longtask',120);recordExperience('event',280);recordExperience('layout-shift',0,.03);recordExperience('event',NaN);
 assert.deepEqual(experienceSnapshot(),{longTasks:1,longestTaskMs:120,slowInteractions:1,longestInteractionMs:280,layoutShift:.03});
});
