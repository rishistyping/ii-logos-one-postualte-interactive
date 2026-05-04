# op-postulate-chat — Cloudflare Worker

Tiny serverless proxy that holds the OpenRouter API key and forwards
chat-completion requests from [the One Postulate site](https://rishistyping.github.io/ii-logos-one-postualte-interactive/).
The browser never sees the key; CORS is locked to the site's origins.

## One-time setup

You need a Cloudflare account (free tier is enough) and a working
`wrangler` CLI. Install if needed:

```sh
npm install -g wrangler
```

## Deploy

```sh
cd worker
wrangler login                         # opens browser; one-time
wrangler secret put OPENROUTER_API_KEY  # paste your sk-or-v1-... key when prompted
wrangler deploy
```

The deploy output prints the URL, e.g.:

```
https://op-postulate-chat.<your-subdomain>.workers.dev
```

After the first deploy, share that URL — it goes into `index.html` as the
`CHAT_API_URL` constant.

## Rotate the key

If a key has been exposed (e.g. shared in chat or pasted in plaintext
anywhere), revoke it on https://openrouter.ai/keys and create a new one,
then re-run:

```sh
wrangler secret put OPENROUTER_API_KEY
```

(no redeploy needed; secrets propagate within ~10 s.)

## Verify locally

```sh
wrangler dev
# in another shell
curl -X POST http://localhost:8787/chat \
  -H 'Origin: http://localhost:8000' \
  -H 'Content-Type: application/json' \
  --data '{"messages":[{"role":"user","content":"ping"}]}'
```

You should see SSE chunks streaming back.

## Files

- [src/index.js](src/index.js) — the Worker handler (CORS, rate limit, SSE pass-through).
- [wrangler.toml](wrangler.toml) — deployment config.
- [.gitignore](.gitignore) — keeps `.dev.vars`, `node_modules`, etc. out of the repo.

## What it does

- `OPTIONS *` → CORS preflight, allows `https://rishistyping.github.io` and `localhost:8000`.
- `POST /chat` → forwards `{messages, model?, temperature?, max_tokens?}` to OpenRouter, streams the SSE response back. Default model is `openai/gpt-oss-120b`.
- Per-IP token bucket: 12 req/min, burst 20. Adjust in `src/index.js` if needed.
- Caps request body at 256 KB and message count at 40.
