export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  try {
    // Vercel edge functions might not parse body sometimes, so we stringify whatever is in req.body
    const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: bodyStr,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('OpenAI Proxy Error:', error);
    return res.status(500).json({ error: 'Internal server error while calling OpenAI' });
  }
}
