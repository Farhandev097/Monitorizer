"use client"
import axios from 'axios'
import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react"
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// /auth — dedicated sign in / sign up page
// Left rail: brand, a beating pulse line, an animated uptime readout, and
// the reasons someone signs up. Right: the actual form. Same palette/type
// as the landing page, but built to stand alone as its own route.
// ---------------------------------------------------------------------------
interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon
  right?: React.ReactNode
}
function Field({ icon: Icon, right, ...props } : FieldProps) {
  return (
    <div className="mp-field">
      <Icon size={16} strokeWidth={2} className="mp-field-icon" />
      <input {...props} />
      {right}
    </div>
  );
}

function PulseMini() {
  return (
    <svg viewBox="0 0 300 80" className="mp-pulse" preserveAspectRatio="none">
      <line x1="0" y1="40" x2="300" y2="40" stroke="var(--mp-line)" strokeWidth="1" />
      <path
        className="mp-pulse-line"
        d="M0,40 L40,40 L52,40 L63,14 L74,66 L85,26 L96,40 L150,40
           L190,40 L202,40 L213,14 L224,66 L235,26 L246,40 L300,40"
        fill="none"
        stroke="var(--mp-green)"
        strokeWidth="2"
      />
      <circle r="3.5" fill="var(--mp-green)">
        <animateMotion
          dur="3.2s"
          repeatCount="indefinite"
          path="M0,40 L40,40 L52,40 L63,14 L74,66 L85,26 L96,40 L150,40
                L190,40 L202,40 L213,14 L224,66 L235,26 L246,40 L300,40"
        />
      </circle>
    </svg>
  );
}

function UptimeTicker() {
  const [n, setN] = useState(99.9);
  useEffect(() => {
    const id = setInterval(() => {
      setN((v) => Number((99.94 + Math.random() * 0.05).toFixed(2)));
    }, 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mp-ticker">
      <span className="mp-ticker-dot" />
      <span className="mp-ticker-label">uptime, last 30 days</span>
      <span className="mp-ticker-val">{n}%</span>
    </div>
  );
}

const POINTS = [
  "Checks run every 3 minutes, automatically",
  "Notified the moment a check fails",
  "Response time logged on every request",
];

export default function AuthPage() {
   
  const router = useRouter()  
  const [mode, setMode] = useState("signup");
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState("");
  const strength = pw.length === 0 ? 0 : pw.length < 8 ? 1 : pw.length < 12 ? 2 : 3;

  async function handleSubmit(e : any) {
    e.preventDefault();
        const form = new FormData(e.target);
        const payload =
           mode === "signup"
        ? { name: form.get("name"), email: form.get("email"), password: form.get("password") }
        : { email: form.get("email"), password: form.get("password") };
        if(mode === 'signup') {
          const res : any = await axios.post('http://localhost:3003/v1/signup', {
            email : payload.email,
            name : payload.name,
            password : payload.password
          })
          if(!res.data.success) {
            return
          } else {        
            setMode("signin")                  
          }
        } else {
          const res : any = await axios.post('http://localhost:3003/v1/signin', {
            email : payload.email,
            password : payload.password            
          })
          if(!res.data.success) {
            return 
          } else {
            localStorage.setItem("token", res.data.token)
            router.push('./dashboard')
          }

        }
  }

  return (
    <div className="mp-page">
      <style>{`
        .mp-page {
          --mp-bg: #0a0f0d;
          --mp-bg-raised: #0f1613;
          --mp-line: #1c2b28;
          --mp-ink: #e9f3ee;
          --mp-ink-dim: #7f9690;
          --mp-green: #3ddc97;
          --mp-green-dim: #2a9d6f;
          --mp-red: #ff5d5d;
          --mp-amber: #f0b64c;
          --mp-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
          --mp-sans: 'Inter', -apple-system, sans-serif;
          background: var(--mp-bg);
          color: var(--mp-ink);
          font-family: var(--mp-sans);
          min-height: 100vh;
        }
        * { box-sizing: border-box; }

        .mp-grid { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }

        /* LEFT RAIL */
        .mp-rail {
          position: relative;
          background:
            radial-gradient(circle at 15% 12%, rgba(61,220,151,0.10), transparent 45%),
            var(--mp-bg-raised);
          border-right: 1px solid var(--mp-line);
          padding: 44px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }
        .mp-rail::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--mp-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--mp-line) 1px, transparent 1px);
          background-size: 42px 42px;
          opacity: 0.25;
          mask-image: radial-gradient(circle at 20% 20%, black, transparent 65%);
        }
        .mp-back, .mp-brand, .mp-rail-inner { position: relative; z-index: 1; }
        .mp-back {
          position: absolute; top: 40px; left: 48px;
          display: flex; align-items: center; gap: 6px;
          font-family: var(--mp-mono); font-size: 12.5px; color: var(--mp-ink-dim);
          text-decoration: none; background: none; border: none; cursor: pointer; padding: 0;
        }
        .mp-back:hover { color: var(--mp-ink); }
        .mp-brand {
          position: absolute; top: 40px; right: 48px;
          font-family: var(--mp-mono); font-weight: 600; font-size: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .mp-brand .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--mp-green); box-shadow: 0 0 8px var(--mp-green); }

        .mp-ticker {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(61,220,151,0.07); border: 1px solid var(--mp-green-dim);
          border-radius: 20px; padding: 6px 12px 6px 10px; margin-bottom: 26px; width: fit-content;
        }
        .mp-ticker-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--mp-green); animation: mp-blink 1.6s ease-in-out infinite; }
        @keyframes mp-blink { 50% { opacity: 0.3; } }
        .mp-ticker-label { font-family: var(--mp-mono); font-size: 11px; color: var(--mp-ink-dim); }
        .mp-ticker-val { font-family: var(--mp-mono); font-size: 11.5px; color: var(--mp-green); font-weight: 700; }

        .mp-pulse { width: 100%; max-width: 320px; height: 64px; margin-bottom: 26px; }
        .mp-pulse-line { stroke-dasharray: 420; stroke-dashoffset: 420; animation: mp-draw 3.2s linear infinite; }
        @keyframes mp-draw { to { stroke-dashoffset: 0; } }

        .mp-rail-title { font-family: var(--mp-mono); font-size: 27px; line-height: 1.25; font-weight: 700; max-width: 380px; margin: 0 0 14px; letter-spacing: -0.01em; }
        .mp-rail-sub { color: var(--mp-ink-dim); font-size: 14.5px; line-height: 1.6; max-width: 360px; margin: 0 0 30px; }
        .mp-points { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .mp-points li { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--mp-ink-dim); }
        .mp-points li svg { color: var(--mp-green); flex-shrink: 0; }

        /* RIGHT FORM SIDE */
        .mp-form-side { display: flex; align-items: center; justify-content: center; padding: 40px 32px; }
        .mp-form-col { width: 100%; max-width: 380px; }

        .mp-tabs { display: flex; background: var(--mp-bg-raised); border: 1px solid var(--mp-line); border-radius: 9px; padding: 3px; margin-bottom: 28px; }
        .mp-tab { flex: 1; background: none; border: none; color: var(--mp-ink-dim); font-family: var(--mp-mono); font-size: 12.5px; font-weight: 600; padding: 9px; border-radius: 6px; cursor: pointer; letter-spacing: 0.02em; }
        .mp-tab.active { background: var(--mp-green); color: #06120d; }

        .mp-head { margin-bottom: 24px; }
        .mp-head h1 { font-family: var(--mp-mono); font-size: 25px; font-weight: 700; margin: 0 0 8px; }
        .mp-head p { color: var(--mp-ink-dim); font-size: 13.5px; line-height: 1.5; margin: 0; }

        .mp-form { display: flex; flex-direction: column; gap: 6px; }
        .mp-label { font-size: 12.5px; color: var(--mp-ink-dim); margin: 12px 0 6px; font-weight: 500; }
        .mp-label-row { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
        .mp-label-row .mp-label { margin: 0 0 6px; }
        .mp-link-muted { background: none; border: none; color: var(--mp-green); font-size: 12.5px; cursor: pointer; padding: 0; }

        .mp-field { position: relative; display: flex; align-items: center; }
        .mp-field-icon { position: absolute; left: 12px; color: var(--mp-ink-dim); pointer-events: none; }
        .mp-field input { width: 100%; background: var(--mp-bg-raised); border: 1px solid var(--mp-line); border-radius: 8px; padding: 11px 12px 11px 36px; color: var(--mp-ink); font-size: 14px; font-family: var(--mp-sans); outline: none; transition: border-color 0.15s; }
        .mp-field input:focus { border-color: var(--mp-green-dim); }
        .mp-pw-toggle { position: absolute; right: 10px; background: none; border: none; color: var(--mp-ink-dim); cursor: pointer; padding: 2px; display: flex; }

        .mp-strength { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
        .mp-strength-bars { display: flex; gap: 4px; }
        .mp-bar { width: 26px; height: 3px; border-radius: 2px; background: var(--mp-line); }
        .mp-bar.on.s1 { background: var(--mp-red); }
        .mp-bar.on.s2 { background: var(--mp-amber); }
        .mp-bar.on.s3 { background: var(--mp-green); }
        .mp-strength-label { font-family: var(--mp-mono); font-size: 11px; color: var(--mp-ink-dim); }

        .mp-submit { margin-top: 20px; background: var(--mp-green); color: #06120d; border: none; border-radius: 8px; padding: 12px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s; }
        .mp-submit:hover { background: #4de8a4; }

        .mp-divider { display: flex; align-items: center; gap: 10px; color: var(--mp-ink-dim); font-size: 11.5px; margin: 20px 0; font-family: var(--mp-mono); }
        .mp-divider span { flex: 1; height: 1px; background: var(--mp-line); }

        .mp-oauth { width: 100%; background: var(--mp-bg-raised); border: 1px solid var(--mp-line); color: var(--mp-ink); border-radius: 8px; padding: 11px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: border-color 0.15s; }
        .mp-oauth:hover { border-color: var(--mp-green-dim); }

        .mp-terms { font-size: 12px; color: var(--mp-ink-dim); text-align: center; margin: 18px 0 0; line-height: 1.5; }

        @media (max-width: 860px) {
          .mp-grid { grid-template-columns: 1fr; }
          .mp-rail { display: none; }
          .mp-form-side { padding: 90px 24px 40px; }
        }
      `}</style>

      <div className="mp-grid">
        <div className="mp-rail">
          <button className="mp-back" type="button" onClick={() => {router.push("/")}} >
            <ArrowLeft size={13} /> Back to home
          </button>
          <div className="mp-brand"><span className="dot" /> monitorizer</div>

          <div className="mp-rail-inner">
            <UptimeTicker />
            <PulseMini />
            <h2 className="mp-rail-title">
              {mode === "signup"
                ? <>Every site you add,<br />checked every 3 minutes.</>
                : <>Your sites are still<br />being watched.</>}
            </h2>
            <p className="mp-rail-sub">
              {mode === "signup"
                ? "Free for up to 3 sites. No card required to start."
                : "Sign in to see the last check on everything you're tracking."}
            </p>
            <ul className="mp-points">
              {POINTS.map((p) => (
                <li key={p}><CheckCircle2 size={15} /> {p}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mp-form-side">
          <div className="mp-form-col">
            <div className="mp-tabs">
              <button
                className={mode === "signup" ? "mp-tab active" : "mp-tab"}
                onClick={() => setMode("signup")}
                type="button"
              >
                CREATE ACCOUNT
              </button>
              <button
                className={mode === "signin" ? "mp-tab active" : "mp-tab"}
                onClick={() => setMode("signin")}
                type="button"
              >
                SIGN IN
              </button>
            </div>

            <div className="mp-head">
              <h1>{mode === "signup" ? "Create your account" : "Sign in"}</h1>
              <p>
                {mode === "signup"
                  ? "Add your first site right after — checks start within 3 minutes."
                  : "Welcome back — your dashboard picked up right where it left off."}
              </p>
            </div>

            <form className="mp-form" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <>
                  <label className="mp-label">Full name</label>
                  <Field icon={User} name="name" type="text" placeholder="Ada Lovelace" required autoFocus />
                </>
              )}

              <label className="mp-label">Email</label>
              <Field icon={Mail} name="email" type="email" placeholder="you@company.com" required autoFocus={mode === "signin"} />

             
                <div className="mp-label-row">
                  <label className="mp-label">Password</label>
                </div>
        
              <Field
                icon={Lock}
                name="password"
                type={showPw ? "text" : "password"}
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                required
                minLength={8}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                right={
                  <button type="button" className="mp-pw-toggle" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
              {mode === "signup" && pw.length > 0 && (
                <div className="mp-strength">
                  <div className="mp-strength-bars">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className={i < strength ? `mp-bar on s${strength}` : "mp-bar"} />
                    ))}
                  </div>
                  <span className="mp-strength-label">
                    {strength === 1 ? "Weak" : strength === 2 ? "Good" : "Strong"}
                  </span>
                </div>
              )}

              <button type="submit" className="mp-submit">
                {mode === "signup" ? "Create free account" : "Sign in"}
                <ArrowRight size={15} strokeWidth={2.2} />
              </button>
            </form>

            {mode === "signup" && (
              <p className="mp-terms">
                By creating an account you agree to the Terms and Privacy Policy.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}