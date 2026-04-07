import { useState, useRef, useEffect, useCallback } from "react";

const SYS = `You are CodeCraft AI — an elite frontend developer and designer. You build production-quality websites worth $50,000+.

DESIGN LIKE: Apple.com, Stripe.com, Linear.app, Vercel.com, Chick-fil-A.com

MANDATORY FOR EVERY BUILD:
1. HERO: Full-viewport, 60-100px headings, cinematic background, compelling CTA
2. TYPOGRAPHY: Import 2 Google Fonts via <link>. Display + body font
3. COLORS: Max 3-4 colors
4. WHITESPACE: 80-120px section padding. Max-width 1200px
5. IMAGES: MANDATORY — use https://picsum.photos/seed/KEYWORD/W/H with UNIQUE seeds. Every card/hero/gallery MUST have <img>
6. ANIMATIONS: IntersectionObserver scroll reveals. Smooth hover transitions
7. INTERACTIVITY: ALL buttons work. Sticky nav. Working hamburger. Tabs. Forms validate
8. RESPONSIVE: @media at 768px
9. FOOTER: Multi-column links, SVG social icons

VAGUE PROMPTS: Expand to 8+ section site. NEVER bare-bones.
USER URLs: Recreate similar layout/style. USER IMAGE URLs: Use exact URLs.

RESPONSE FORMAT:
**THINKING:** (design vision, hex colors, fonts, sections)
**CODE_START**
<!DOCTYPE html>
<html lang="en">...complete site...</html>
**CODE_END**
**DONE:** Summary + 2 enhancement suggestions.

RULES: One HTML file. All CSS in <style>, JS in <script>. Every button works. Real images. DONE always included.`;

const SUGGESTIONS = [
  { label: "Restaurant Website", prompt: "Build a premium restaurant website for 'Bellissimo Ristorante'. Sticky nav, full-screen hero with food image background (picsum.photos/seed/italianfood/1600/900), about section, tabbed menu (4 categories) with real dishes + prices + food images, gallery grid (6 images), testimonials, reservation form, footer. Colors: #722F37, #FFF8F0, #1a1a1a. Fonts: Playfair Display + DM Sans." },
  { label: "SaaS Dashboard", prompt: "Build an analytics dashboard for 'MetricFlow'. Dark sidebar with nav, top bar, 4 KPI cards, SVG area chart, bar chart, data table with status badges, activity timeline. Dark: #0f0f13, accent #6366f1." },
  { label: "Portfolio Site", prompt: "Build a developer portfolio. Hero with gradient text + typing effect, about with photo, 6-project grid with hover overlays + images, skill bars, timeline, contact form, footer. Dark: #0a0a0a, cyan #06b6d4. Fonts: Sora + DM Sans." },
  { label: "E-commerce Store", prompt: "Build a sneaker product page. Product image + thumbnails, color swatches, size grid, quantity counter, Add to Cart animation, tabbed content, reviews, related products. Dark: #111, orange #FF6B35." },
  { label: "Landing Page", prompt: "Build a SaaS landing page for 'WriteFlow AI'. Sticky nav, hero, features, How It Works, pricing toggle Monthly/Annual, testimonials, FAQ accordion, newsletter, footer. Dark gradient, green #10b981. Fonts: Outfit + Manrope." },
  { label: "Fitness App", prompt: "Build a fitness dashboard. Stats with SVG progress rings, weekly chart, workout list, working timer, schedule cards, badges, tab nav. Dark: #0f0f14, orange #f97316." },
];

const REVIEWS = [
  { name: "Sarah Chen", role: "Startup Founder", text: "I built our entire MVP landing page in under 10 minutes. My developers were shocked by the code quality." },
  { name: "Marcus Johnson", role: "Freelance Designer", text: "CodeCraft replaced my entire prototyping workflow. I describe what I want and get a fully functional site." },
  { name: "Emily Rodriguez", role: "Product Manager", text: "We built internal dashboards that would have taken our team weeks. It understood exactly what we needed." },
  { name: "David Park", role: "Agency Owner", text: "The websites look like they came from a $50K agency. Working animations, responsive layouts, real images." },
  { name: "Priya Sharma", role: "E-commerce Director", text: "Built a complete product page with working cart and galleries in one prompt. Absolutely mind-blowing." },
  { name: "Alex Turner", role: "Software Engineer", text: "Clean HTML, CSS custom properties, proper JS patterns. This is not the usual AI slop. Very impressed." },
];

const FEATURES = [
  { icon: "\u26A1", title: "Production-Ready Code", desc: "Clean HTML5, CSS3, and vanilla JS. No dependencies. Deploy anywhere." },
  { icon: "\uD83C\uDFA8", title: "Premium Design", desc: "Typography, spacing, colors, and animations that match top agencies." },
  { icon: "\uD83D\uDDBC\uFE0F", title: "Real Images", desc: "Every site includes real images with proper aspect ratios." },
  { icon: "\uD83D\uDD17", title: "Fully Interactive", desc: "Every button works. Tabs switch. Forms validate. No dead links." },
  { icon: "\uD83D\uDCF1", title: "Responsive", desc: "Mobile-first design with proper breakpoints." },
  { icon: "\uD83D\uDE80", title: "Live Preview", desc: "Watch your website render in real-time as the AI writes code." },
];

const store = {
  getAccounts() { try { return JSON.parse(localStorage.getItem("cc_accounts") || "{}"); } catch { return {}; } },
  saveAccount(e, d) { const a = this.getAccounts(); a[e.toLowerCase()] = d; localStorage.setItem("cc_accounts", JSON.stringify(a)); },
  getSession() { try { return JSON.parse(localStorage.getItem("cc_session")); } catch { return null; } },
  setSession(u) { localStorage.setItem("cc_session", JSON.stringify(u)); },
  clearSession() { localStorage.removeItem("cc_session"); },
  getChats() { try { return JSON.parse(localStorage.getItem("cc_chats") || "[]"); } catch { return []; } },
  saveChat(chat) { const c = this.getChats(); const i = c.findIndex(x => x.id === chat.id); if (i !== -1) c[i] = chat; else c.unshift(chat); localStorage.setItem("cc_chats", JSON.stringify(c.slice(0, 50))); },
  deleteChat(id) { localStorage.setItem("cc_chats", JSON.stringify(this.getChats().filter(c => c.id !== id))); }
};

const GoogleSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const BoltSVG = ({ s = 12 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#000"/></svg>;
const Stars = () => <span style={{ color: "#facc15", fontSize: 14, letterSpacing: 2 }}>{"\u2605\u2605\u2605\u2605\u2605"}</span>;

/* ═══ HOMEPAGE ═══ */
function HomePage({ onGetStarted }) {
  return (
    <div className="hp">
      <nav className="hp-nav"><div className="hp-nav-inner">
        <div className="hp-nav-logo"><div className="hp-logo-icon"><BoltSVG s={14}/></div><span>CodeCraft</span><span className="hp-badge">AI</span></div>
        <div className="hp-nav-links"><a onClick={() => document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}>Features</a><a onClick={() => document.getElementById("reviews")?.scrollIntoView({behavior:"smooth"})}>Reviews</a></div>
        <button className="hp-nav-cta" onClick={onGetStarted}>Get Started Free</button>
      </div></nav>
      <section className="hp-hero"><div className="hp-hero-glow"/><div className="hp-hero-content">
        <div className="hp-hero-pill">{"\u2728"} The #1 AI Website Builder</div>
        <h1 className="hp-hero-title">Don't just <em>think</em> it,<br/><span className="hp-hero-grad">build it</span></h1>
        <p className="hp-hero-sub">Describe any website in plain English. Get production-ready code with live preview in minutes.</p>
        <div className="hp-hero-btns"><button className="hp-btn-primary" onClick={onGetStarted}>Start Building Free {"\u2192"}</button><button className="hp-btn-secondary" onClick={() => document.getElementById("reviews")?.scrollIntoView({behavior:"smooth"})}>See Reviews</button></div>
        <div className="hp-hero-stats"><div className="hp-stat"><strong>10,000+</strong><span>Sites Built</span></div><div className="hp-stat-sep"/><div className="hp-stat"><strong>4.9/5</strong><span>Rating</span></div><div className="hp-stat-sep"/><div className="hp-stat"><strong>{"<"}2 min</strong><span>Build Time</span></div></div>
      </div></section>
      <section className="hp-section" id="features"><h2 className="hp-section-title">Everything You Need, Built In</h2><p className="hp-section-sub">Complete, production-ready websites with real functionality.</p>
        <div className="hp-features-grid">{FEATURES.map((f,i)=><div key={i} className="hp-feature-card"><div className="hp-feature-icon">{f.icon}</div><h3>{f.title}</h3><p>{f.desc}</p></div>)}</div></section>
      <section className="hp-section hp-section-dark" id="reviews"><h2 className="hp-section-title">Loved by Builders Worldwide</h2><p className="hp-section-sub">Thousands shipping ideas to production in minutes.</p>
        <div className="hp-reviews-grid">{REVIEWS.map((r,i)=><div key={i} className="hp-review-card"><Stars/><p className="hp-review-text">"{r.text}"</p><div className="hp-review-author"><div className="hp-review-avatar">{r.name[0]}</div><div><strong>{r.name}</strong><span>{r.role}</span></div></div></div>)}</div></section>
      <section className="hp-cta-section"><div className="hp-cta-glow"/><h2>Ready to build something amazing?</h2><p>Join thousands shipping production websites in minutes.</p><button className="hp-btn-primary hp-btn-lg" onClick={onGetStarted}>Get Started Free {"\u2192"}</button></section>
      <footer className="hp-footer"><div className="hp-footer-inner"><div className="hp-footer-brand"><div className="hp-nav-logo"><div className="hp-logo-icon"><BoltSVG s={14}/></div><span>CodeCraft</span><span className="hp-badge">AI</span></div><p>AI-powered platform for building websites in minutes.</p></div><div className="hp-footer-col"><h4>Product</h4><a>Features</a><a>Pricing</a><a>Templates</a></div><div className="hp-footer-col"><h4>Resources</h4><a>Docs</a><a>Blog</a><a>Support</a></div><div className="hp-footer-col"><h4>Company</h4><a>About</a><a>Privacy</a><a>Terms</a></div></div><div className="hp-footer-bottom">{"\u00A9"} 2026 CodeCraft AI</div></footer>
    </div>
  );
}

/* ═══ AUTH ═══ */
function AuthPage({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [name, setName] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [gM, setGM] = useState(false); const [gE, setGE] = useState(""); const [gS, setGS] = useState(1); const [gN, setGN] = useState("");
  const ve = e => e.includes("@") && e.includes(".");

  const doLogin = e => { e.preventDefault(); setErr(""); if (!ve(email)) return setErr("Enter a valid email"); if (pw.length < 6) return setErr("Password must be 6+ chars"); const a = store.getAccounts(); const ac = a[email.toLowerCase()]; if (!ac) return setErr("No account found. Sign up first."); if (ac.password !== pw) return setErr("Incorrect password."); const u = { name: ac.name, email: email.toLowerCase() }; store.setSession(u); onLogin(u); };
  const doSignup = e => { e.preventDefault(); setErr(""); if (!name.trim()) return setErr("Enter your name"); if (!ve(email)) return setErr("Enter a valid email"); if (pw.length < 6) return setErr("Password must be 6+ chars"); const a = store.getAccounts(); if (a[email.toLowerCase()]) return setErr("Account exists. Sign in."); store.saveAccount(email, { name: name.trim(), password: pw, email: email.toLowerCase() }); const u = { name: name.trim(), email: email.toLowerCase() }; store.setSession(u); onLogin(u); };
  const doG = () => { setErr(""); if (gS === 1) { if (!ve(gE)) return setErr("Enter a valid Gmail"); const a = store.getAccounts(); const ex = a[gE.toLowerCase()]; if (ex) { store.setSession({ name: ex.name, email: gE.toLowerCase() }); onLogin({ name: ex.name, email: gE.toLowerCase() }); } else setGS(2); } else { if (!gN.trim()) return setErr("Enter your name"); store.saveAccount(gE, { name: gN.trim(), password: "google_oauth", email: gE.toLowerCase() }); const u = { name: gN.trim(), email: gE.toLowerCase() }; store.setSession(u); onLogin(u); } };
  const cG = () => { setGM(false); setGS(1); setGE(""); setGN(""); setErr(""); };

  return (
    <div className="a-page"><div className="a-grid"/><div className="a-glow"/>
      {gM && <div className="mo-ov" onClick={cG}><div className="mo-box" onClick={e => e.stopPropagation()}><div className="mo-top"><GoogleSVG/><h2>Sign in with Google</h2></div>
        {gS === 1 ? <><p className="mo-desc">Enter your Gmail to continue</p><div className="a-field"><label>Email</label><input type="email" placeholder="you@gmail.com" value={gE} onChange={e => setGE(e.target.value)} autoFocus onKeyDown={e => { if (e.key === "Enter") doG(); }}/></div></> : <><p className="mo-desc">Set up your profile</p><div className="mo-email">{gE}</div><div className="a-field"><label>Your Name</label><input type="text" placeholder="John Doe" value={gN} onChange={e => setGN(e.target.value)} autoFocus onKeyDown={e => { if (e.key === "Enter") doG(); }}/></div></>}
        {err && gM && <p className="a-err">{err}</p>}
        <div className="mo-btns"><button className="mo-cancel" onClick={cG}>Cancel</button><button className="mo-go" onClick={doG}>{gS === 1 ? "Continue" : "Create Account"}</button></div>
      </div></div>}
      <div className="a-box"><button className="a-back" onClick={onBack}>{"\u2190"} Back</button>
        <div className="a-logo-row"><div className="a-logo-icon"><BoltSVG s={16}/></div><span className="a-logo-text">CodeCraft</span><span className="a-badge">AI</span></div>
        <h1 className="a-title">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="a-sub">{mode === "login" ? "Sign in to start building" : "Start building in minutes"}</p>
        <button className="a-google" onClick={() => { setGM(true); setErr(""); }}><GoogleSVG/> Continue with Google</button>
        <div className="a-div"><div className="a-div-line"/><span className="a-div-text">or</span><div className="a-div-line"/></div>
        <form onSubmit={mode === "login" ? doLogin : doSignup} className="a-form">
          {mode === "signup" && <div className="a-field"><label>Full Name</label><input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)}/></div>}
          <div className="a-field"><label>Email</label><input type="email" placeholder="you@gmail.com" value={email} onChange={e => setEmail(e.target.value)}/></div>
          <div className="a-field"><label>Password</label><input type="password" placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"} value={pw} onChange={e => setPw(e.target.value)}/></div>
          {err && !gM && <p className="a-err">{err}</p>}
          <button className="a-submit" type="submit">{mode === "login" ? "Sign In" : "Create Account"}</button>
        </form>
        <p className="a-switch">{mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}<button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); setPw(""); }}>{mode === "login" ? "Sign up" : "Sign in"}</button></p>
      </div>
    </div>
  );
}

/* ═══ MAIN APP ═══ */
function MainApp({ user, onLogout }) {
  const [chatList, setChatList] = useState(() => store.getChats());
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(null);
  const [loadPhase, setLoadPhase] = useState("");
  const [previewCode, setPreviewCode] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState("preview");
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const scrollRef = useRef(null); const codeBoxRef = useRef(null);
  const inputRef = useRef(null); const iframeRef = useRef(null); const timerRef = useRef(null);
  const isEmpty = messages.length === 0 && !loading;

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading, streaming?.phase, loadPhase]);
  useEffect(() => { if (codeBoxRef.current) codeBoxRef.current.scrollTop = codeBoxRef.current.scrollHeight; }, [streaming?.code]);
  useEffect(() => { if (iframeRef.current && previewCode && viewMode === "preview") { const d = iframeRef.current.contentDocument; d.open(); d.write(previewCode); d.close(); } }, [previewCode, viewMode, showPreview]);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  useEffect(() => {
    if (activeChatId && messages.length > 0) {
      const title = messages[0]?.content?.slice(0, 50) || "New Chat";
      store.saveChat({ id: activeChatId, title, messages, updatedAt: Date.now() });
      setChatList(store.getChats());
    }
  }, [messages, activeChatId]);

  const parse = raw => {
    let t = "", c = "", d = "";
    const cs = raw.indexOf("**CODE_START**"), ce = raw.indexOf("**CODE_END**");
    if (cs !== -1) {
      t = raw.slice(0, cs).replace(/\*\*THINKING:\*\*\s*/i, "").trim();
      if (ce !== -1) { c = raw.slice(cs + 14, ce).trim(); d = raw.slice(ce + 12).replace(/\*\*DONE:\*\*\s*/i, "").trim(); }
      else c = raw.slice(cs + 14).trim();
    } else {
      const hi = raw.indexOf("<!DOCTYPE"), lo = raw.indexOf("<!doctype"), s = hi !== -1 ? hi : lo;
      if (s !== -1) { t = raw.slice(0, s).replace(/\*\*THINKING:\*\*\s*/i, "").trim(); const e = raw.lastIndexOf("</html>"); if (e !== -1) { c = raw.slice(s, e + 7); d = raw.slice(e + 7).replace(/\*\*DONE:\*\*\s*/i, "").trim(); } else c = raw.slice(s); }
      else t = raw.replace(/\*\*THINKING:\*\*\s*/i, "").replace(/\*\*DONE:\*\*\s*/i, "").trim();
    }
    return { thinking: t, code: c, done: d };
  };

  const send = useCallback(async text => {
    const tr = (text || input).trim(); if (!tr || loading) return;
    const chatId = activeChatId || "chat_" + Date.now();
    if (!activeChatId) setActiveChatId(chatId);
    const um = { role: "user", content: tr };
    const nx = [...messages, um]; setMessages(nx); setInput(""); setLoading(true); setStreaming(null); setLoadPhase("sending");
    if (inputRef.current) inputRef.current.style.height = "auto";
    try {
      setLoadPhase("generating");
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 16000, system: SYS, messages: nx.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })) }) });
      const data = await r.json();
      const full = data.content?.map(b => b.text || "").join("") || "Something went wrong.";
      setLoadPhase("streaming"); let i = 0;
      await new Promise(res => { timerRef.current = setInterval(() => { i = Math.min(i + Math.floor(Math.random() * 20) + 8, full.length); const p = parse(full.slice(0, i)); setStreaming({ ...p, phase: p.done ? "done" : p.code ? "coding" : "thinking" }); if (i >= full.length) { clearInterval(timerRef.current); timerRef.current = null; res(); } }, 10); });
      const f = parse(full); let dm = f.done;
      if (!dm && f.code) dm = "Here's your website \u2014 " + f.code.split("\n").length + " lines of production code. Ask me to change colors, add sections, or tweak the layout.";
      setMessages(prev => [...prev, { role: "assistant", content: full, thinking: f.thinking, code: f.code, done: dm, hasCode: !!f.code }]);
      setStreaming(null); setLoadPhase("");
      if (f.code) { setPreviewCode(f.code); setShowPreview(true); setViewMode("preview"); }
    } catch { setMessages(prev => [...prev, { role: "assistant", content: "Connection error \u2014 try again." }]); setStreaming(null); setLoadPhase(""); }
    setLoading(false);
  }, [input, loading, messages, activeChatId]);

  const newChat = () => { setActiveChatId(null); setMessages([]); setPreviewCode(null); setShowPreview(false); setStreaming(null); setLoadPhase(""); };
  const loadChat = chat => { setActiveChatId(chat.id); setMessages(chat.messages || []); setPreviewCode(null); setShowPreview(false); const lc = [...(chat.messages || [])].reverse().find(m => m.code); if (lc) { setPreviewCode(lc.code); setShowPreview(true); } };
  const deleteChat = id => { store.deleteChat(id); setChatList(store.getChats()); if (activeChatId === id) newChat(); };
  const kd = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const cp = () => { if (previewCode) { navigator.clipboard.writeText(previewCode); setCopied(true); setTimeout(() => setCopied(false), 1500); } };
  const dl = () => { if (!previewCode) return; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([previewCode], { type: "text/html" })); a.download = "app.html"; a.click(); };
  const lo = () => { store.clearSession(); onLogout(); };
  const pl = loadPhase === "sending" ? "Sending..." : loadPhase === "generating" ? "AI is thinking \u2014 30-60s for complex sites..." : "";
  const timeAgo = ts => { const d = Date.now() - ts; if (d < 60000) return "just now"; if (d < 3600000) return Math.floor(d / 60000) + "m ago"; if (d < 86400000) return Math.floor(d / 3600000) + "h ago"; return Math.floor(d / 86400000) + "d ago"; };

  const rmsg = (msg, i) => {
    if (msg.role === "user") return <div key={i} className="m-u"><div className="m-ub">{msg.content}</div></div>;
    return (
      <div key={i} className="m-a"><div className="m-av"><BoltSVG/></div><div className="m-ab">
        {msg.thinking && <div className="m-t">{msg.thinking}</div>}
        {msg.hasCode && msg.code && <div className="m-cb"><div className="m-cbh"><span className="m-cbl"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>index.html<span className="m-cbn">{msg.code.split("\n").length} lines</span></span><button className="m-cbo" onClick={() => { setPreviewCode(msg.code); setShowPreview(true); setViewMode("preview"); }}>Open Preview <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></button></div><pre className="m-cbp">{msg.code.slice(0,400)}{msg.code.length>400?"\n...":""}</pre></div>}
        {msg.done && <div className="m-d">{msg.done}</div>}
        {!msg.hasCode && !msg.thinking && <div className="m-tx">{msg.content}</div>}
      </div></div>
    );
  };

  return (
    <div className="app">
      {sidebarOpen && <div className="sidebar">
        <div className="sb-hdr"><span className="sb-title">Chats</span><button className="sb-new" onClick={newChat}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div>
        <div className="sb-list">
          {chatList.length === 0 && <div className="sb-empty">No chats yet</div>}
          {chatList.map(c => <div key={c.id} className={"sb-item" + (c.id === activeChatId ? " sb-item-active" : "")} onClick={() => loadChat(c)}><div className="sb-item-text"><div className="sb-item-title">{c.title}</div><div className="sb-item-time">{timeAgo(c.updatedAt)}</div></div><button className="sb-item-del" onClick={e => { e.stopPropagation(); deleteChat(c.id); }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>)}
        </div>
        <div className="sb-footer"><div className="sb-user" onClick={lo}><div className="sb-user-av">{user.name?.[0]?.toUpperCase()||"U"}</div><div className="sb-user-info"><strong>{user.name}</strong><span>{user.email}</span></div></div></div>
      </div>}

      <div className="left" style={{ flex: showPreview ? "0 0 440px" : "1 1 auto", maxWidth: showPreview ? 440 : "none" }}>
        <div className="hdr">
          <div className="hdr-l"><button className="hdr-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{padding:"5px 7px"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button><div className="hdr-logo"><BoltSVG s={14}/></div><span className="hdr-n">CodeCraft</span><span className="hdr-b">AI</span></div>
          <div className="hdr-r"><button className="hdr-btn" onClick={newChat}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>New</button></div>
        </div>
        <div className="msgs" ref={scrollRef}>
          {isEmpty ? <div className="empty"><h1 className="ht">What do you want<br/>to <span className="hg">build</span> today?</h1><p className="hs">Describe any website, paste a URL for inspiration, or include image links.</p></div> :
          <div className="ml">{messages.map(rmsg)}
            {loading && <div className="m-a"><div className="m-av"><BoltSVG/></div><div className="m-ab">
              {!streaming ? <div className="m-loading"><div className="dots"><span/><span/><span/></div>{pl && <div className="m-phase">{pl}</div>}</div> : <>
                {streaming.thinking && <div className="m-t">{streaming.thinking}{streaming.phase === "thinking" && <span className="cur"/>}</div>}
                {streaming.phase === "coding" && streaming.code && <div className="m-cb m-cb-live"><div className="m-cbh"><span className="m-cbl"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>index.html<span className="m-wr">Writing...</span></span><div className="m-cbc">{streaming.code.split("\n").length} lines</div></div><pre className="m-cbp m-cbs" ref={codeBoxRef}>{streaming.code}<span className="cur"/></pre></div>}
                {streaming.phase === "done" && streaming.done && <div className="m-d">{streaming.done}<span className="cur"/></div>}
              </>}
            </div></div>}
          </div>}
        </div>
        <div className="ia">
          {isEmpty && <div className="chips">{SUGGESTIONS.map((s,i) => <button key={i} className="chip" onClick={() => send(s.prompt)}>{s.label}</button>)}</div>}
          <div className="ib"><textarea ref={inputRef} className="it" value={input} onChange={e => setInput(e.target.value)} onKeyDown={kd} placeholder={isEmpty ? "Describe what you want to build..." : "Ask for changes or build something new..."} rows={1} onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}/><button className="is" onClick={() => send()} disabled={loading || !input.trim()} style={{ opacity: input.trim() && !loading ? 1 : 0.25 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button></div>
          <p className="ifooter">Powered by Claude Opus 4.6</p>
        </div>
      </div>

      {showPreview && previewCode && <div className="right">
        <div className="ph"><div className="pt"><button className={viewMode === "preview" ? "ptb ptb-a" : "ptb"} onClick={() => setViewMode("preview")}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>Preview</button><button className={viewMode === "code" ? "ptb ptb-a" : "ptb"} onClick={() => setViewMode("code")}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>Code</button></div>
          <div className="pa"><button className="pb" onClick={cp}>{copied ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}</button><button className="pb" onClick={dl}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button><button className="pb" onClick={() => setShowPreview(false)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
        </div>
        <div className="pbd">{viewMode === "preview" ? <iframe ref={iframeRef} sandbox="allow-scripts allow-same-origin allow-popups allow-forms" className="pif" title="preview"/> : <pre className="pco">{previewCode}</pre>}</div>
      </div>}
    </div>
  );
}

/* ═══ ROOT ═══ */
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  useEffect(() => { const s = store.getSession(); if (s) { setUser(s); setPage("app"); } }, []);
  return (
    <>
      {page === "home" && <HomePage onGetStarted={() => setPage("auth")}/>}
      {page === "auth" && <AuthPage onLogin={u => { setUser(u); setPage("app"); }} onBack={() => setPage("home")}/>}
      {page === "app" && user && <MainApp user={user} onLogout={() => { setUser(null); setPage("home"); }}/>}
    </>
  );
}
