import test from 'node:test';
import assert from 'node:assert/strict';
import { initialAlertType } from '../lib/alert-setup.ts';
test('notification shortcuts select supported rules without enabling or creating them', () => {
 for(const type of ['monthly-zone','earnings-soon','new-filing']) assert.equal(initialAlertType(type),type);
});
test('unsupported notification requests fall back to an existing rule type', () => {
 for(const type of [null,'','thesis-change','estimate-revision','email','<script>']) assert.equal(initialAlertType(type),'new-filing');
});
