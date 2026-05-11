# One Postulate · Public Companion

One Postulate now ships as a **public paper companion**: a lightweight, interactive web page that lets you read the paper and ask questions about it through a built-in chat panel.

- **Live companion**: [https://rishistyping.github.io/ii-logos-one-postualte-interactive/](https://rishistyping.github.io/ii-logos-one-postualte-interactive/)
- **Source repository**: [https://github.com/rishistyping/ii-logos-one-postualte-interactive](https://github.com/rishistyping/ii-logos-one-postualte-interactive)
- **Paper text**: `paper/one-postulate.txt`
- **Chat worker**: `https://op-postulate-chat.rishresearch000.workers.dev/chat`
- **Companion playbook**: [PUBLIC-COMPANION-PLAYBOOK.md](PUBLIC-COMPANION-PLAYBOOK.md)

## What this companion is

This repository hosts an interactive companion for the paper *One Postulate*. It combines:

- A responsive reader article section with rich typographic layout.
- A right-side chat drawer for follow-up questions.
- Math rendering with KaTeX (including inline and display formulas).
- A dual-path chat architecture:
  - **Cloud first** (default): request goes to a Cloudflare Worker that proxies to Bedrock.
  - **Local fallback**: `web-llm` only starts if cloud is unavailable.

The companion is intentionally designed as a **public-reader first** tool: concise, grounded answers by default, with an explicit review flow available for deeper critiques.

## How to use it (new visitor)

1. Open the public page.
2. Click the floating **Ask** button in the lower-right.
3. Type a question and hit **Enter** (or click Send).
4. The companion responds directly from paper context first, with focused answers.
5. For a full structured review, ask for an explicit review-style prompt.

### Good starter prompts

- `What is the key idea of this paper in 120 words?`
- `Can you explain the core theorem in simple terms?`
- `Where are the weakest assumptions in the derivation?`
- `Please run a detailed review of section 2.`

## Chat behavior at a glance

- **No automatic review on open** — chat waits for user input.
- **Auto-paper context preloaded on load** (downloaded text only; no model call).
- **Markdown + math rendering**: links, bullets, formulas, and code blocks are rendered in-chat.
- **Fallback path**: if cloud chat fails, local model boot is attempted for continuity.

## For contributors and maintainers

### Repository layout

- `index.html` — full single-file companion site.
- `paper/` — source paper text used for context.
- `worker/` — Cloudflare Worker that brokers the cloud chat API.
- `inline-*.css`, `inline-*.js` — extracted inline blocks from the deployed page.
- `one_postulate_enhanced.html` and derived files — compatibility/export variants.

### Local run

```bash
cd /path/to/ii-logos-one-postualte-interactive
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000/index.html`.

### Public-facing improvement map

- Keep responses concise by default; escalate to review only when requested.
- Improve discoverability by preserving clear first-touch pathways in README and UI.
- Preserve trust boundaries:
  - no model runs before explicit user request,
  - no hidden inference calls before the user starts chat,
  - graceful error messaging if cloud/local paths are unavailable.

## Technical notes

- `CHAT_API_URL` is currently hardcoded in `index.html`.
- In the current deployment, it points to:
  `https://op-postulate-chat.rishresearch000.workers.dev/chat`.
- The companion supports direct browser usage and avoids build tooling; everything runs from static assets.

## Development priorities

1. **Public clarity**: keep onboarding frictionless for first-time readers.
2. **Reliability**: retain cloud-first behavior while hardening local fallback.
3. **Latency visibility**: continue measuring and improving response pacing/end-to-end path.
4. **Accessibility polish**: small interaction refinements with broader input-mode support.
5. **Traceability**: keep all worker paths and prompt modes explicit in docs.

If you want, we can also add a dedicated `docs/public-companion-playbook.md` with a richer QA script, screenshots, and acceptance checks for non-developers.
