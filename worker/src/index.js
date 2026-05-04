/**
 * op-postulate-chat — Cloudflare Worker proxy.
 *
 * Holds the OpenRouter API key as an encrypted Worker secret and forwards
 * chat-completion requests from the One Postulate site. Streams the
 * upstream SSE response straight back to the browser so the model's reply
 * arrives token-by-token.
 *
 * Endpoints:
 *   OPTIONS *      — CORS preflight
 *   POST    /chat  — { messages, model?, temperature?, max_tokens? } → SSE
 *
 * Secrets:
 *   OPENROUTER_API_KEY — set via `wrangler secret put OPENROUTER_API_KEY`
 *
 * NOTE: never commit the API key. It only ever lives in Cloudflare's
 *       encrypted secret store, accessed at runtime via `env`.
 */

const ALLOWED_ORIGINS = [
  'https://rishistyping.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL  = 'openai/gpt-oss-120b';
const MAX_MESSAGES   = 40;            // sanity cap on conversation length
const MAX_BODY_BYTES = 256 * 1024;    // 256 KB request body cap

/**
 * Per-isolate token bucket. Cloudflare may run multiple isolates per
 * deployment, so this is best-effort, not a global rate limit. Good enough
 * to deter casual abuse; pair with Cloudflare's edge rate-limit rule for
 * real protection if the page goes viral.
 */
const RATE_PER_MIN = 12;
const RATE_BURST   = 20;
const ipBuckets = new Map();

function checkRate(ip) {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) || { tokens: RATE_BURST, last: now };
  const elapsedMin = (now - bucket.last) / 60_000;
  bucket.tokens = Math.min(RATE_BURST, bucket.tokens + elapsedMin * RATE_PER_MIN);
  bucket.last = now;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  ipBuckets.set(ip, bucket);
  return true;
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function jsonError(status, message, cors) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url    = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors   = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (url.pathname !== '/chat') {
      return jsonError(404, 'not-found', cors);
    }

    if (request.method !== 'POST') {
      return jsonError(405, 'use-POST', cors);
    }

    if (!env.OPENROUTER_API_KEY) {
      return jsonError(500, 'OPENROUTER_API_KEY not configured', cors);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRate(ip)) {
      return jsonError(429, 'rate-limited', cors);
    }

    let body;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) {
        return jsonError(413, 'payload-too-large', cors);
      }
      body = JSON.parse(raw);
    } catch (_) {
      return jsonError(400, 'invalid-json', cors);
    }

    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return jsonError(400, 'messages-invalid', cors);
    }

    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  'https://rishistyping.github.io/ii-logos-one-postualte-interactive/',
        'X-Title':       'One Postulate',
      },
      body: JSON.stringify({
        model:       body.model       || DEFAULT_MODEL,
        messages,
        temperature: body.temperature ?? 0.4,
        max_tokens:  body.max_tokens  ?? 2048,
        stream:      true,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: { ...cors, 'Content-Type': upstream.headers.get('Content-Type') || 'text/plain' },
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...cors,
        'Content-Type':   'text/event-stream',
        'Cache-Control':  'no-cache, no-transform',
        'Connection':     'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  },
};
