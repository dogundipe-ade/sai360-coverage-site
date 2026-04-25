# Claude.ai context pack — how to use

This folder gives Claude.ai the context it needs to help you draft sales
collateral (emails, one-pagers, battle cards, talk tracks, objection
handlers, pitch deck copy, etc.) without you having to re-explain SAI360
every conversation.

## What's in here

| File | Purpose |
|---|---|
| `claude-ai-context.md` | The full context pack. Upload this to your Claude.ai Project as a file. |
| `project-instructions.txt` | Short-form instructions. Paste this into the Project's "Custom instructions" field. |
| `README.md` | This file. |

## Step-by-step setup (one-time, 5 minutes)

1. Go to **[claude.ai](https://claude.ai)** and sign in.
2. In the left sidebar, click **Projects** → **New project**.
3. Name it something like **"SAI360 Sales Collateral"**.
4. In the project:
   - **Project instructions** (the big text field): open
     `project-instructions.txt`, select all, copy, paste it in, save.
   - **Project knowledge** (the file upload area): upload
     `claude-ai-context.md`.
5. Done. You're ready to chat.

## How to use it day-to-day

Open the Project, start a new chat, and just describe what you need. Some
examples that work well:

> "Draft a one-page PDF for a regional US bank CCO. 3 sections: what we
> cover, why it matters, pricing. Include a pull-quote placeholder."

> "Write 5 cold-outreach email variants targeting global asset managers.
> Each 80 words max, each with a different hook."

> "Write a 10-slide pitch deck outline for an enterprise discovery call.
> Bullet points per slide, no prose."

> "Give me a battle card for competing against [competitor]. Include
> pricing differences, coverage differences, integration differences.
> Flag anything I need to verify with product marketing."

> "Draft a 20-minute demo talk track. Assume the buyer is an EMEA insurer
> CRO who's already evaluated one other vendor."

## Keeping it fresh

Every few months, or when coverage numbers shift meaningfully:

1. From the project root, run `npm run build-data` to regenerate counts.
2. Open `sales/claude-ai-context.md` and update the numbers in sections 2
   and 3 if they've drifted.
3. In Claude.ai, delete the old uploaded file from the project and
   re-upload the new version.

## Before sharing collateral externally

The context pack has `[FILL IN: ...]` placeholders for things only SAI360
internal teams can confirm — competitive positioning, SLA numbers,
certifications, trial terms, etc. Anything Claude generates that relies
on those will either be flagged in the draft, or be a reasonable guess
that you should verify with product marketing before it goes to a
prospect.

**Rule of thumb:** numbers and names unique to SAI360 need a human eye
before sending.
