"use client"
import { useState, useEffect, } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Globe,
  ArrowRight,
  Clock3,
  Terminal,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Monitorizer — landing page
// Signature element: a live "pulse strip" — an ECG-style line that beats
// steadily, then flatlines and fires an alert, mirroring exactly what the
// product watches for. Feed of fake check logs ticks underneath it like a
// terminal, because that's the actual artifact a dev looks at all day.
// ---------------------------------------------------------------------------

const FEED = [
  { host: "api.usehatch.dev", code: 200, ms: 84, ok: true },
  { host: "checkout.pixelforge.io", code: 200, ms: 112, ms2: true, ok: true },
  { host: "cdn.northlane.app", code: 200, ms: 51, ok: true },
  { host: "auth.usehatch.dev", code: 503, ms: 0, ok: false },
  { host: "docs.pixelforge.io", code: 200, ms: 97, ok: true },
  { host: "status.northlane.app", code: 200, ms: 63, ok: true },
];

function PulseStrip() {
  return (
    <div className="pulse-wrap">
      <svg viewBox="0 0 600 120" className="pulse-svg" preserveAspectRatio="none">
        <line x1="0" y1="60" x2="600" y2="60" stroke="#1c2b28" strokeWidth="1" />
        <path
          className="pulse-line"
          d="M0,60 L60,60 L80,60 L95,20 L110,100 L125,40 L140,60 L200,60
             L260,60 L280,60 L295,20 L310,100 L325,40 L340,60 L400,60
             L430,60 L445,60 L460,60 L475,60 L490,60 L600,60"
          fill="none"
          stroke="#3ddc97"
          strokeWidth="2.5"
        />
        <circle className="pulse-dot" r="4" fill="#3ddc97">
          <animateMotion
            dur="4s"
            repeatCount="indefinite"
            path="M0,60 L60,60 L80,60 L95,20 L110,100 L125,40 L140,60 L200,60
                  L260,60 L280,60 L295,20 L310,100 L325,40 L340,60 L400,60
                  L430,60 L445,60 L460,60 L475,60 L490,60 L600,60"
          />
        </circle>
      </svg>
      <div className="pulse-glow" />
    </div>
  );
}

function LiveFeed() {
  const [visible, setVisible] = useState(2);
  useEffect(() => {
    const id = setInterval(() => {
      setVisible((v) => (v >= FEED.length ? 1 : v + 1));
    }, 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="feed">
      <div className="feed-head">
        <Terminal size={13} strokeWidth={2} />
        <span>live checks</span>
        <span className="feed-dot" />
      </div>
      <div className="feed-body">
        {FEED.slice(0, visible).map((f, i) => (
          <div key={f.host + i} className={`feed-row ${f.ok ? "ok" : "bad"}`}>
            <span className="feed-status">{f.ok ? "UP" : "DOWN"}</span>
            <span className="feed-host">{f.host}</span>
            <span className="feed-code">{f.code}</span>
            <span className="feed-ms">{f.ok ? `${f.ms}ms` : "timeout"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


const FEATURES = [
  {
    icon: Clock3,
    title: "Checked every 3 minutes",
    body: "A request goes out to every site on your list around the clock — no cron jobs or servers for you to babysit.",
  },
  {
    icon: Bell,
    title: "Told the moment it drops",
    body: "The second a check fails, you hear about it. No refreshing a dashboard to find out your API has been down for an hour.",
  },
  {
    icon: Globe,
    title: "Any URL, instantly",
    body: "Paste a URL, we start watching. Landing pages, APIs, webhooks, staging environments — if it responds to a request, we track it.",
  },
  {
    icon: Zap,
    title: "Response time, logged",
    body: "Every check records latency alongside status, so a slow creep toward 2000ms shows up before it becomes an outage.",
  },
];

const STEPS = [
  { n: "01", title: "Add a site", body: "Drop in a URL. That's the whole setup." },
  { n: "02", title: "We ping it, on a clock", body: "Every 3 minutes, a request goes out and the response gets logged." },
  { n: "03", title: "You get the signal", body: "Status flips to DOWN the moment a check fails — you're notified right away." },
];

export default function App() {
  const router = useRouter()

  return (
    <div className="page">
      <style>{`
        :root {
          --bg: #0a0f0d;
          --bg-raised: #0f1613;
          --line: #1c2b28;
          --ink: #e9f3ee;
          --ink-dim: #7f9690;
          --green: #3ddc97;
          --green-dim: #2a9d6f;
          --red: #ff5d5d;
          --mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
          --sans: 'Inter', -apple-system, sans-serif;
        }
        * { box-sizing: border-box; }
        .page {
          background: var(--bg);
          color: var(--ink);
          font-family: var(--sans);
          min-height: 100vh;
          width: 100%;
        }
        .wrap { max-width: 1080px; margin: 0 auto; padding: 0 28px; }

        /* NAV */
        nav.top { border-bottom: 1px solid var(--line); }
        nav.top .wrap { display: flex; align-items: center; justify-content: space-between; height: 68px; }
        .brand { display: flex; align-items: center; gap: 9px; font-family: var(--mono); font-weight: 600; font-size: 15px; letter-spacing: 0.02em; }
        .brand .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }
        .nav-links { display: flex; gap: 28px; font-size: 13.5px; color: var(--ink-dim); }
        .nav-links a { color: var(--ink-dim); text-decoration: none; }
        .nav-links a:hover { color: var(--ink); }
        .nav-cta { font-family: var(--mono); font-size: 13px; background: var(--green); color: #06120d; padding: 8px 16px; border-radius: 6px; font-weight: 600; text-decoration: none; }

        /* HERO */
        .hero { padding: 84px 0 40px; border-bottom: 1px solid var(--line); }
        .eyebrow { font-family: var(--mono); font-size: 12.5px; color: var(--green); letter-spacing: 0.08em; display: flex; align-items: center; gap: 8px; margin-bottom: 22px; }
        .eyebrow::before { content: ''; width: 22px; height: 1px; background: var(--green-dim); }
        h1.hero-title { font-family: var(--mono); font-size: clamp(32px, 5vw, 54px); line-height: 1.08; font-weight: 700; letter-spacing: -0.01em; max-width: 780px; margin: 0 0 20px; }
        h1.hero-title .cut { color: var(--red); }
        .hero-sub { color: var(--ink-dim); font-size: 16.5px; max-width: 520px; line-height: 1.6; margin: 0 0 32px; }
        .hero-actions { display: flex; gap: 12px; margin-bottom: 56px; }
        .btn-primary { font-family: var(--mono); background: var(--green); color: #06120d; border: none; padding: 12px 20px; border-radius: 7px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .btn-ghost { font-family: var(--mono); background: transparent; color: var(--ink); border: 1px solid var(--line); padding: 12px 20px; border-radius: 7px; font-size: 14px; cursor: pointer; }

        /* PULSE + FEED */
        .pulse-wrap { position: relative; height: 120px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); margin-bottom: 0; overflow: hidden; }
        .pulse-svg { width: 100%; height: 100%; display: block; }
        .pulse-line { stroke-dasharray: 900; stroke-dashoffset: 900; animation: draw 4s linear infinite; }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        .pulse-glow { position: absolute; inset: 0; box-shadow: inset 0 0 40px rgba(61,220,151,0.06); pointer-events: none; }

        .feed { border-bottom: 1px solid var(--line); background: var(--bg-raised); }
        .feed-head { display: flex; align-items: center; gap: 8px; padding: 12px 28px; font-family: var(--mono); font-size: 11.5px; color: var(--ink-dim); letter-spacing: 0.06em; max-width: 1080px; margin: 0 auto; }
        .feed-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); margin-left: auto; animation: blink 1.6s ease-in-out infinite; }
        @keyframes blink { 50% { opacity: 0.25; } }
        .feed-body { max-width: 1080px; margin: 0 auto; padding: 0 28px 16px; min-height: 132px; }
        .feed-row { display: grid; grid-template-columns: 52px 1fr 56px 70px; gap: 12px; font-family: var(--mono); font-size: 12.5px; padding: 5px 0; color: var(--ink-dim); animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }
        .feed-row .feed-status { font-weight: 700; }
        .feed-row.ok .feed-status { color: var(--green); }
        .feed-row.bad .feed-status { color: var(--red); }
        .feed-row .feed-host { color: var(--ink); }

        /* FEATURES */
        .section { padding: 88px 0; border-bottom: 1px solid var(--line); }
        .section-label { font-family: var(--mono); font-size: 12px; color: var(--green); letter-spacing: 0.08em; margin-bottom: 12px; }
        .section-title { font-family: var(--mono); font-size: 28px; font-weight: 700; margin: 0 0 48px; max-width: 560px; }
        .feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); }
        .feature-card { background: var(--bg); padding: 30px; }
        .feature-card svg { color: var(--green); margin-bottom: 16px; }
        .feature-card h4 { font-size: 16px; margin: 0 0 8px; font-weight: 600; }
        .feature-card p { color: var(--ink-dim); font-size: 14px; line-height: 1.6; margin: 0; }

        /* STEPS */
        .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
        .step .n { font-family: var(--mono); color: var(--green-dim); font-size: 13px; margin-bottom: 10px; }
        .step h4 { font-size: 16px; margin: 0 0 8px; font-weight: 600; }
        .step p { color: var(--ink-dim); font-size: 14px; line-height: 1.6; margin: 0; }

        /* AUTH */
        .auth-section { padding: 88px 0; display: flex; justify-content: center; }
        .auth-card { width: 100%; max-width: 400px; background: var(--bg-raised); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
        .auth-tabs { display: flex; border-bottom: 1px solid var(--line); }
        .tab { flex: 1; background: none; border: none; color: var(--ink-dim); font-family: var(--sans); font-size: 13.5px; font-weight: 500; padding: 14px; cursor: pointer; }
        .tab.active { color: var(--ink); background: rgba(61,220,151,0.06); box-shadow: inset 0 -2px 0 var(--green); }
        .auth-body { padding: 26px 26px 24px; }
        .auth-title { font-size: 19px; font-weight: 700; margin: 0 0 6px; }
        .auth-sub { color: var(--ink-dim); font-size: 13.5px; margin: 0 0 22px; line-height: 1.5; }
        .auth-form { display: flex; flex-direction: column; gap: 11px; }
        .field { position: relative; display: flex; align-items: center; }
        .field-icon { position: absolute; left: 12px; color: var(--ink-dim); pointer-events: none; }
        .field input { width: 100%; background: var(--bg); border: 1px solid var(--line); border-radius: 7px; padding: 10px 12px 10px 36px; color: var(--ink); font-size: 13.5px; font-family: var(--sans); outline: none; }
        .field input:focus { border-color: var(--green-dim); }
        .pw-toggle { position: absolute; right: 10px; background: none; border: none; color: var(--ink-dim); cursor: pointer; padding: 2px; display: flex; }
        .label-row { display: flex; justify-content: space-between; align-items: center; margin: -2px 0 -2px; }
        .link-muted { background: none; border: none; color: var(--green); font-size: 12px; cursor: pointer; padding: 0; }
        .strength { display: flex; align-items: center; gap: 8px; margin-top: -2px; }
        .strength-bars { display: flex; gap: 4px; }
        .bar { width: 26px; height: 3px; border-radius: 2px; background: var(--line); }
        .bar.on.s1 { background: var(--red); }
        .bar.on.s2 { background: #f0b64c; }
        .bar.on.s3 { background: var(--green); }
        .strength-label { font-family: var(--mono); font-size: 11px; color: var(--ink-dim); }
        .auth-submit { margin-top: 6px; background: var(--green); color: #06120d; border: none; border-radius: 7px; padding: 11px; font-weight: 700; font-size: 13.5px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; }
        .auth-divider { display: flex; align-items: center; gap: 10px; color: var(--ink-dim); font-size: 11.5px; margin: 18px 0; font-family: var(--mono); }
        .auth-divider span { flex: 1; height: 1px; background: var(--line); }
        .oauth-btn { width: 100%; background: var(--bg); border: 1px solid var(--line); color: var(--ink); border-radius: 7px; padding: 10px; font-size: 13.5px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .auth-switch { text-align: center; font-size: 13px; color: var(--ink-dim); margin: 18px 0 0; }
        .auth-switch button { background: none; border: none; color: var(--green); cursor: pointer; font-size: 13px; padding: 0; }

        footer { padding: 32px 0; }
        footer .wrap { display: flex; justify-content: space-between; align-items: center; font-family: var(--mono); font-size: 12px; color: var(--ink-dim); }

        @media (max-width: 720px) {
          .nav-links { display: none; }
          .feature-grid { grid-template-columns: 1fr; }
          .steps { grid-template-columns: 1fr; }
          .feed-row { grid-template-columns: 44px 1fr 44px; }
          .feed-row .feed-ms { display: none; }
        }
      `}</style>

      <nav className="top">
        <div className="wrap">
          <div className="brand"><span className="dot" /> monitorizer</div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
          </div>
          <a onClick={()=>{router.push("/auth")}} className="nav-cta cursor-pointer">Sign in</a>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <div className="eyebrow">STATUS · CHECKED EVERY 3 MINUTES</div>
          <h1 className="hero-title">
            Know your site is up<br />before your <span className="cut">users</span> tell you it's down.
          </h1>
          <p className="hero-sub">
            Monitorizer pings every site you add every three minutes and keeps a running log of
            what came back — status, response time, and the moment something breaks.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={()=>{router.push("/auth")}}>
              Start monitoring free <ArrowRight size={15} />
            </button>
            <button  className="btn-ghost"><a href="#how">See how it works</a></button>
          </div>
        </div>
        <PulseStrip />
        <LiveFeed />
      </header>

      <section className="section" id="features">
        <div className="wrap">
          <div className="section-label">WHAT IT WATCHES</div>
          <h2 className="section-title">Four things every check reports back.</h2>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <f.icon size={22} strokeWidth={1.8} />
                <h4>{f.title}</h4>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="wrap">
          <div className="section-label">SETUP</div>
          <h2 className="section-title">Three steps, then it runs itself.</h2>
          <div className="steps">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <div className="n">{s.n}</div>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

     <footer>
        <div className="wrap">
          <span>monitorizer — uptime, checked every 3 min</span>
          <span className="brand"><span className="dot" /> status: all systems normal</span>
        </div>
      </footer>
    </div>
  );
}