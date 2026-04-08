export const config = { maxDuration: 10 };

const PLANS = {
  free:    { credits: 10, daily: 3 },
  starter: { credits: 100, daily: 0 },
  pro:     { credits: 200, daily: 5 },
  max:     { credits: 800, daily: 10 },
};

async function verifyToken(token) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }) }
  );
  if (!r.ok) throw new Error("Invalid token");
  const d = await r.json();
  if (!d.users?.[0]) throw new Error("No user");
  return { uid: d.users[0].localId, email: d.users[0].email };
}

const PROJECT = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

async function getAccessToken() {
  const email = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const key = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claim = btoa(JSON.stringify({ iss: email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now }));
  const pemBody = key.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(`${header}.${claim}`));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const jwt = `${header}.${claim}.${sigB64}`;
  const tr = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const td = await tr.json();
  if (!td.access_token) throw new Error("Admin auth failed");
  return td.access_token;
}

async function fsGet(col, id, token) {
  const r = await fetch(`${FS}/${col}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("Firestore GET " + r.status);
  return parseFsDoc((await r.json()).fields || {});
}

async function fsSet(col, id, data, token) {
  const r = await fetch(`${FS}/${col}/${id}`, {
    method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFsFields(data) }),
  });
  if (!r.ok) throw new Error("Firestore SET " + r.status);
}

function parseFsDoc(f) {
  const o = {};
  for (const [k, v] of Object.entries(f)) {
    if (v.stringValue !== undefined) o[k] = v.stringValue;
    else if (v.integerValue !== undefined) o[k] = parseInt(v.integerValue);
    else if (v.doubleValue !== undefined) o[k] = v.doubleValue;
    else if (v.booleanValue !== undefined) o[k] = v.booleanValue;
  }
  return o;
}

function toFsFields(d) {
  const f = {};
  for (const [k, v] of Object.entries(d)) {
    if (typeof v === "string") f[k] = { stringValue: v };
    else if (typeof v === "number" && Number.isInteger(v)) f[k] = { integerValue: String(v) };
    else if (typeof v === "number") f[k] = { doubleValue: v };
    else if (typeof v === "boolean") f[k] = { booleanValue: v };
  }
  return f;
}

function defaultCredits(plan = "free") {
  const p = PLANS[plan] || PLANS.free;
  return { plan, monthly_limit: p.credits, monthly_used: 0, daily_limit: p.daily, daily_used: 0, reset_month: new Date().getMonth(), reset_day: new Date().getDate() };
}

function processCredits(c) {
  const now = new Date();
  const p = PLANS[c.plan] || PLANS.free;
  if (c.reset_month !== now.getMonth()) { c.monthly_used = 0; c.daily_used = 0; c.reset_month = now.getMonth(); c.reset_day = now.getDate(); c.monthly_limit = p.credits; c.daily_limit = p.daily; }
  if (c.reset_day !== now.getDate()) { c.daily_used = 0; c.reset_day = now.getDate(); }
  return c;
}

function getRemaining(c) {
  return Math.max(0, c.monthly_limit - c.monthly_used) + Math.max(0, c.daily_limit - c.daily_used);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  let user;
  try { user = await verifyToken(token); } catch (e) { return res.status(401).json({ error: e.message }); }

  let at;
  try { at = await getAccessToken(); } catch (e) { return res.status(500).json({ error: "Server auth: " + e.message }); }

  const { action, cost, plan } = req.body || {};

  try {
    if (action === "init") {
      let c = await fsGet("credits", user.uid, at);
      if (!c) { c = defaultCredits("free"); await fsSet("credits", user.uid, c, at); }
      c = processCredits(c); await fsSet("credits", user.uid, c, at);
      return res.json({ ok: true, credits: c, remaining: getRemaining(c) });
    }
    if (action === "check") {
      let c = await fsGet("credits", user.uid, at);
      if (!c) { c = defaultCredits("free"); await fsSet("credits", user.uid, c, at); }
      c = processCredits(c); await fsSet("credits", user.uid, c, at);
      return res.json({ ok: true, credits: c, remaining: getRemaining(c) });
    }
    if (action === "use") {
      let c = await fsGet("credits", user.uid, at);
      if (!c) c = defaultCredits("free");
      c = processCredits(c);
      const rem = getRemaining(c);
      const useCost = parseInt(cost) || 1;
      if (rem < useCost) return res.status(403).json({ error: "No credits", remaining: rem });
      let left = useCost;
      const da = Math.max(0, c.daily_limit - c.daily_used);
      if (da > 0) { const fd = Math.min(left, da); c.daily_used += fd; left -= fd; }
      if (left > 0) c.monthly_used += left;
      await fsSet("credits", user.uid, c, at);
      return res.json({ ok: true, credits: c, remaining: getRemaining(c) });
    }
    if (action === "set_plan") {
      const vp = PLANS[plan] ? plan : "free";
      let c = await fsGet("credits", user.uid, at);
      if (!c) c = defaultCredits(vp);
      c.plan = vp; const p = PLANS[vp];
      c.monthly_limit = p.credits; c.daily_limit = p.daily; c.monthly_used = 0; c.daily_used = 0;
      await fsSet("credits", user.uid, c, at);
      return res.json({ ok: true, credits: c, remaining: getRemaining(c) });
    }
    return res.status(400).json({ error: "Invalid action" });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
