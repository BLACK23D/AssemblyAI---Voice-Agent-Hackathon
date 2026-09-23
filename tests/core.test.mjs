import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, mergeReport, missingFacts, approveDraft, orders } from '../public/core.mjs';

test('a report stays a draft until the required facts are present', () => {
  const initial = createDraft(orders[0]);
  assert.deepEqual(missingFacts(initial), ['Issue', 'Attempted contact method', 'Customer response', 'What happened', 'Suggested next action']);
  assert.throws(() => approveDraft(initial), /Complete:/);
  const filled = mergeReport(initial, { issue:'Customer unreachable', contactMethod:'Phone call', customerResponse:'No answer', details:'I called twice at the gate.', nextAction:'Dispatcher should call the customer.' });
  assert.deepEqual(missingFacts(filled), []);
  assert.equal(approveDraft(filled).status, 'Approved');
});

test('invalid categories are rejected and spoken evidence is not silently verified', () => {
  const initial = createDraft(orders[0]);
  assert.throws(() => mergeReport(initial, { issue:'Delivered' }), /Invalid issue/);
  const report = mergeReport(initial, { evidenceQuote:'I called twice' }, [{ role:'rider', text:'I called twice at the gate.' }]);
  assert.equal(report.quoteVerified, true);
  const mismatch = mergeReport(initial, { evidenceQuote:'I rang the bell' }, [{ role:'rider', text:'I called twice at the gate.' }]);
  assert.equal(mismatch.quoteVerified, false);
});

test('contradictory contact details cannot be approved', () => {
  const draft = mergeReport(createDraft(orders[0]), {
    issue: 'Customer unreachable', contactMethod: 'None', customerResponse: 'No answer',
    details: 'The customer was not at the gate.', nextAction: 'Ask dispatch to call.'
  });
  assert.ok(missingFacts(draft).includes('Contact and response conflict'));
  assert.throws(() => approveDraft(draft), /Contact and response conflict/);
});
