# Public Companion Playbook

Use this playbook before publishing each notable frontend iteration. It keeps the public-facing experience dependable across content, interaction, and reliability.

## 30-second smoke test

1. Serve the page:
   ```bash
   python3 -m http.server 8000
   ```
2. Open `http://127.0.0.1:8000/index.html`.
3. Open the chat drawer once, then type a short question.
4. Confirm the first response appears only after submit.

## User pathway checks

- First-touch clarity
  - Can a new reader find the chat affordance immediately?
  - Does a focused first response return within a short delay?
  - Is the answer concise and grounded in the paper text?
- Follow-up flow
  - Ask 2nd follow-up question.
  - Confirm conversation context remains coherent for direct Q&A.
- Review path
  - Ask for an explicit review-style prompt and verify it switches to deeper critique mode.

## UX polish checks

- Desktop
  - Hover and keyboard states are readable and stable.
  - The send action is obvious and not blocked by empty state logic.
  - Chat drawer width control remains usable.
- Mobile
  - Drawer opens comfortably full width.
  - Typography, formulas, and code blocks are legible.

## Reliability and resilience checks

- Cloud path
  - Verify request reaches the configured Worker endpoint in Network tab.
  - Verify status is not silently failing; user-visible state should update on errors.
- Fallback path
  - With temporary cloud disablement, confirm local fallback starts on first submission if device supports WebGPU.

## Latency visibility

- Track end-to-end request durations for at least 3 questions.
- Record:
  - network round-trip to `/chat`,
  - first token/rendered-word latency,
  - total answer completion.
- Note whether local fallback is faster/slower than cloud on target hardware and include in release notes.

## Release gate

Before sharing a public URL, verify:

- README links are valid and describe the current behavior accurately.
- No accidental mode changes (e.g., automatic review trigger still disabled).
- No syntax regressions from static file edits.
