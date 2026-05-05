# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A self-contained, single-page interactive companion to the *One Postulate* research note (Emad Mostaque, Intelligent Internet, April 2026). The user-facing site is `index.html` — a long editorial document with KaTeX equations, custom SVG diagrams, an interactive κ-dial / velocity-addition lab, an executable SymPy notebook running entirely in the browser via Pyodide, and a "chat with the paper" drawer.

A small Cloudflare Worker (`worker/`) sits in front of Amazon Bedrock (Claude Sonnet via Converse) so the chat path can use a hosted model without exposing a key in the browser. The frontend falls back to in-browser web-llm (Llama 3.2 1B via WebGPU) if the Worker is unreachable or disabled.

## Repository layout

- `index.html` — the live, deployed page. **This is the source of truth.** It contains all CSS in `<style>` and all JS in inline `<script>` blocks; there is no build step.
- `paper/one-postulate.txt` — paper text loaded at runtime to seed both system prompts (review and Q&A).
- `paper/one-postulate.pdf` — bundled PDF; the "Read the paper" CTA links to it via `cdn.jsdelivr.net/gh/...`.
- `worker/` — Cloudflare Worker proxy (Bedrock Converse + CORS + per-IP rate limit).
- `ii-DESIGN.md` — design system spec (palette, typography, components). Treat as a hard constraint when changing visual code.
- `inline-1.css` … `inline-3.css`, `inline-1.js` … `inline-6.js`, `external-assets.txt`, `headers.txt` — split-out artifacts of an earlier extraction. **Do not edit these to change the site**; only `index.html` is rendered. They're useful as a smaller-grained mirror of what's inlined.
- `one_postulate_enhanced.html`, `web-polish-studio-single.html`, `web-polish-studio-self-contained.html` — historical snapshots from the original Replit deployment, kept for reference. Not the live page.

The deployed URL is `https://rishistyping.github.io/ii-logos-one-postualte-interactive/` (GitHub Pages serves the repo root).

## Common commands

There is no package manager, bundler, lint, or test suite at the repo root — `index.html` is shipped as-is. To work on the page:

```sh
# Local preview (any static server works; port 8000 matches the Worker's CORS allowlist).
python3 -m http.server 8000
# then open http://localhost:8000/
```

The Worker has its own dev workflow under `worker/`:

```sh
cd worker
wrangler login                                  # one-time
wrangler secret put AWS_BEARER_TOKEN_BEDROCK    # paste Bedrock bearer token
wrangler deploy                                 # → https://op-postulate-chat.<subdomain>.workers.dev
wrangler dev                                    # local at http://localhost:8787
curl https://op-postulate-chat.rishresearch000.workers.dev/health   # smoke check
```

After a fresh Worker deploy, update `CHAT_API_URL` in `index.html` (search for the constant) to point at the new Worker URL.

## Architecture notes that span multiple files / sections

### Single-file frontend, two render-blocking concerns
`index.html` parses ~7400 lines top-to-bottom. Two rules are load-bearing:

1. **All interactive bootstrap is inside `DOMContentLoaded`** in the late `<script>` block (≈ line 5055 onward). This includes the κ-dial, velocity adder, Killing-form grid animation, scrollspy, theme toggle, and SymPy notebook controls. Don't query elements outside that handler — they may not exist yet during parse.
2. **External libs are `defer`-loaded from CDN**: KaTeX, KaTeX auto-render, marked, DOMPurify (top of `<head>`). KaTeX renders on-demand per section via an `IntersectionObserver` (≈ line 5075) — a section is re-observed until KaTeX has actually loaded, so first-paint isn't blocked by math.

### Theme is set before paint
A pre-CSS inline script (≈ line 33) reads `localStorage['ii-theme']` and `prefers-color-scheme` and sets `data-theme` on `<html>` *before* CSS resolves variables. Don't move this; it prevents a light/dark flash. Color tokens come from `--primary` etc. on `:root` and the `html[data-theme="dark"]` block (≈ line 196).

### Pyodide is lazy by design
Pyodide (~10 MB) is **not** loaded with the page. A stub in `<head>` (≈ line 69) defines `window.loadPyodideLazily()`, which:
- Injects the Pyodide `<script>` only on first call.
- Loads the `sympy` package.
- Installs Python helpers `show(label, value, mode)` and `reset_outputs()` that the seven notebook cells use to emit `{kind: "tex"|"text", label, value}` rows.

The notebook UI (≈ line 5530+) maps each `<article class="cell">` to its `<pre contenteditable>` source, calls `runPythonAsync`, drains `_outputs` from Python, and renders TeX rows through KaTeX. `runAllBtn` runs the seven cells sequentially. **Editing a cell's Python is supported as a feature** — `extractCode` flattens the contenteditable DOM (browsers inject `<br>` and `<div>` on edit) before sending to Python.

### Chat drawer: cloud-first, web-llm fallback
The chat path is in the final `<script>` block (≈ line 6860+):

- **System prompts** (`buildReviewSystemPrompt`, `buildQaSystemPrompt`) embed the entire paper text. The page fetches `paper/one-postulate.txt` once via `preloadPaperContext()` and caches both prompts. The "review" prompt enforces verbatim-quote rules before docking points.
- **`streamChat(messages, opts)`** tries `chatViaApi` (Worker → Bedrock) first; on any error, it falls back to `boot()` which lazy-imports `@mlc-ai/web-llm` from `esm.run` and downloads `Llama-3.2-1B-Instruct-q4f16_1-MLC` (~700 MB, cached). web-llm requires WebGPU.
- The Worker returns a JSON envelope (`{response, content, message, raw, usage, metrics, ...}`); the client also handles a legacy `text/event-stream` shape for forward compatibility.
- `CHAT_API_URL` set to empty string disables the cloud path entirely and forces web-llm.

### Worker (`worker/src/index.js`)
- Endpoints: `OPTIONS *` (CORS), `GET /health`, `POST /chat`, `POST /fast` (alias). 404 elsewhere.
- CORS allowlist: `https://rishistyping.github.io`, `http://localhost:8000`, `http://127.0.0.1:8000`, plus `Origin: null` for `file://`. To preview from another origin, add it to `ALLOWED_ORIGINS`.
- Secret is read as `AWS_BEARER_TOKEN_BEDROCK` (preferred) or `ANTHROPIC_API_KEY` (legacy slot — value is still a Bedrock bearer token, not an Anthropic API key).
- Translates OpenAI-style `{messages, model, temperature, max_tokens}` to Bedrock Converse `{system, messages, inferenceConfig, performanceConfig}`. Adjacent same-role messages are merged, and the conversation is forced to start with a `user` turn.
- Adds `performanceConfig.latency = "optimized"` by default; if Bedrock rejects it for a given model/region, the result is cached in `latencySupport` and that key falls back to standard latency.
- Per-IP token bucket: 12 req/min, burst 20. Caps: 256 KB body, 40 messages, 4096 max output tokens.

### Visual / motion conventions
The site is intentionally text-forward and editorial. When changing visual code:
- Honor the palette and type ramp in `ii-DESIGN.md` — italic accents in serif headlines (`em` colored `var(--accent)`), pill buttons, the corner-cross frame motif, cream surfaces, navy ink. Don't introduce new saturated colors.
- Reveal-on-scroll uses `.reveal` / `.reveal-stagger` classes observed by the same `IntersectionObserver` that triggers KaTeX render. Add the class to opt in; staggered children get sequential `transition-delay` up to the 8th child.
- Section IDs (`#abstract`, `#postulate`, `#determines`, `#killing`, `#verdicts`, `#lab`, `#proof`, `#conclusion`, `#references`) are linked from the nav, footer, and OG metadata. Renaming one means updating all three.

## Conventions worth preserving

- **No build step.** Don't introduce a bundler, npm at the repo root, or split `index.html` into modules unless explicitly asked. The split-out `inline-*.{css,js}` files are extraction artifacts, not a module system.
- **Math delimiters** are `\(...\)` / `\[...\]`, not `$...$` (see commit `5bfa8b9`). KaTeX auto-render is configured for those delimiters.
- **Branch policy:** develop on the branch named in the harness instructions; never push to `main` directly.
- **Don't commit secrets.** The Worker key lives only as a `wrangler secret`. `worker/.gitignore` already excludes `.dev.vars`.
