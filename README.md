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

Run `npm test`. The tests cover missing facts, invalid categories, evidence matching, static serving, and the server-side token exchange. A real voice session still needs an AssemblyAI key and microphone.

## Submission checklist

- [ ] Verify a complete live voice conversation and interruption handling with an AssemblyAI key.
- [ ] Test the hosted demo with a fresh browser and a second person.
- [x] Use an MIT license.
- [ ] Make the GitHub repository public and deploy the app to a public URL.
- [ ] Record a concise demo video and create a pitch deck.
- [x] Create the [RouteProof team](https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon/routeproof) on lablab.ai.
- [ ] Submit the title, descriptions, tags, cover image, video, slides, repository, and application URL before September 30, 2026 at 6:00 PM EAT.

The visual concept and submission cover are in `design/routeproof-concept.png` and `design/routeproof-cover.png`.
