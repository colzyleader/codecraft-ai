export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('{"error":"Method not allowed"}', { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_KEY) {
    return new Response('{"error":"Stripe not configured"}', { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { priceId, email } = await req.json();
    const origin = req.headers.get('origin') || 'https://codecraft-ai.vercel.app';

    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('success_url', origin + '/?session_id={CHECKOUT_SESSION_ID}&plan=success');
    params.append('cancel_url', origin + '/?plan=canceled');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    if (email) params.append('customer_email', email);

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + STRIPE_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await r.json();

    if (session.error) {
      return new Response(JSON.stringify({ error: session.error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
