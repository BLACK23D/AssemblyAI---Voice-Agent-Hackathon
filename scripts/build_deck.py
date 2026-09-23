"""Generate the RouteProof hackathon pitch as a 16:9 PDF."""
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "design" / "routeproof-pitch.pdf"
W, H = 960, 540
NAVY = HexColor("#091923")
PANEL = HexColor("#122a32")
MINT = HexColor("#bafa82")
WHITE = HexColor("#f4f7f4")
MUTED = HexColor("#9eb5b3")


def base(c, number, kicker, title):
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(MINT)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(54, 487, kicker.upper())
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 35)
    c.drawString(54, 429, title)
    c.setStrokeColor(HexColor("#2c4950"))
    c.line(54, 74, 906, 74)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 11)
    c.drawString(54, 49, "ROUTEPROOF  /  ASSEMBLYAI VOICE AGENT HACKATHON")
    c.drawRightString(906, 49, f"{number:02d} / 05")


def text(c, x, y, lines, size=21, color=WHITE, leading=32, bold=False):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading


def card(c, x, y, w, h, label, lines):
    c.setFillColor(PANEL)
    c.roundRect(x, y, w, h, 14, fill=1, stroke=0)
    text(c, x + 25, y + h - 45, [label], 14, MINT, bold=True)
    text(c, x + 25, y + h - 88, lines, 20, WHITE, 30)


c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
c.setTitle("RouteProof | Voice reports. Human decisions.")
c.setAuthor("RouteProof")

# 1 - cover
c.drawImage(str(ROOT / "design" / "routeproof-cover.png"), 0, 0, width=W, height=H)
c.showPage()

# 2 - problem
base(c, 2, "The problem", "A failed delivery becomes a vague message.")
card(c, 54, 185, 405, 190, "ON THE ROUTE", ["The rider sends:", '"Customer not there."'])
card(c, 480, 185, 426, 190, "AT DISPATCH", ["What happened? Was there a call?", "What did the customer say?", "What should happen next?"])
text(c, 54, 122, ["The missing details delay the decision and weaken the record."], 18, MUTED)
c.showPage()

# 3 - product
base(c, 3, "The product", "A voice report that asks for the missing facts.")
for i, (label, lines) in enumerate([
    ("01  SPEAK", ["Rider reports the issue", "at the stop."]),
    ("02  CLARIFY", ["Agent asks one short", "follow-up at a time."]),
    ("03  REVIEW", ["Dispatcher checks the", "draft and approves."]),
]):
    card(c, 54 + i * 290, 174, 270, 208, label, lines)
text(c, 54, 121, ["A quote is flagged when it cannot be matched to the spoken transcript."], 18, MUTED)
c.showPage()

# 4 - technology
base(c, 4, "The technology", "AssemblyAI drives the live conversation.")
card(c, 54, 199, 270, 177, "BROWSER", ["Microphone + 24 kHz audio", "Live transcript and draft"])
card(c, 345, 199, 270, 177, "ASSEMBLYAI", ["Voice Agent API", "record_exception tool call"])
card(c, 636, 199, 270, 177, "SERVER", ["Short-lived session token", "API key kept off the page"])
text(c, 54, 142, ["The tool writes a draft. Approval stays with the human reviewer."], 19, MINT)
text(c, 54, 111, ["Prototype: sample routes, browser-local records, five-minute voice sessions."], 16, MUTED)
c.showPage()

# 5 - value
base(c, 5, "Value and next step", "Make exceptions complete at first report.")
card(c, 54, 191, 405, 180, "VALUE TO TEST", ["Less back-and-forth for dispatch", "Clearer contact and next action", "A reviewable record"])
card(c, 480, 191, 426, 180, "PILOT MEASURES", ["Report completeness", "Time to resolution", "Corrections during review"])
text(c, 54, 126, ["Start with one delivery team. Measure the workflow before making claims."], 18, MUTED)
c.showPage()
c.save()
print(OUT)
