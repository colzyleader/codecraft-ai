export const config = {
  maxDuration: 300,
};

function getProvider(model) {
  if (model.startsWith("gemini-")) return "gemini";
  if (model.startsWith("gpt-")) return "openai";
  return "anthropic";
}

async function callAnthropic(body) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { error: "ANTHROPIC_API_KEY not set" };

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  return r.json();
}

async function callOpenAI(body) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { error: "OPENAI_API_KEY not set" };

  const isCodex = body.model.includes("codex");

  if (isCodex) {
    const input = [];
    if (body.system) {
      input.push({ type: "message", role: "developer", content: body.system });
    }
    for (const msg of body.messages) {
      input.push({ type: "message", role: msg.role, content: msg.content });
    }

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key,
      },
      body: JSON.stringify({ model: body.model, input }),
    });

    const data = await r.json();
    if (data.error) return { error: data.error };

    const text = data.output_text ||
      (data.output || [])
        .filter(item => item.type === "message")
        .map(item => (item.content || []).filter(c => c.type === "output_text").map(c => c.text).join(""))
        .join("") || "";

    return { content: [{ type: "text", text }] };

  } else {
    const messages = [];
    if (body.system) {
      messages.push({ role: "system", content: body.system });
    }
    for (const msg of body.messages) {
      messages.push({ role: msg.role, content: msg.content });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key,
      },
      body: JSON.stringify({
        model: body.model,
        max_completion_tokens: body.max_tokens || 12000,
        messages,
      }),
    });

    const data = await r.json();
    if (data.error) return { error: data.error };

    const text = data.choices?.[0]?.message?.content || "";
    return { content: [{ type: "text", text }] };
  }
}

async function callGemini(body) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { error: "GEMINI_API_KEY not set" };

  const messages = [];
  if (body.system) messages.push({ role: "system", content: body.system });
  for (const msg of body.messages) {
    messages.push({ role: msg.role, content: msg.content });
  }

  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + key,
    },
    body: JSON.stringify({
      model: body.model,
      max_completion_tokens: body.max_tokens || 12000,
      messages,
    }),
  });

  const data = await r.json();
  if (data.error) return { error: data.error };

  const text = data.choices?.[0]?.message?.content || "";
  return { content: [{ type: "text", text }] };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const provider = getProvider(req.body.model || "");
    const data = provider === "gemini"
      ? await callGemini(req.body)
      : provider === "openai"
      ? await callOpenAI(req.body)
      : await callAnthropic(req.body);

    return res.status(200).json(data);
  } catch (e) {
    return res.status(200).json({
      content: [{ type: 'text', text: 'Server error: ' + (e.message || 'Try again.') }]
    });
  }
}
