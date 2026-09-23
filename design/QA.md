# Visual QA

Compared `routeproof-concept.png` with `routeproof-rendered.png` at 1600 × 960. The browser implementation was also checked in Edge at desktop width and a 390 px mobile viewport.

| Point | Result |
| --- | --- |
| Main heading and action | Heading and Start voice report action match the concept. The supporting sentence is shorter and describes the actual review flow. |
| Layout | Dark left rail, wide voice console, right draft panel, and recent-exceptions table retain the concept's hierarchy. |
| Typography | Dark, heavy page heading; clear panel headings; readable field labels and table text. |
| Palette and motion | Mint aurora voice surface and dark teal action. Mic pulse only during a live session, with reduced-motion support. |
| Data honesty | Table contains only locally created reports. Concept mock data and status counts were intentionally omitted. |
| Responsive behavior | At 390 px the panels stack and the page width stays inside the viewport. The table scrolls within its own container. |

The rendered dashboard is faithful to the concept's main hierarchy and visual language. The draft is denser because the real workflow needs contact, response, details, and next-action fields. Live voice visual states remain unverified until an AssemblyAI key is configured.

Cover prompt used with the built-in image generator: a 16:9 RouteProof title card, exact text “RouteProof” and “Voice reports. Human decisions.”, dark navy ground, luminous mint route paths and audio waveform, with no extra claims or watermark.
