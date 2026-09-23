# RouteProof submission draft

This copy is ready to edit after a complete live voice test and hosted demo are verified. Do not submit the prototype as a working online voice agent until those checks pass.

## Step 1: Basic information

**Title:** RouteProof

**Short description (under 255 characters):** A rider talks through a failed delivery while still on the route. RouteProof asks for missing facts, turns the conversation into a reviewable exception, and leaves the final decision with a dispatcher.

**Long description (over 600 characters):**

Delivery teams lose time when a failed drop-off becomes a vague chat message: “customer not there,” with no clear record of what the rider tried or what dispatch should do next. RouteProof gives riders a hands-free way to report the exception while they are still at the stop. An AssemblyAI Voice Agent asks short follow-up questions about the issue, contact attempt, customer response, and suggested next step. Its tool call creates a structured draft, not an automatic decision. The interface shows the live conversation beside the draft so dispatch can catch mistakes before approving it. The app also checks whether a short evidence quote appears in the rider’s transcript and flags any quote it cannot match. A missing-facts gate stops an incomplete draft from being approved. The prototype uses sample Nairobi routes and saves reviewed reports in the browser. It is designed to show how voice can make field reporting faster without letting a speech recognition guess silently change a delivery record.

**Suggested categories:** Logistics; Productivity. Select the closest categories offered by lablab.ai.

**Technologies used:** AssemblyAI Voice Agent API, JavaScript, Node.js, Web Audio API. Add hosted platform only after deployment.

## Demo script (90 seconds)

1. Open RouteProof and select order RP-2048 at Greenwood Apartments.
2. Start a live voice report. Say: “I’m at the gate. I called the customer twice and got no answer.”
3. Let the agent ask for the next action. Say: “Have dispatch call them and agree on a new delivery window.”
4. Show the structured draft, missing-facts gate, and transcript evidence. Correct any field manually if the agent got it wrong.
5. Review and approve the exception. Show the saved row and Activity screen.
6. End with the practical point: a rider can report while moving, but a human controls the final record.

## Five-slide pitch deck

1. **The problem:** failed deliveries become incomplete messages that dispatch has to chase.
2. **The product:** a voice conversation turns a rider’s account into a draft exception.
3. **The workflow:** speak → clarify missing facts → review evidence → approve.
4. **The technology:** AssemblyAI Voice Agent API, JSON Schema tool call, browser audio, server-side temporary token.
5. **The value and next step:** faster exception handling, fewer unverified entries; test with a real delivery team and measure report completeness and time to resolution.

## Files and links still needed

- Cover image: `design/routeproof-cover.png`.
- Video presentation: `design/routeproof-video.mp4` (40-second silent slide walkthrough). The slide deck is `design/routeproof-pitch.pdf`.
- Public GitHub repository and hosted HTTPS demo URL. The designated repository is currently private.
- Confirmed live voice test with the user’s AssemblyAI account.
