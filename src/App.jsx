import { useState, useRef, useEffect, useCallback } from "react";

const SYS = `You are CodeCraft AI, an elite web developer. Build production-quality websites.
RULES:
- One self-contained HTML file with inline CSS and JS
- Import Google Fonts via <link>
- For FOOD/RESTAURANT sites: use real food stock photo URLs like https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600 (burger), https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600 (chicken sandwich), https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600 (nuggets), https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600 (fries), https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600 (milkshake), https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600 (food platter), https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600 (food hero). Use DIFFERENT images per item by adding &q=80&fit=crop to vary them. Add onerror="this.style.background='#333';this.style.height='200px'" to all img tags
- For NON-FOOD sites: use https://images.unsplash.com/photo-RELEVANT-ID?w=600 with relevant photos, or styled gradient placeholder divs with icons
- All buttons must work (tabs, forms, nav, hamburger)
- Responsive at 768px. Modern dark theme unless specified
- Scroll animations with IntersectionObserver. Keep code concise
RESPONSE FORMAT:
**THINKING:** (brief: colors, fonts, sections)
**CODE_START**
<!DOCTYPE html>
<html lang="en">...complete site...</html>
**CODE_END**
**DONE:** What you built + 2 suggestions.`;

const PLANS = [
  { id: "free", name: "Free", price: 0, credits: 10, daily: 3, desc: "Perfect for getting started", features: ["10 credits/month", "3 free credits/day", "Basic code generation", "Live preview", "Code download"] },
  { id: "starter", name: "Starter", price: 25, credits: 100, daily: 0, desc: "For individuals and side projects", features: ["100 credits/month", "Credit rollover", "Priority generation", "All templates", "Email support"], stripeUrl: "https://buy.stripe.com/5kQdR85Zq1LpajGdbA9R606" },
  { id: "pro", name: "Pro", price: 50, credits: 200, daily: 5, desc: "For power users and production apps", features: ["200 credits/month", "5 bonus credits/day", "Fastest generation", "All templates", "Priority support"], popular: true, stripeUrl: "https://buy.stripe.com/cNi3cu9bC1Lp1Na7Rg9R607" },
  { id: "max", name: "Max", price: 200, credits: 800, daily: 10, desc: "For heavy users and agencies", features: ["800 credits/month", "10 bonus credits/day", "Fastest generation", "White-label export", "Dedicated support"], stripeUrl: "https://buy.stripe.com/eVq8wO73u9dRezW6Nc9R608" },
];

const MODELS = [
  { id: "claude-sonnet-4-20250514", name: "Sonnet 4", provider: "anthropic", cost: 2, icon: "✦" },
  { id: "claude-opus-4-20250514", name: "Opus 4", provider: "anthropic", cost: 5, icon: "◆" },
  { id: "claude-haiku-4-5-20251001", name: "Haiku 4.5", provider: "anthropic", cost: 1, icon: "⚡" },
  { id: "gpt-5.4", name: "GPT-5.4", provider: "openai", cost: 3, icon: "◉" },
  { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", provider: "openai", cost: 1, icon: "○" },
  { id: "gpt-5.3-codex", name: "GPT-5.3 Codex", provider: "openai", cost: 4, icon: "⬡" },
];

const SUGGESTIONS = [
  { label: "Restaurant Website", prompt: "Build a premium restaurant website. Sticky nav, hero with food background, tabbed menu with 4 categories, real dishes with images and prices, about section, reservation form, footer. Dark theme." },
  { label: "SaaS Dashboard", prompt: "Build an analytics dashboard. Dark sidebar with nav, 4 KPI cards, area chart, bar chart, data table with status badges, activity timeline. Dark theme, accent #6366f1." },
  { label: "Portfolio Site", prompt: "Build a developer portfolio. Hero with gradient text, about with photo, 6-project grid with hover overlays, skill bars, contact form, social footer. Dark theme, cyan accent." },
  { label: "E-commerce Store", prompt: "Build a sneaker product page. Product image with thumbnails, color/size selectors, Add to Cart animation, reviews, related products. Dark theme, orange accent." },
  { label: "Landing Page", prompt: "Build a SaaS landing page. Hero, features, pricing toggle, testimonials, FAQ accordion, newsletter signup, footer. Dark gradient theme." },
  { label: "Fitness App", prompt: "Build a fitness dashboard. Stat cards with progress rings, weekly chart, workout list, working timer, achievement badges. Dark theme, orange accent." },
];

const REVIEWS = [
  { name: "Sarah Chen", role: "Startup Founder", text: "Built our entire MVP in under 10 minutes. My developers were shocked by the code quality." },
  { name: "Marcus Johnson", role: "Freelance Designer", text: "CodeCraft replaced my prototyping workflow. Describe what I want, get a functional site." },
  { name: "Emily Rodriguez", role: "Product Manager", text: "Built dashboards that would have taken weeks. It understood exactly what we needed." },
  { name: "David Park", role: "Agency Owner", text: "Websites look like they came from a $50K agency. Animations, layouts, images — everything." },
  { name: "Priya Sharma", role: "E-commerce Director", text: "Complete product page with working cart and galleries in one prompt. Mind-blowing." },
  { name: "Alex Turner", role: "Software Engineer", text: "Clean HTML, CSS custom properties, proper JS. Not the usual AI slop." },
];

const FEATURES = [
  { icon: "\u26A1", title: "Production-Ready Code", desc: "Clean HTML5, CSS3, vanilla JS. Deploy anywhere." },
  { icon: "\uD83C\uDFA8", title: "Premium Design", desc: "Typography, spacing, animations matching top agencies." },
  { icon: "\uD83D\uDDBC\uFE0F", title: "Real Images", desc: "Every site includes relevant images." },
  { icon: "\uD83D\uDD17", title: "Fully Interactive", desc: "Buttons work. Tabs switch. Forms validate." },
  { icon: "\uD83D\uDCF1", title: "Responsive", desc: "Mobile-first with proper breakpoints." },
  { icon: "\uD83D\uDE80", title: "Live Preview", desc: "Watch code render in real-time." },
];

/* ═══ STORAGE ═══ */
const store = {
  getAccounts() { try { return JSON.parse(localStorage.getItem("cc_accounts") || "{}"); } catch { return {}; } },
  saveAccount(e, d) { const a = this.getAccounts(); a[e.toLowerCase()] = d; localStorage.setItem("cc_accounts", JSON.stringify(a)); },
  getSession() { try { return JSON.parse(localStorage.getItem("cc_session")); } catch { return null; } },
  setSession(u) { localStorage.setItem("cc_session", JSON.stringify(u)); },
  clearSession() { localStorage.removeItem("cc_session"); },
  getChats() { try { return JSON.parse(localStorage.getItem("cc_chats") || "[]"); } catch { return []; } },
  saveChat(chat) { const c = this.getChats(); const i = c.findIndex(x => x.id === chat.id); if (i !== -1) c[i] = chat; else c.unshift(chat); localStorage.setItem("cc_chats", JSON.stringify(c.slice(0, 50))); },
  deleteChat(id) { localStorage.setItem("cc_chats", JSON.stringify(this.getChats().filter(c => c.id !== id))); },
  getCredits(email) { try { const d = JSON.parse(localStorage.getItem("cc_credits_" + email) || "null"); if (!d || d.month !== new Date().getMonth()) return this.resetCredits(email); return d; } catch { return this.resetCredits(email); } },
  resetCredits(email) { const plan = this.getPlan(email); const p = PLANS.find(x => x.id === plan) || PLANS[0]; const d = { used: 0, monthly: p.credits, daily_used: 0, daily_max: p.daily, last_day: new Date().getDate(), month: new Date().getMonth(), plan: plan }; localStorage.setItem("cc_credits_" + email, JSON.stringify(d)); return d; },
  useCredit(email, cost) { const d = this.getCredits(email); if (d.last_day !== new Date().getDate()) { d.daily_used = 0; d.last_day = new Date().getDate(); } d.used += cost; d.daily_used += cost; localStorage.setItem("cc_credits_" + email, JSON.stringify(d)); return d; },
  getRemaining(email) { const d = this.getCredits(email); const monthly = d.monthly - d.used; const daily = d.daily_max > 0 ? d.daily_max - (d.last_day === new Date().getDate() ? d.daily_used : 0) : 0; return Math.max(0, monthly + daily); },
  canUse(email) { return this.getRemaining(email) > 0; },
  getPlan(email) { try { return localStorage.getItem("cc_plan_" + email) || "free"; } catch { return "free"; } },
  setPlan(email, plan) { localStorage.setItem("cc_plan_" + email, plan); this.resetCredits(email); },
  getTheme() { return localStorage.getItem("cc_theme") || "dark"; },
  setTheme(t) { localStorage.setItem("cc_theme", t); document.documentElement.setAttribute("data-theme", t); },
};

/* ═══ SVGs ═══ */
const GoogleSVG = () => <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
const BoltSVG = ({ s = 12 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" style={{color:"var(--bg)"}}/></svg>;
const Stars = () => <span style={{ color: "#facc15", fontSize: 14, letterSpacing: 2 }}>{"\u2605\u2605\u2605\u2605\u2605"}</span>;
const ThemeToggle = ({ theme, toggle }) => <button className="theme-toggle" onClick={toggle} title={theme === "dark" ? "Light mode" : "Dark mode"}>{theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}</button>;

/* ═══ HOMEPAGE ═══ */
function HomePage({ onGetStarted, onPricing, theme, toggleTheme }) {
  return (
    <div className="hp">
      <nav className="hp-nav"><div className="hp-nav-inner">
        <div className="hp-nav-logo"><div className="hp-logo-icon"><BoltSVG s={14}/></div><span>CodeCraft</span><span className="hp-badge">AI</span></div>
        <div className="hp-nav-links"><a onClick={() => document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}>Features</a><a onClick={() => document.getElementById("pricing")?.scrollIntoView({behavior:"smooth"})}>Pricing</a><a onClick={() => document.getElementById("reviews")?.scrollIntoView({behavior:"smooth"})}>Reviews</a></div>
        <div className="hp-nav-right"><ThemeToggle theme={theme} toggle={toggleTheme}/><button className="hp-nav-cta" onClick={onGetStarted}>Get Started Free</button></div>
      </div></nav>
      <section className="hp-hero"><div className="hp-hero-glow"/><div className="hp-hero-content">
        <div className="hp-hero-pill">{"\u2728"} The #1 AI Website Builder</div>
        <h1 className="hp-hero-title">Don't just <em>think</em> it,<br/><span className="hp-hero-grad">build it</span></h1>
        <p className="hp-hero-sub">Describe any website in plain English. Get production-ready code with live preview in minutes.</p>
        <div className="hp-hero-btns"><button className="hp-btn-primary" onClick={onGetStarted}>Start Building Free {"\u2192"}</button><button className="hp-btn-secondary" onClick={() => document.getElementById("pricing")?.scrollIntoView({behavior:"smooth"})}>View Pricing</button></div>
        <div className="hp-hero-stats"><div className="hp-stat"><strong>10,000+</strong><span>Sites Built</span></div><div className="hp-stat-sep"/><div className="hp-stat"><strong>4.9/5</strong><span>Rating</span></div><div className="hp-stat-sep"/><div className="hp-stat"><strong>{"<"}2 min</strong><span>Build Time</span></div></div>
      </div></section>
      <section className="hp-section" id="features"><h2 className="hp-section-title">Everything You Need, Built In</h2><p className="hp-section-sub">Complete, production-ready websites with real functionality.</p>
        <div className="hp-features-grid">{FEATURES.map((f,i)=><div key={i} className="hp-feature-card"><div className="hp-feature-icon">{f.icon}</div><h3>{f.title}</h3><p>{f.desc}</p></div>)}</div></section>

      {/* PRICING */}
      <section className="hp-section" id="pricing"><h2 className="hp-section-title">Simple, Transparent Pricing</h2><p className="hp-section-sub">Start free, upgrade as you grow. No hidden fees.</p>
        <div className="pricing-grid">{PLANS.map((p,i) => (
          <div key={i} className={"pricing-card" + (p.popular ? " popular" : "")}>
            {p.popular && <div className="pricing-popular-badge">Most Popular</div>}
            <div className="pricing-name">{p.name}</div>
            <div className="pricing-price">{p.price === 0 ? "$0" : "$" + p.price}<span>/mo</span></div>
            <div className="pricing-desc">{p.desc}</div>
            <ul className="pricing-features">{p.features.map((f,j) => <li key={j}>{f}</li>)}</ul>
            <button className={p.popular ? "pricing-btn pricing-btn-primary" : "pricing-btn"} onClick={() => { if (p.price === 0) onGetStarted(); else if (p.stripeUrl) window.open(p.stripeUrl, "_blank"); }}>{p.price === 0 ? "Get Started Free" : "Subscribe"}</button>
          </div>
        ))}</div>
      </section>

      <section className="hp-section hp-section-dark" id="reviews"><h2 className="hp-section-title">Loved by Builders Worldwide</h2><p className="hp-section-sub">Thousands shipping ideas to production in minutes.</p>
        <div className="hp-reviews-grid">{REVIEWS.map((r,i)=><div key={i} className="hp-review-card"><Stars/><p className="hp-review-text">"{r.text}"</p><div className="hp-review-author"><div className="hp-review-avatar">{r.name[0]}</div><div><strong>{r.name}</strong><span>{r.role}</span></div></div></div>)}</div></section>
      <section className="hp-cta-section"><div className="hp-cta-glow"/><h2>Ready to build something amazing?</h2><p>Join thousands shipping production websites in minutes.</p><button className="hp-btn-primary hp-btn-lg" onClick={onGetStarted}>Get Started Free {"\u2192"}</button></section>
      <footer className="hp-footer"><div className="hp-footer-inner"><div className="hp-footer-brand"><div className="hp-nav-logo"><div className="hp-logo-icon"><BoltSVG s={14}/></div><span>CodeCraft</span><span className="hp-badge">AI</span></div><p>AI-powered platform for building websites in minutes.</p></div><div className="hp-footer-col"><h4>Product</h4><a>Features</a><a onClick={onPricing}>Pricing</a><a>Templates</a></div><div className="hp-footer-col"><h4>Resources</h4><a>Docs</a><a>Blog</a><a>Support</a></div><div className="hp-footer-col"><h4>Company</h4><a>About</a><a>Privacy</a><a>Terms</a></div></div><div className="hp-footer-bottom">{"\u00A9"} 2026 CodeCraft AI</div></footer>
    </div>
  );
}

/* ═══ AUTH ═══ */
function AuthPage({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [name, setName] = useState("");
  const [err, setErr] = useState("");
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
function MainApp({ user, onLogout, theme, toggleTheme, onPricing }) {
  const [chatList, setChatList] = useState(() => store.getChats());
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(null); const [loadPhase, setLoadPhase] = useState("");
  const [previewCode, setPreviewCode] = useState(null); const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState("preview"); const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [credits, setCredits] = useState(() => store.getRemaining(user.email));
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-20250514");
  const [modelOpen, setModelOpen] = useState(false);
  const modelRef = useRef(null);
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];
  const plan = store.getPlan(user.email);
  const planData = PLANS.find(p => p.id === plan) || PLANS[0];

  const scrollRef = useRef(null); const codeBoxRef = useRef(null);
  const inputRef = useRef(null); const iframeRef = useRef(null); const timerRef = useRef(null);
  const isEmpty = messages.length === 0 && !loading;

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading, streaming?.phase, loadPhase]);
  useEffect(() => { if (codeBoxRef.current) codeBoxRef.current.scrollTop = codeBoxRef.current.scrollHeight; }, [streaming?.code]);
  useEffect(() => { if (iframeRef.current && previewCode && viewMode === "preview") { const d = iframeRef.current.contentDocument; d.open(); d.write(previewCode); d.close(); } }, [previewCode, viewMode, showPreview]);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);
  useEffect(() => { if (activeChatId && messages.length > 0) { store.saveChat({ id: activeChatId, title: messages[0]?.content?.slice(0, 50) || "New Chat", messages, updatedAt: Date.now() }); setChatList(store.getChats()); } }, [messages, activeChatId]);
  useEffect(() => { const h = e => { if (modelRef.current && !modelRef.current.contains(e.target)) setModelOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const parse = raw => { let t="",c="",d=""; const cs=raw.indexOf("**CODE_START**"),ce=raw.indexOf("**CODE_END**"); if(cs!==-1){t=raw.slice(0,cs).replace(/\*\*THINKING:\*\*\s*/i,"").trim();if(ce!==-1){c=raw.slice(cs+14,ce).trim();d=raw.slice(ce+12).replace(/\*\*DONE:\*\*\s*/i,"").trim();}else c=raw.slice(cs+14).trim();}else{const hi=raw.indexOf("<!DOCTYPE"),lo=raw.indexOf("<!doctype"),s=hi!==-1?hi:lo;if(s!==-1){t=raw.slice(0,s).replace(/\*\*THINKING:\*\*\s*/i,"").trim();const e=raw.lastIndexOf("</html>");if(e!==-1){c=raw.slice(s,e+7);d=raw.slice(e+7).replace(/\*\*DONE:\*\*\s*/i,"").trim();}else c=raw.slice(s);}else t=raw.replace(/\*\*THINKING:\*\*\s*/i,"").replace(/\*\*DONE:\*\*\s*/i,"").trim();}return{thinking:t,code:c,done:d};};

  const getCreditCost = (text) => { if (text.length > 500) return 3; if (text.length > 150) return 2; return 1; };

  const send = useCallback(async text => {
    const tr = (text || input).trim(); if (!tr || loading) return;
    // Check credits
    if (!store.canUse(user.email)) { setShowUpgrade(true); return; }
    const cost = getCreditCost(tr);
    const chatId = activeChatId || "chat_" + Date.now();
    if (!activeChatId) setActiveChatId(chatId);
    const um = { role: "user", content: tr };
    const nx = [...messages, um]; setMessages(nx); setInput(""); setLoading(true); setStreaming(null); setLoadPhase("sending");
    if (inputRef.current) inputRef.current.style.height = "auto";
    try {
      setLoadPhase("generating");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const r = await fetch("/api/chat", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, max_tokens: 12000, system: SYS, messages: nx.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })) }) });
      clearTimeout(timeout);
      const data = await r.json();
      if (data.error) { throw new Error(data.error.message || data.error || "API error"); }
      const full = data.content?.map(b => b.text || "").join("") || "Something went wrong.";
      // Deduct credits
      store.useCredit(user.email, cost);
      setCredits(store.getRemaining(user.email));
      setLoadPhase("streaming"); let i = 0;
      await new Promise(res => { timerRef.current = setInterval(() => { i = Math.min(i + Math.floor(Math.random() * 20) + 8, full.length); const p = parse(full.slice(0, i)); setStreaming({ ...p, phase: p.done ? "done" : p.code ? "coding" : "thinking" }); if (i >= full.length) { clearInterval(timerRef.current); timerRef.current = null; res(); } }, 10); });
      const f = parse(full); let dm = f.done;
      if (!dm && f.code) dm = "Here's your website \u2014 " + f.code.split("\n").length + " lines. Ask me to change colors, add sections, or tweak the layout.";
      setMessages(prev => [...prev, { role: "assistant", content: full, thinking: f.thinking, code: f.code, done: dm, hasCode: !!f.code }]);
      setStreaming(null); setLoadPhase("");
      if (f.code) { setPreviewCode(f.code); setShowPreview(true); setViewMode("preview"); }
    } catch (err) { setMessages(prev => [...prev, { role: "assistant", content: err.name === "AbortError" ? "Request timed out \u2014 try a shorter prompt." : "Error: " + (err.message || "Try again.") }]); setStreaming(null); setLoadPhase(""); }
    setLoading(false);
  }, [input, loading, messages, activeChatId, user.email]);

  const newChat = () => { setActiveChatId(null); setMessages([]); setPreviewCode(null); setShowPreview(false); setStreaming(null); setLoadPhase(""); };
  const loadChat = chat => { setActiveChatId(chat.id); setMessages(chat.messages || []); setPreviewCode(null); setShowPreview(false); const lc = [...(chat.messages || [])].reverse().find(m => m.code); if (lc) { setPreviewCode(lc.code); setShowPreview(true); } };
  const deleteChat = id => { store.deleteChat(id); setChatList(store.getChats()); if (activeChatId === id) newChat(); };
  const kd = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const cp = () => { if (previewCode) { navigator.clipboard.writeText(previewCode); setCopied(true); setTimeout(() => setCopied(false), 1500); } };
  const dl = () => { if (!previewCode) return; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([previewCode], { type: "text/html" })); a.download = "app.html"; a.click(); };
  const lo = () => { store.clearSession(); onLogout(); };
  const pl = loadPhase === "sending" ? "Sending..." : loadPhase === "generating" ? "AI is thinking..." : "";
  const timeAgo = ts => { const d = Date.now() - ts; if (d < 60000) return "now"; if (d < 3600000) return Math.floor(d / 60000) + "m"; if (d < 86400000) return Math.floor(d / 3600000) + "h"; return Math.floor(d / 86400000) + "d"; };

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
      {/* Upgrade Modal */}
      {showUpgrade && <div className="upgrade-modal" onClick={() => setShowUpgrade(false)}><div className="upgrade-box" onClick={e => e.stopPropagation()}>
        <h2>Out of Credits</h2>
        <p>You've used all your credits for this period. Upgrade your plan to keep building, or wait for your daily credits to reset.</p>
        <p style={{fontSize:12,color:"var(--text3)",marginTop:-12,marginBottom:20}}>Current plan: <strong>{planData.name}</strong> | Credits remaining: <strong>{credits}</strong></p>
        <button onClick={() => { setShowUpgrade(false); onPricing(); }}>Upgrade Plan</button>
        <button className="upgrade-close" onClick={() => setShowUpgrade(false)}>Maybe Later</button>
      </div></div>}

      {/* Sidebar */}
      {sidebarOpen && <div className="sidebar">
        <div className="sb-hdr"><span className="sb-title">Chats</span><button className="sb-new" onClick={newChat}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button></div>
        <div className="sb-list">
          {chatList.length === 0 && <div className="sb-empty">No chats yet</div>}
          {chatList.map(c => <div key={c.id} className={"sb-item" + (c.id === activeChatId ? " sb-item-active" : "")} onClick={() => loadChat(c)}><div className="sb-item-text"><div className="sb-item-title">{c.title}</div><div className="sb-item-time">{timeAgo(c.updatedAt)}</div></div><button className="sb-item-del" onClick={e => { e.stopPropagation(); deleteChat(c.id); }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>)}
        </div>
        <div className="sb-footer">
          <div className="sb-user" onClick={lo}>
            <div className="sb-user-av">{user.name?.[0]?.toUpperCase()||"U"}</div>
            <div className="sb-user-info"><strong>{user.name}</strong><span>{user.email}</span></div>
            <span className="sb-plan">{planData.name}</span>
          </div>
        </div>
      </div>}

      {/* Chat */}
      <div className="left" style={{ flex: showPreview ? "0 0 440px" : "1 1 auto", maxWidth: showPreview ? 440 : "none" }}>
        <div className="hdr">
          <div className="hdr-l"><button className="hdr-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{padding:"5px 7px"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button><div className="hdr-logo"><BoltSVG s={14}/></div><span className="hdr-n">CodeCraft</span><span className="hdr-b">AI</span></div>
          <div className="hdr-r">
            <div className="credits-bar"><strong>{credits}</strong> credits</div>
            <ThemeToggle theme={theme} toggle={toggleTheme}/>
            <button className="hdr-btn" onClick={newChat}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>New</button>
          </div>
        </div>
        <div className="msgs" ref={scrollRef}>
          {isEmpty ? <div className="empty"><h1 className="ht">What do you want<br/>to <span className="hg">build</span> today?</h1><p className="hs">Describe any website. Paste URLs for inspiration or include image links.</p></div> :
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
          <div className="ib">
            <div className="model-pick" ref={modelRef}>
              <button className="model-pick-btn" onClick={() => setModelOpen(!modelOpen)}>
                <span className="model-pick-icon">{currentModel.icon}</span>
                <span className="model-pick-name">{currentModel.name}</span>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{transform:modelOpen?"rotate(180deg)":"none",transition:"transform 0.15s"}}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {modelOpen && <div className="model-drop">
                <div className="model-drop-label">Anthropic</div>
                {MODELS.filter(m=>m.provider==="anthropic").map(m=>(
                  <button key={m.id} className={"model-opt"+(m.id===selectedModel?" model-opt-on":"")} onClick={()=>{setSelectedModel(m.id);setModelOpen(false);}}>
                    <span className="model-opt-i">{m.icon}</span>
                    <span className="model-opt-n">{m.name}</span>
                    <span className="model-opt-c">{m.cost}cr</span>
                  </button>
                ))}
                <div className="model-drop-label" style={{marginTop:4}}>OpenAI</div>
                {MODELS.filter(m=>m.provider==="openai").map(m=>(
                  <button key={m.id} className={"model-opt"+(m.id===selectedModel?" model-opt-on":"")} onClick={()=>{setSelectedModel(m.id);setModelOpen(false);}}>
                    <span className="model-opt-i">{m.icon}</span>
                    <span className="model-opt-n">{m.name}</span>
                    <span className="model-opt-c">{m.cost}cr</span>
                  </button>
                ))}
              </div>}
            </div>
            <textarea ref={inputRef} className="it" value={input} onChange={e => setInput(e.target.value)} onKeyDown={kd} placeholder={isEmpty ? "Describe what you want to build..." : "Ask for changes or build something new..."} rows={1} onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}/>
            <button className="is" onClick={() => send()} disabled={loading || !input.trim()} style={{ opacity: input.trim() && !loading ? 1 : 0.25 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></button>
          </div>
          <p className="ifooter">{currentModel.icon} {currentModel.name} · {currentModel.cost} credit{currentModel.cost > 1 ? "s" : ""}/msg · {credits} remaining</p>
        </div>
      </div>

      {/* Preview */}
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
  const [theme, setTheme] = useState(() => store.getTheme());

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { const s = store.getSession(); if (s) { setUser(s); setPage("app"); } }, []);
  // Check for Stripe success
  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get("plan") === "success" && user) { store.setPlan(user.email, "pro"); window.history.replaceState({}, "", "/"); } }, [user]);

  const toggleTheme = () => { const t = theme === "dark" ? "light" : "dark"; setTheme(t); store.setTheme(t); };
  const goToPricing = () => { setPage("home"); setTimeout(() => document.getElementById("pricing")?.scrollIntoView({behavior:"smooth"}), 100); };

  return (
    <>
      {page === "home" && <HomePage onGetStarted={() => setPage("auth")} onPricing={goToPricing} theme={theme} toggleTheme={toggleTheme}/>}
      {page === "auth" && <AuthPage onLogin={u => { setUser(u); setPage("app"); }} onBack={() => setPage("home")}/>}
      {page === "app" && user && <MainApp user={user} onLogout={() => { setUser(null); setPage("home"); }} theme={theme} toggleTheme={toggleTheme} onPricing={goToPricing}/>}
    </>
  );
}
