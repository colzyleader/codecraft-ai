export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('{"error":"Method not allowed"}', { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return new Response('{"error":"No API key"}', { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const body = await req.text();

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: body,
    });
    const t = await r.text();
    return new Response(t, { status: r.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return new Response('{"content":[{"type":"text","text":"Server error. Try again."}]}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
