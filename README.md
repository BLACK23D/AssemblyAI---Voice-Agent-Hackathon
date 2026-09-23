# RouteProof

RouteProof is a prototype for the [AssemblyAI Voice Agent Hackathon](https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon). A rider reports a delivery exception by voice. The agent asks for missing facts and writes a draft. A dispatcher reviews and approves the record in the browser.

## Run locally

1. Use Node.js 22 or newer.
2. Copy `.env.example` to `.env`, replace the sample with your AssemblyAI key, and keep `.env` local. Do not put the key in browser code or commit it.
3. Run `npm start` and open `http://localhost:3000`.

The interface works without a key for manual review testing. Live voice requires an AssemblyAI account with Voice Agent API access and a browser microphone. The key is exchanged on the server for a single-use temporary token, and sessions are capped at five minutes. The demo token endpoint limits new sessions to four per IP per ten minutes and 30 overall per hour.

## Workflow

- Select a stop and start the voice report.
- Speak about what happened, how the customer was contacted, the response, and the next action.
- The agent calls `record_exception` to update a draft. It cannot approve the draft.
- Review the fields and the exact spoken quote, then approve the report.
- Reports are stored in this browser's local storage. They are not shared with other dispatchers or uploaded to a database.

## Verification

Run `npm test`. The tests cover missing facts, invalid categories, evidence matching, static serving, and the server-side token exchange. A live Edge session on September 23, 2026 verified transcription, follow-up questions, a `record_exception` tool call, draft population, and clean session ending. The rider's account contained conflicting facts; the draft needed human review, and the system prompt was then tightened to ask for clarification. The revised prompt and interruption handling have not been retested live.

## Submission checklist

- [x] Verify a live voice conversation, tool-created draft, and clean session end with an AssemblyAI key.
- [ ] Retest conflicting statements and interruption handling with the revised prompt.
- [ ] Test the hosted demo with a fresh browser and a second person.
- [x] Deploy `render.yaml` as a free Render service with `ASSEMBLYAI_API_KEY` stored as a Render secret. The file contains no key.
- [x] Use an MIT license.
- [x] Make the GitHub repository public and deploy the app to a public URL.
- [x] Create a five-slide pitch deck.
- [x] Create a 40-second, silent video presentation from the pitch slides.
- [ ] Record a live screen demo for stronger judging evidence.
- [x] Create the [RouteProof team](https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon/routeproof) on lablab.ai.
- [x] Submit the title, descriptions, tags, cover image, video, slides, repository, and application URL before September 30, 2026 at 6:00 PM EAT.

The visual concept and submission cover are in `design/routeproof-concept.png` and `design/routeproof-cover.png`. The five-slide pitch is `design/routeproof-pitch.pdf`; its source is `scripts/build_deck.py` (requires ReportLab only when regenerating the PDF). The submitted video presentation is `design/routeproof-video.mp4`.

Published entry: https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon/routeproof/routeproof. Hosted demo: https://routeproof-demo.onrender.com.
