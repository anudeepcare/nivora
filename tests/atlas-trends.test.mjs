import test from 'node:test';
import assert from 'node:assert/strict';
import {atlasTrends} from '../lib/atlas-trends.ts';
import {demoData} from './fixtures/demo.ts';
test('atlas trends use only actual dated financial periods',()=>{
 const research=demoData.research.MSFT;
 const trends=atlasTrends(research);
 for(const trend of Object.values(trends)) if(trend){assert.ok(trend.count>=2);assert.doesNotMatch(trend.points,/NaN|Infinity/);assert.ok(trend.from<trend.to);assert.equal(trend.points.split(' ').length,trend.count);}
});
test('missing financial facts produce no fabricated trend',()=>{
 assert.deepEqual(atlasTrends({...demoData.research.MSFT,facts:[]}),{});
});
