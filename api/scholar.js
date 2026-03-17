export default async function handler(req, res) {
  const { url } = req;
  
  // Extract query string
  const queryString = url.split('?')[1] || '';
  const targetUrl = `https://api.semanticscholar.org/graph/v1/paper/search?${queryString}`;
  
  const apiKey = process.env.VITE_SEMANTIC_API_KEY || process.env.SEMANTIC_API_KEY;
  const headers = {};
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  try {
    const response = await fetch(targetUrl, { headers });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Semantic Scholar Proxy Error:', error);
    return res.status(500).json({ error: 'Internal server error while calling Semantic Scholar' });
  }
}
