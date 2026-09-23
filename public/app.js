import { orders, issues, contactMethods, customerResponses, createDraft, missingFacts, mergeReport, approveDraft } from './core.mjs';

const $ = id => document.getElementById(id);
const stored = (() => { try { return JSON.parse(localStorage.getItem('routeproof.v1') || '{}'); } catch { return {}; } })();
const state = { orderId: orders[0].id, drafts: stored.drafts || {}, approved: Array.isArray(stored.approved) ? stored.approved : [], transcript: [], ready: false, session: null, lastEvent: '', pending: [], busy: false };
let toastTimer;

function save() { try { localStorage.setItem('routeproof.v1', JSON.stringify({ drafts: state.drafts, approved: state.approved })); } catch { toast('Browser storage is unavailable; this report may not persist.'); } }
function order() { return orders.find(item => item.id === state.orderId) || orders[0]; }
function draft() { if (!state.drafts[state.orderId]) state.drafts[state.orderId] = createDraft(order()); return state.drafts[state.orderId]; }
function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 4400); }
function options(id, values) { for (const value of values) { const option = document.createElement('option'); option.value = value; option.textContent = value; $(id).append(option); } }
function setConnection(text, kind = '') { const el = $('connection-state'); el.className = `connection-state ${kind}`; el.querySelector('span').nextSibling.textContent = text; }
function statusTime(date) { const value = new Date(date); return Number.isNaN(value.valueOf()) ? 'Just now' : value.toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); }

function renderDraft() {
  const value = draft(); const selected = order();
  $('order-select').value = state.orderId;
  $('issue-select').value = value.issue;
  $('contact-select').value = value.contactMethod;
  $('response-select').value = value.customerResponse;
  $('rider-value').textContent = selected.rider;
  $('stop-value').textContent = `${selected.stop} · ${selected.address}`;
  if (document.activeElement !== $('details-input')) $('details-input').value = value.details;
  if (document.activeElement !== $('action-input')) $('action-input').value = value.nextAction;
  $('evidence-value').textContent = value.evidenceQuote ? `“${value.evidenceQuote}”` : 'No quote captured yet.';
  $('evidence-label').textContent = value.evidenceQuote ? (value.quoteVerified ? 'Exact words found in the live transcript' : 'Quote not matched to the live transcript — verify manually') : '';
  $('draft-status').textContent = value.status;
  $('draft-status').className = `status-pill ${value.status.toLowerCase()}`;
  $('review-button').textContent = value.status === 'Approved' ? 'View approved report' : 'Review draft';
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); const use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '#i-arrow'); icon.append(use); $('review-button').append(icon);
  const missing = missingFacts(value); const list = $('missing-list'); list.replaceChildren();
  if (!missing.length) { const li = document.createElement('li'); li.className = 'complete'; li.textContent = 'Ready for review'; list.append(li); }
  for (const fact of missing) { const li = document.createElement('li'); li.textContent = fact; list.append(li); }
  const locked = value.status === 'Approved';
  for (const id of ['issue-select','contact-select','response-select','details-input','action-input']) $(id).disabled = locked;
  renderRows();
}

function renderRows() {
  const tbody = $('exceptions-body'); tbody.replaceChildren();
  const current = Object.values(state.drafts).filter(item => item.status !== 'Approved');
  const all = [...current, ...state.approved].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8);
  for (const item of all) {
    const selected = orders.find(o => o.id === item.orderId) || { rider: 'Unknown', stop: 'Unknown' };
    const tr = document.createElement('tr'); tr.dataset.id = item.orderId;
    for (const value of [item.orderId, item.issue || 'Awaiting report', selected.rider, selected.stop]) { const td = document.createElement('td'); td.textContent = value; tr.append(td); }
    const status = document.createElement('td'); const pill = document.createElement('span'); pill.className = `row-status ${item.status.toLowerCase()}`; pill.textContent = item.status; status.append(pill); tr.append(status);
    const updated = document.createElement('td'); updated.textContent = statusTime(item.updatedAt); tr.append(updated);
    const action = document.createElement('td'); const button = document.createElement('button'); button.className = 'row-open'; button.textContent = 'Open'; button.addEventListener('click', () => selectOrder(item.orderId)); action.append(button); tr.append(action); tbody.append(tr);
  }
}

function selectOrder(id) {
  if (state.session) { toast('End the voice session before switching stops.'); return; }
  if (!orders.some(item => item.id === id)) return;
  state.orderId = id; state.transcript = []; renderTranscript(); renderDraft(); setView('exceptions');
}

function updateDraft(patch) {
  try { state.drafts[state.orderId] = mergeReport(draft(), patch, state.transcript); save(); renderDraft(); }
  catch (error) { toast(error.message); }
}

function renderTranscript() {
  const host = $('transcript'); host.replaceChildren();
  if (!state.transcript.length) { const p = document.createElement('p'); p.className = 'empty-transcript'; p.textContent = 'Your conversation will appear here in real time.'; host.append(p); return; }
  for (const item of state.transcript) { const p = document.createElement('p'); p.className = item.role === 'rider' ? 'rider' : 'agent'; const label = document.createElement('span'); label.className = 'speaker'; label.textContent = item.role === 'rider' ? 'Rider' : 'Agent'; p.append(label, document.createTextNode(item.text)); host.append(p); }
  host.scrollTop = host.scrollHeight;
}

const reportTool = { type: 'function', name: 'record_exception', description: 'Create or update the reviewable delivery exception draft from what the rider actually said. Call this after enough facts are collected. Never claim dispatch approved it. Ask for missing facts returned by the tool.', parameters: { type: 'object', properties: {
  issue: { type: 'string', enum: issues, description: 'Best matching issue category.' },
  contactMethod: { type: 'string', enum: contactMethods, description: 'How the rider tried to contact the customer. Choose None only if no attempt was made.' },
  customerResponse: { type: 'string', enum: customerResponses, description: 'Actual response or outcome of contact.' },
  details: { type: 'string', description: 'Concrete facts of what happened in the rider’s words, not speculation.' },
  nextAction: { type: 'string', description: 'Suggested next step for a human dispatcher to review.' },
  evidenceQuote: { type: 'string', description: 'Short exact phrase spoken by the rider, if available.' }
}, required: ['issue','details'] } };

function toolResult(event) {
  if (event.name !== 'record_exception') return { result: { error: `Unknown tool: ${event.name}` } };
  if (!event.arguments || typeof event.arguments !== 'object') return { result: { error: 'No report fields were provided. Ask the rider what happened.' } };
  try {
    const base = state.pending.at(-1)?.nextDraft || draft();
    const nextDraft = mergeReport(base, event.arguments, state.transcript);
    const missing = missingFacts(nextDraft);
    return { nextDraft, result: { saved: true, status: 'draft_only', missing_facts: missing, message: missing.length ? `Ask about: ${missing.join(', ')}.` : 'Draft complete. Tell the rider a dispatcher must review it.' } };
  } catch (error) { return { result: { error: `${error.message} Ask the rider to clarify that field.` } }; }
}

function flushTools() {
  if (state.lastEvent !== 'reply.done' || !state.session || !state.pending.length) return;
  const pending = state.pending.splice(0);
  for (const tool of pending) {
    if (tool.nextDraft) { state.drafts[state.orderId] = tool.nextDraft; save(); renderDraft(); }
    state.session.ws.send(JSON.stringify({ type: 'tool.result', call_id: tool.callId, result: JSON.stringify(tool.result) }));
  }
}

function decodePcm(base64) {
  const raw = atob(base64); const samples = new Float32Array(raw.length / 2);
  for (let i = 0; i < samples.length; i++) { const lo = raw.charCodeAt(i*2), hi = raw.charCodeAt(i*2+1); let sample = (hi << 8) | lo; if (sample & 0x8000) sample -= 0x10000; samples[i] = sample / 32768; }
  return samples;
}

function playAudio(base64) {
  const session = state.session; if (!session) return;
  const samples = decodePcm(base64); const context = session.outputContext;
  const buffer = context.createBuffer(1, samples.length, 24000); buffer.copyToChannel(samples, 0);
  const source = context.createBufferSource(); source.buffer = buffer; source.connect(context.destination);
  source.onended = () => session.sources.delete(source); session.sources.add(source);
  const when = Math.max(context.currentTime + .015, session.nextPlayTime); source.start(when); session.nextPlayTime = when + buffer.duration;
}

function flushAudio() { const session = state.session; if (!session) return; for (const source of session.sources) { try { source.stop(); } catch {} } session.sources.clear(); session.nextPlayTime = session.outputContext.currentTime; }

function handleEvent(event) {
  if (event.type === 'session.ended') { stopVoice(false); return; }
  if (event.type === 'session.ready') { state.ready = true; setConnection('Live session', 'live'); $('transcript-status').textContent = 'Listening'; state.session.sessionId = event.session_id; return; }
  if (event.type === 'session.error') { toast(event.message || 'Voice session error'); $('transcript-status').textContent = 'Voice error'; return; }
  if (event.type === 'input.speech.started') { state.lastEvent = event.type; $('transcript-status').textContent = 'Rider speaking'; return; }
  if (event.type === 'transcript.user') { if (event.text) { state.transcript.push({ role: 'rider', text: event.text }); renderTranscript(); } return; }
  if (event.type === 'reply.started') { state.lastEvent = event.type; $('transcript-status').textContent = 'Agent replying'; return; }
  if (event.type === 'reply.audio' && event.data) { playAudio(event.data); return; }
  if (event.type === 'transcript.agent') { if (event.text) { state.transcript.push({ role: 'agent', text: event.text }); renderTranscript(); } return; }
  if (event.type === 'tool.call') { state.pending.push({ callId: event.call_id, ...toolResult(event) }); flushTools(); return; }
  if (event.type === 'reply.done') { state.lastEvent = event.type; if (event.status === 'interrupted') { flushAudio(); state.pending = []; } else flushTools(); $('transcript-status').textContent = 'Listening'; }
}

async function startVoice() {
  if (state.busy || state.session) return;
  state.busy = true;
  let stream, inputContext, outputContext, ws;
  try {
    const health = await fetch('/api/health').then(response => response.json());
    if (!health.ready) throw new Error('AssemblyAI key is not configured on the server.');
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, channelCount: 1 } });
    const tokenResponse = await fetch('/api/voice-token', { method: 'POST' });
    const tokenBody = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenBody.token) throw new Error(tokenBody.error || 'Voice session unavailable.');
    inputContext = new AudioContext({ sampleRate: 24000 }); outputContext = new AudioContext({ sampleRate: 24000 });
    if (inputContext.sampleRate !== 24000 || outputContext.sampleRate !== 24000) throw new Error('This browser cannot use 24 kHz audio. Try Edge or Chrome.');
    await inputContext.audioWorklet.addModule('/pcm-worklet.js?v=6'); await inputContext.resume(); await outputContext.resume();
    const worklet = new AudioWorkletNode(inputContext, 'pcm-capture');
    const source = inputContext.createMediaStreamSource(stream); source.connect(worklet);
    const silentGain = inputContext.createGain(); silentGain.gain.value = 0; worklet.connect(silentGain).connect(inputContext.destination);
    ws = new WebSocket(`wss://agents.assemblyai.com/v1/ws?token=${encodeURIComponent(tokenBody.token)}`);
    state.session = { ws, stream, inputContext, outputContext, source, worklet, silentGain, sources: new Set(), nextPlayTime: 0, sessionId: '' };
    state.ready = false; state.pending = []; state.lastEvent = '';
    worklet.port.onmessage = message => { if (!state.ready || ws.readyState !== WebSocket.OPEN || ws.bufferedAmount > 100_000) return; const bytes = new Uint8Array(message.data); let binary = ''; for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]); ws.send(JSON.stringify({ type: 'input.audio', audio: btoa(binary) })); };
    ws.onopen = () => {
      const selected = order();
      ws.send(JSON.stringify({ type: 'session.update', session: {
        system_prompt: `You are RouteProof, a concise voice agent helping a delivery rider report one exception for order ${selected.id}, rider ${selected.rider}, stop ${selected.stop}, ${selected.address}. Ask what happened, whether and how they contacted the customer, what the customer said or whether there was no answer, and what dispatch should do next. Ask one short question at a time. If the rider gives conflicting facts, ask which account is correct before calling record_exception; do not silently choose one. Call record_exception with verified facts and include a short exact rider quote when available. Never invent a call, response, address, quote, approval, or completed delivery. The tool only creates a draft. A human dispatcher reviews and approves it. Do not read markdown aloud.`,
        greeting: `Hi. Tell me what happened at ${selected.stop}.`,
        input: { format: { encoding: 'audio/pcm' }, keyterms: [selected.stop, selected.rider, selected.id, 'RouteProof'] },
        output: { voice: 'alba', format: { encoding: 'audio/pcm' } },
        tools: [reportTool]
      } }));
    };
    ws.onmessage = message => { try { handleEvent(JSON.parse(message.data)); } catch { toast('Could not process a voice event.'); } };
    ws.onerror = () => toast('Voice connection failed.');
    ws.onclose = () => { if (state.session?.ws === ws) stopVoice(false); };
    $('mic-button').classList.add('live'); $('mic-button').setAttribute('aria-label', 'End voice report'); $('voice-action-title').textContent = 'End voice report'; $('voice-action-help').textContent = 'Speak naturally. The agent will ask for missing facts.'; setConnection('Connecting', '');
  } catch (error) {
    stream?.getTracks().forEach(track => track.stop()); await inputContext?.close().catch(() => {}); await outputContext?.close().catch(() => {}); ws?.close(); state.session = null; toast(error.message || 'Could not start voice report.'); setConnection('Voice unavailable', '');
  } finally { state.busy = false; }
}

async function stopVoice(clean = true) {
  const session = state.session; if (!session) return;
  if (clean && session.ws.readyState === WebSocket.OPEN) {
    if (session.ending) return;
    session.ending = true;
    session.stream.getTracks().forEach(track => track.stop());
    setConnection('Ending session', '');
    try {
      session.ws.send(JSON.stringify({ type: 'session.end' }));
      session.endTimer = setTimeout(() => { if (state.session?.ws === session.ws) stopVoice(false); }, 3000);
      return;
    } catch {}
  }
  clearTimeout(session.endTimer);
  state.session = null; state.ready = false; state.pending = [];
  session.ws.close(); session.stream.getTracks().forEach(track => track.stop()); session.source.disconnect(); session.worklet.disconnect(); session.silentGain.disconnect();
  for (const source of session.sources) { try { source.stop(); } catch {} }
  await session.inputContext.close().catch(() => {}); await session.outputContext.close().catch(() => {});
  $('mic-button').classList.remove('live'); $('mic-button').setAttribute('aria-label', 'Start voice report'); $('voice-action-title').textContent = 'Start voice report'; $('voice-action-help').textContent = 'Choose a stop, then speak with the agent'; $('transcript-status').textContent = 'Session ended'; setConnection('Ready for report', 'ready');
}

function review() {
  const value = draft(); const facts = $('review-facts'); facts.replaceChildren();
  const selected = order();
  for (const [label, content] of [['Order', selected.id], ['Stop', selected.stop], ['Issue', value.issue || 'Missing'], ['Contact method', value.contactMethod || 'Missing'], ['Customer response', value.customerResponse || 'Missing'], ['What happened', value.details || 'Missing'], ['Next action', value.nextAction || 'Missing'], ['Spoken quote', value.evidenceQuote || 'None captured']]) { const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = content; facts.append(dt, dd); }
  const missing = missingFacts(value); $('approve-button').disabled = value.status === 'Approved' || missing.length > 0; $('approve-button').title = missing.length ? `Complete ${missing.join(', ')}` : ''; $('review-dialog').showModal();
}

function setView(view) {
  for (const item of document.querySelectorAll('.nav-item')) item.classList.toggle('active', item.dataset.view === view);
  $('exceptions-view').classList.toggle('hidden', view !== 'exceptions' && view !== 'overview');
  $('secondary-view').classList.toggle('hidden', view === 'exceptions' || view === 'overview');
  if (view === 'routes') { $('secondary-title').textContent = 'Today’s route'; $('secondary-description').textContent = 'Choose a stop to start or review a delivery exception.'; }
  if (view === 'activity') { $('secondary-title').textContent = 'Review activity'; $('secondary-description').textContent = 'Approved reports on this browser.'; }
  const target = $('secondary-content'); target.replaceChildren();
  if (view === 'routes') for (const item of orders) { const button = document.createElement('button'); button.className = 'secondary-card quiet-button'; button.innerHTML = `<strong></strong><span></span><b>Open stop →</b>`; button.querySelector('strong').textContent = item.id; button.querySelector('span').textContent = `${item.stop} · ${item.rider}`; button.addEventListener('click', () => selectOrder(item.id)); target.append(button); }
  if (view === 'activity') for (const item of state.approved) { const row = document.createElement('div'); row.className = 'secondary-card'; const a = document.createElement('strong'); a.textContent = item.orderId; const b = document.createElement('span'); b.textContent = item.issue; const c = document.createElement('span'); c.textContent = statusTime(item.updatedAt); row.append(a,b,c); target.append(row); }
  if (view === 'activity' && !state.approved.length) target.textContent = 'No approved reports yet.';
}

async function init() {
  $('today').textContent = new Date().toLocaleDateString('en-KE', { weekday:'short', day:'numeric', month:'short' });
  options('order-select', orders.map(item => item.id)); options('issue-select', issues); options('contact-select', contactMethods); options('response-select', customerResponses);
  $('order-select').addEventListener('change', event => selectOrder(event.target.value));
  for (const [id,key] of [['issue-select','issue'],['contact-select','contactMethod'],['response-select','customerResponse'],['details-input','details'],['action-input','nextAction']]) $(id).addEventListener(id.endsWith('input') ? 'input' : 'change', event => updateDraft({ [key]: event.target.value }));
  $('mic-button').addEventListener('click', () => state.session ? stopVoice() : startVoice());
  $('review-button').addEventListener('click', review); $('close-review').addEventListener('click', () => $('review-dialog').close()); $('edit-draft').addEventListener('click', () => $('review-dialog').close());
  $('approve-button').addEventListener('click', () => { try { const approved = approveDraft(draft()); state.approved = [approved, ...state.approved.filter(item => item.id !== approved.id)]; state.drafts[state.orderId] = approved; save(); renderDraft(); $('review-dialog').close(); toast('Exception approved and saved in this browser.'); } catch (error) { toast(error.message); } });
  $('new-report').addEventListener('click', () => {
    if (state.session) { toast('End the voice session before starting another report.'); return; }
    const next = orders.find(item => !state.drafts[item.id]);
    if (!next) { toast('All sample stops have reports. Open an existing stop to review it.'); return; }
    selectOrder(next.id);
  });
  for (const item of document.querySelectorAll('.nav-item')) item.addEventListener('click', () => setView(item.dataset.view));
  renderDraft(); renderTranscript();
  try { const response = await fetch('/api/health'); const data = await response.json(); setConnection(data.ready ? 'Ready for report' : 'API key needed', data.ready ? 'ready' : ''); }
  catch { setConnection('Server unavailable'); }
}

window.addEventListener('pagehide', () => {
  const session = state.session;
  if (session?.ws.readyState === WebSocket.OPEN) {
    try { session.ws.send(JSON.stringify({ type: 'session.end' })); } catch {}
  }
});
init();
