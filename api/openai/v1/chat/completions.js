// Serverless proxy to the OpenAI Chat Completions API.
// The API key stays on the server. To limit abuse, the proxy only forwards
// requests that match what the app actually sends: one model, a capped
// response size and a bounded input.

const ALLOWED_MODEL = 'gpt-4o-mini';
const MAX_OUTPUT_TOKENS = 3000;
const MAX_MESSAGES = 30;
const MAX_INPUT_CHARS = 60000;
const ALLOWED_ROLES = new Set(['system', 'user', 'assistant']);

function parseBody(body) {
  if (!body) return null;
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return null; }
  }
  return body;
}

// Returns a sanitized payload, or an error message if the request is not allowed.
function sanitize(body) {
  const { messages, temperature, max_tokens, response_format } = body;

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return { error: 'Invalid messages' };
  }

  let totalChars = 0;
  for (const m of messages) {
    if (!m || !ALLOWED_ROLES.has(m.role) || typeof m.content !== 'string') {
      return { error: 'Invalid message format' };
    }
    totalChars += m.content.length;
  }
  if (totalChars > MAX_INPUT_CHARS) {
    return { error: 'Input too long' };
  }

  const payload = {
    model: ALLOWED_MODEL,
    messages: messages.map(({ role, content }) => ({ role, content })),
    max_tokens: Math.min(Number(max_tokens) || MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS),
  };
  if (typeof temperature === 'number') {
    payload.temperature = Math.min(Math.max(temperature, 0), 1);
  }
  if (response_format?.type === 'json_object') {
    payload.response_format = { type: 'json_object' };
  }
  return { payload };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  const body = parseBody(req.body);
  if (!body) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { payload, error } = sanitize(body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('OpenAI Proxy Error:', err);
    return res.status(500).json({ error: 'Internal server error while calling OpenAI' });
  }
}
