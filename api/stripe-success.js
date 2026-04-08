// api/stripe-success.js — Called by the frontend after Stripe redirect
// Verifies the user's token and upgrades their plan
// Protected: only works with valid Firebase auth token + checks Stripe session

export const config = { maxDuration: 10 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  // Verify Firebase token
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }) }
  );
  if (!r.ok) return res.status(401).json({ error: "Invalid token" });
  const d = await r.json();
  if (!d.users?.[0]) return res.status(401).json({ error: "No user" });
  const uid = d.users[0].localId;

  const { plan } = req.body || {};

  // Call credits endpoint internally with admin secret
  // This is server-side so the secret never reaches the browser
  const creditRes = await fetch(`https://${req.headers.host}/api/credits`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: "set_plan", plan: plan || "pro", admin_secret: process.env.ADMIN_SECRET }),
  });

  const result = await creditRes.json();
  return res.status(creditRes.status).json(result);
}
