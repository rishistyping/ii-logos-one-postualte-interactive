/**
 * op-postulate-chat — Cloudflare Worker proxy.
 *
 * Holds an Amazon Bedrock API key as an encrypted Worker secret and forwards
 * chat requests from the One Postulate site to Bedrock Runtime's Converse API.
 *
 * Endpoints:
 *   OPTIONS *      — CORS preflight
 *   GET     /health — deployment/config smoke check
 *   POST    /chat  — { messages, model?, temperature?, max_tokens? } → JSON
 *   POST    /fast  — same as /chat, kept as an alias
 *
 * Secrets:
 *   ANTHROPIC_API_KEY        — existing secret slot; value should be a Bedrock API key
 *   AWS_BEARER_TOKEN_BEDROCK — optional preferred secret name for the same value
 */

const ALLOWED_ORIGINS = [
  'https://rishistyping.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

const DEFAULT_REGION = 'us-east-1';
const DEFAULT_MODEL = 'us.anthropic.claude-sonnet-4-6';
const DEFAULT_LATENCY = 'optimized';
const MAX_MESSAGES = 40;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_TOKENS_DEFAULT = 2048;
const MAX_TOKENS_LIMIT = 4096;
const REQUEST_TIMEOUT_MS = 55_000;
const RETRY_DELAY_MS = 220;

const RATE_PER_MIN = 12;
const RATE_BURST = 20;
const ipBuckets = new Map();
const latencySupport = new Map();
let rateChecks = 0;

function checkRate(ip) {
  const now = Date.now();
  if (++rateChecks % 500 === 0) {
    for (const [key, value] of ipBuckets) {
      if (now - value.last > 10 * 60_000) ipBuckets.delete(key);
    }
  }
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
  const allowed = ALLOWED_ORIGINS.includes(origin) || origin === 'null'
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(status, payload, cors) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function jsonError(status, message, cors, details) {
  return jsonResponse(status, details ? { error: message, details } : { error: message }, cors);
}

function textFromContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(part => typeof part === 'string' ? part : part?.text || '')
      .filter(Boolean)
      .join('\n');
  }
  return content == null ? '' : String(content);
}

function resolveModel(model, env) {
  if (env.BEDROCK_MODEL_ID) return env.BEDROCK_MODEL_ID;
  if (!model || model === 'claude-sonnet-4-6') return DEFAULT_MODEL;
  if (model.startsWith('us.') || model.startsWith('anthropic.') || model.startsWith('arn:')) return model;
  return DEFAULT_MODEL;
}

function clampNumber(value, fallback, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldRetry(status) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function shouldRetryWithoutLatency(status, payload) {
  if (status < 400 || !payload) return false;
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return /performanceConfig|latency|optimized/i.test(text);
}

function resolveLatency(body, env, pathname) {
  const requested = body.performance_latency || body.latency || env.BEDROCK_LATENCY || DEFAULT_LATENCY;
  if (requested === 'standard' || requested === 'optimized') return requested;
  return pathname === '/fast' ? 'optimized' : DEFAULT_LATENCY;
}

function toBedrockPayload(body, options = {}) {
  const system = [];
  const messages = [];

  for (const message of body.messages) {
    const role = message?.role;
    const content = textFromContent(message?.content).trim();
    if (!content) continue;

    if (role === 'system') {
      system.push({ text: content });
      continue;
    }

    const bedrockRole = role === 'assistant' ? 'assistant' : 'user';
    const previous = messages[messages.length - 1];
    if (previous && previous.role === bedrockRole) {
      previous.content[0].text += '\n\n' + content;
    } else {
      messages.push({ role: bedrockRole, content: [{ text: content }] });
    }
  }

  if (!messages.length || messages[0].role !== 'user') {
    messages.unshift({
      role: 'user',
      content: [{ text: 'Please respond using the provided paper context.' }],
    });
  }

  const inferenceConfig = {
    maxTokens: clampNumber(body.max_tokens, MAX_TOKENS_DEFAULT, 1, MAX_TOKENS_LIMIT),
  };
  if (typeof body.temperature === 'number') {
    inferenceConfig.temperature = clampNumber(body.temperature, 0.4, 0, 1);
  }
  if (typeof body.top_p === 'number') {
    inferenceConfig.topP = clampNumber(body.top_p, 0.95, 0, 1);
  }

  return {
    ...(system.length ? { system } : {}),
    messages,
    inferenceConfig,
    ...(options.latency ? { performanceConfig: { latency: options.latency } } : {}),
  };
}

function extractBedrockText(payload) {
  const content = payload?.output?.message?.content;
  if (!Array.isArray(content)) return '';
  return content
    .map(part => part?.text || '')
    .filter(Boolean)
    .join('\n');
}

async function callBedrock(bedrockUrl, bedrockApiKey, payload) {
  const started = Date.now();
  const upstream = await fetch(bedrockUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${bedrockApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const upstreamText = await upstream.text();
  let upstreamJson = null;
  try {
    upstreamJson = upstreamText ? JSON.parse(upstreamText) : null;
  } catch (_) {}

  return {
    upstream,
    upstreamJson,
    upstreamText,
    elapsedMs: Date.now() - started,
  };
}

export default {
  async fetch(request, env) {
    const started = Date.now();
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse(200, {
        ok: true,
        model: env.BEDROCK_MODEL_ID || DEFAULT_MODEL,
        region: env.BEDROCK_REGION || DEFAULT_REGION,
        latency: env.BEDROCK_LATENCY || DEFAULT_LATENCY,
      }, cors);
    }

    if (url.pathname !== '/chat' && url.pathname !== '/fast') {
      return jsonError(404, 'not-found', cors);
    }

    if (request.method !== 'POST') {
      return jsonError(405, 'use-POST', cors);
    }

    const bedrockApiKey = env.AWS_BEARER_TOKEN_BEDROCK || env.ANTHROPIC_API_KEY;
    if (!bedrockApiKey) {
      return jsonError(500, 'Bedrock API key not configured', cors);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRate(ip)) {
      return jsonError(429, 'rate-limited', cors);
    }

    let body;
    try {
      const declaredLength = Number(request.headers.get('Content-Length') || 0);
      if (declaredLength > MAX_BODY_BYTES) {
        return jsonError(413, 'payload-too-large', cors);
      }
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

    const region = env.BEDROCK_REGION || DEFAULT_REGION;
    const modelId = resolveModel(body.model, env);
    const bedrockUrl = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/converse`;
    const requestedLatency = resolveLatency(body, env, url.pathname);
    const latencyKey = `${region}:${modelId}:${requestedLatency}`;
    const latency = requestedLatency === 'optimized' && latencySupport.get(latencyKey) === false
      ? null
      : requestedLatency;

    let result;
    let usedLatency = latency || 'standard';
    try {
      result = await callBedrock(bedrockUrl, bedrockApiKey, toBedrockPayload(body, { latency }));
      if (!result.upstream.ok && shouldRetryWithoutLatency(result.upstream.status, result.upstreamJson || result.upstreamText)) {
        latencySupport.set(latencyKey, false);
        usedLatency = 'standard';
        result = await callBedrock(bedrockUrl, bedrockApiKey, toBedrockPayload(body, { latency: null }));
      } else if (!result.upstream.ok && shouldRetry(result.upstream.status)) {
        await sleep(RETRY_DELAY_MS);
        result = await callBedrock(bedrockUrl, bedrockApiKey, toBedrockPayload(body, { latency }));
      }
    } catch (err) {
      const message = err?.name === 'TimeoutError' || err?.name === 'AbortError'
        ? 'bedrock-timeout'
        : 'bedrock-network-error';
      return jsonError(504, message, cors);
    }

    if (!result.upstream.ok) {
      return jsonError(result.upstream.status, 'bedrock-request-failed', cors, result.upstreamJson || result.upstreamText);
    }
    if (latency === 'optimized') latencySupport.set(latencyKey, true);

    const content = extractBedrockText(result.upstreamJson);
    if (!content) {
      return jsonError(502, 'bedrock-empty-response', cors, result.upstreamJson);
    }

    return jsonResponse(200, {
      response: content,
      content,
      message: content,
      metrics: {
        totalMs: Date.now() - started,
        upstreamMs: result.elapsedMs,
        bedrockLatencyMs: result.upstreamJson?.metrics?.latencyMs ?? null,
        latency: result.upstreamJson?.performanceConfig?.latency || usedLatency,
      },
      usage: result.upstreamJson?.usage || null,
      stopReason: result.upstreamJson?.stopReason || null,
      raw: result.upstreamJson,
    }, cors);
  },
};
