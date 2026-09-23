export const orders = [
  { id: 'RP-2048', rider: 'Brian Otieno', stop: 'Greenwood Apartments', address: 'Riverside Drive, Nairobi' },
  { id: 'RP-2037', rider: 'Grace Wanjiku', stop: 'Kilimani Heights', address: 'Argwings Kodhek Road, Nairobi' },
  { id: 'RP-2031', rider: 'David Mwangi', stop: 'Lavington Mall', address: 'James Gichuru Road, Nairobi' },
  { id: 'RP-2026', rider: 'Aisha Mohamed', stop: 'Westlands Business Park', address: 'Waiyaki Way, Nairobi' }
];

export const issues = ['Customer unreachable', 'Address not found', 'Customer refused', 'Business closed', 'Other'];
export const contactMethods = ['Phone call', 'SMS', 'WhatsApp', 'None'];
export const customerResponses = ['No answer', 'Refused delivery', 'Asked to reschedule', 'Could not locate address', 'Other', 'No contact attempted'];

const clean = (value, max = 300) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export function createDraft(order) {
  return { id: crypto.randomUUID(), orderId: order.id, issue: '', contactMethod: '', customerResponse: '', details: '', nextAction: '', evidenceQuote: '', quoteVerified: false, status: 'Draft', updatedAt: new Date().toISOString() };
}

export function missingFacts(draft) {
  return [
    !draft.issue && 'Issue',
    !draft.contactMethod && 'Attempted contact method',
    !draft.customerResponse && 'Customer response',
    draft.contactMethod && draft.customerResponse && ((draft.contactMethod === 'None') !== (draft.customerResponse === 'No contact attempted')) && 'Contact and response conflict',
    !draft.details && 'What happened',
    !draft.nextAction && 'Suggested next action'
  ].filter(Boolean);
}

export function mergeReport(draft, input, transcript = []) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Report must be an object.');
  const next = { ...draft };
  for (const [key, allowed] of [['issue', issues], ['contactMethod', contactMethods], ['customerResponse', customerResponses]]) {
    if (input[key] !== undefined) {
      if (!allowed.includes(input[key])) throw new Error(`Invalid ${key}.`);
      next[key] = input[key];
    }
  }
  for (const key of ['details', 'nextAction']) if (input[key] !== undefined) next[key] = clean(input[key]);
  if (input.evidenceQuote !== undefined) {
    next.evidenceQuote = clean(input.evidenceQuote, 200);
    next.quoteVerified = Boolean(next.evidenceQuote) && transcript.some(item => item.role === 'rider' && item.text.toLowerCase().includes(next.evidenceQuote.toLowerCase()));
  }
  next.updatedAt = new Date().toISOString();
  return next;
}

export function approveDraft(draft) {
  const missing = missingFacts(draft);
  if (missing.length) throw new Error(`Complete: ${missing.join(', ')}.`);
  return { ...draft, status: 'Approved', updatedAt: new Date().toISOString() };
}
