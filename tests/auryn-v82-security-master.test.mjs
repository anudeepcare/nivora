import test from 'node:test';
import assert from 'node:assert/strict';
import {classifySecuritySymbol,isSupportedEquitySecurity} from '../.engine-test/auryn/v82/security-master.js';

test('security master classifies special instruments exposed by the 500-stock audit',()=>{
  assert.equal(classifySecuritySymbol('AIIOW').kind,'WARRANT');
  assert.equal(classifySecuritySymbol('AESPR').kind,'RIGHT');
  assert.equal(classifySecuritySymbol('ALPXR').kind,'RIGHT');
  assert.equal(classifySecuritySymbol('APMCR').kind,'RIGHT');
  assert.equal(classifySecuritySymbol('AIIA.UN').kind,'UNIT');
  assert.equal(classifySecuritySymbol('AHL.PR.F').kind,'PREFERRED');
  assert.equal(classifySecuritySymbol('ALB.PR.A').kind,'PREFERRED');
  assert.equal(classifySecuritySymbol('ANGIV').kind,'TEMPORARY');
});

test('ordinary equities and class shares remain supported',()=>{
  for(const s of ['MSFT','APDN','AFBI','IREN','BRK.A','AKO.B','AGM.A']){
    assert.equal(isSupportedEquitySecurity(classifySecuritySymbol(s)),true,s);
  }
});

test('special instruments fail closed for common-equity analysis',()=>{
  for(const s of ['AIIOW','AESPR','ALPXR','APMCR','AIIA.UN','AHL.PR.F','ANGIV']){
    assert.equal(isSupportedEquitySecurity(classifySecuritySymbol(s)),false,s);
  }
});
