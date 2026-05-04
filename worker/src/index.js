/**
 * op-postulate-chat — Cloudflare Worker proxy.
 *
 * Holds an Amazon Bedrock API key as an encrypted Worker secret and forwards
 * chat requests from the One Postulate site to Bedrock Runtime's Converse API.
 *
 * Endpoints:
 *   OPTIONS *      — CORS preflight
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
const MAX_MESSAGES = 40;
const MAX_BODY_BYTES = 256 * 1024;

const RATE_PER_MIN = 12;
const RATE_BURST = 20;
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
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function jsonResponse(status, payload, cors) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
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

function toBedrockPayload(body) {
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
    maxTokens: body.max_tokens ?? 2048,
  };
  if (typeof body.temperature === 'number') {
    inferenceConfig.temperature = body.temperature;
  }

  return {
    ...(system.length ? { system } : {}),
    messages,
    inferenceConfig,
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
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

    const upstream = await fetch(bedrockUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bedrockApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toBedrockPayload(body)),
    });

    const upstreamText = await upstream.text();
    let upstreamJson = null;
    try {
      upstreamJson = upstreamText ? JSON.parse(upstreamText) : null;
    } catch (_) {}

    if (!upstream.ok) {
      return jsonError(upstream.status, 'bedrock-request-failed', cors, upstreamJson || upstreamText);
    }

    const content = extractBedrockText(upstreamJson);
    if (!content) {
      return jsonError(502, 'bedrock-empty-response', cors, upstreamJson);
    }

    return jsonResponse(200, {
      response: content,
      content,
      message: content,
      raw: upstreamJson,
    }, cors);
  },
};
