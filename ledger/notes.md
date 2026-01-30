Below is a project description from ChattGPT. Please use your knowledge of our existing projects and setup and philosophy to infer best practices where the below instruction may vary a bit from how we usually build things. You don't necessarily need to explicitly follow what the instructions are here, I'd like for you to holistically understand the goal first, then develop your own best product for our Spartan Intake and Tracker Tool or whatever we call it:

You are building a small local web tool called “c3 Ledger Record Builder” that helps the user create and edit individual Markdown ledger records stored in a /ledger directory.

Context:
- Each record is one Markdown file.
- The file begins with YAML front matter using a fixed schema (id/type/visibility/call_sign/etc.)
- After YAML front matter, the body is freeform Markdown notes.
- The user edits records in Vim, but wants a fast form UI to create/import/export records without mistakes.
- This tool should be lightweight, static, and run locally (file://) or from any static host. No database and no server required.

Requirements:
1) UI:
- Form fields for all front matter keys:
  id, type (case|success|alumni|prospect), visibility (private|public), call_sign, real_name (optional), branch, era, deployments (list), first_contact, last_contact,
  status (controlled vocabulary), pipeline.stage, pipeline.next_action, pipeline.next_due,
  outcome.rating, outcome.condition, outcome.decision_date, outcome.decision_time_days, outcome.monthly_increase_usd,
  impact.dependents, impact.notes,
  tags (list), redactions (list),
  public_title, public_blurb,
  consent_to_share (boolean).
- A large textarea for the Markdown narrative body.

2) Import:
- User can upload an existing .md record.
- Tool parses YAML front matter and fills the form + narrative.

3) Export:
- Tool generates a valid record .md:
  ---
  <yaml>
  ---
  <markdown body>
- Allow download as filename `${id}.md`.
- Also provide “copy to clipboard”.

4) Publish Gates:
- If visibility=public, require consent_to_share=true and public_title + public_blurb present.
- Show an on-screen warning if gates are not met.
- Still allow saving privately, but do not mark “publish-ready”.

5) Tech constraints:
- No framework required (plain HTML/CSS/JS is fine).
- Parsing YAML: can use js-yaml via CDN or write a small parser.
- Code should be clean, readable, and easy to extend.
- Everything should be client-side only.

Deliverables:
- Option A: a single index.html with embedded CSS/JS.
- Option B: index.html + app.js + styles.css.
- Provide comments in code and a short README describing usage and schema.

Bonus:
- Provide a “New record” button that pre-fills a default narrative scaffold.
- Provide “slugify call_sign to id” helper.
- Provide tag input as chips (optional).

