# op-postulate-chat — Cloudflare Worker

Tiny serverless proxy that holds an Amazon Bedrock bearer token and forwards
chat-completion requests from [the One Postulate site](https://rishistyping.github.io/ii-logos-one-postualte-interactive/)
to Bedrock Runtime's Converse API.
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
wrangler login                                  # opens browser; one-time
wrangler secret put AWS_BEARER_TOKEN_BEDROCK    # paste your Bedrock bearer token when prompted
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
anywhere), revoke it in AWS and create a new Bedrock bearer token, then
re-run:

```sh
wrangler secret put AWS_BEARER_TOKEN_BEDROCK
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

You should see a JSON response containing `response`, `content`, `message`,
and the raw Bedrock payload.

## Files

- [src/index.js](src/index.js) — the Worker handler (CORS, rate limit, Bedrock Converse proxy).
- [wrangler.toml](wrangler.toml) — deployment config.
- [.gitignore](.gitignore) — keeps `.dev.vars`, `node_modules`, etc. out of the repo.

## What it does

- `OPTIONS *` → CORS preflight, allows `https://rishistyping.github.io` and `localhost:8000`.
- `POST /chat` and `POST /fast` → forward `{messages, model?, temperature?, max_tokens?}` to Bedrock Converse and return a JSON envelope. Default model is `us.anthropic.claude-sonnet-4-6`.
- Per-IP token bucket: 12 req/min, burst 20. Adjust in `src/index.js` if needed.
- Caps request body at 256 KB and message count at 40.
