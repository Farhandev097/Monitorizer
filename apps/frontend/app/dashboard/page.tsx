"use client"
import axios from "axios"
import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ExternalLink, Clock3, RefreshCw, Globe, Activity, Zap, TrendingUp, X, Link2, BarChart2, Trash2 } from "lucide-react"

// ---------------------------------------------------------------------------
// /dashboard — v3
// Adds staleness handling: if the latest tick for a site is older than the
// 3-min check cadence (+ a small buffer for jitter), the displayed status
// falls back to "Unknown" rather than showing a stuck/stale Up or Down.
// The moment a fresh tick arrives, it flips back to the real status.
// `now` is tracked once at the Dashboard level and passed down, so there's
// a single ticking clock rather than one per card.
// ---------------------------------------------------------------------------

interface Tick {
  id: string
  response_time_ms: number
  status: "Up" | "Down" | "Unknown"
  region_id: string
  website_id: string
  createdAt: string
}

interface Website {
  id: string
  url: string
  user_id: string
  time_added: string
  ticks: Tick[]
}

interface AddWebsiteModalProps {
  onClose: () => void
  onAdded: (website: Website) => void
}

const STALE_MS = 3 * 60 * 1000 + 15_000 // 3 min cadence + buffer for jitter/network delay

function getDisplayStatus(latest: Tick | undefined, now: number): "Up" | "Down" | "Unknown" {
  if (!latest) return "Unknown"
  const age = now - new Date(latest.createdAt).getTime()
  if (age > STALE_MS) return "Unknown"
  return latest.status
}

// single shared clock — re-renders periodically so cards can flip to
// "Unknown" on their own between fetches, not just when new data arrives
function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

function UptimeRing({ ticks }: { ticks: Tick[] }) {
  const total = ticks?.length ?? 0
  const up = ticks?.filter((t) => t.status === "Up").length ?? 0
  const pct = total ? Math.round((up / total) * 100) : 100
  const r = 20
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  const tone = pct >= 99 ? "var(--md-green)" : pct >= 95 ? "var(--md-amber)" : "var(--md-red)"

  return (
    <div className="md-ring-wrap">
      <svg viewBox="0 0 48 48" className="md-ring">
        <circle cx="24" cy="24" r={r} className="md-ring-track" />
        <circle
          cx="24" cy="24" r={r}
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ stroke: tone }}
          className="md-ring-fill"
        />
      </svg>
      <span className="md-ring-pct">{pct}%</span>
    </div>
  )
}

function WebsiteCard({ site, now, onDeleteClick }: { site: Website; now: number; onDeleteClick: (site: Website) => void }) {
  const latest = site.ticks?.[0]
  const status = getDisplayStatus(latest, now)
  const badgeCls = status === "Up" ? "md-up" : status === "Down" ? "md-down" : "md-unknown"

  return (
    <div className="md-card">
      <div className="md-card-top">
        <div className="md-url-row">
          <Globe size={15} className="md-url-icon" />
          <span className="md-url">{site.url.replace(/^https?:\/\//, "")}</span>
        </div>
        <div className="md-card-top-actions">
          <a href={site.url} target="_blank" rel="noreferrer" className="md-external">
            <ExternalLink size={13} />
          </a>
          <button
            type="button"
            className="md-delete-icon"
            onClick={() => onDeleteClick(site)}
            aria-label="Remove site"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="md-card-mid">
        <UptimeRing ticks={site.ticks} />
        <div className="md-card-stats">
          <div className={`md-badge ${badgeCls}`}>
            <span className="md-badge-dot" />
            {status.toUpperCase()}
          </div>
          <div className="md-stat-row">
            <Zap size={12} />
            {latest ? `${Math.max(0, latest.response_time_ms)}ms` : "—"}
          </div>
          <div className="md-stat-row md-dim">
            <Clock3 size={12} />
            {latest ? timeAgo(latest.createdAt) : "no checks yet"}
          </div>
        </div>
      </div>

      <Link href={`/website-status/${site.id}`} className="md-details-btn">
        <BarChart2 size={13} /> View last 30 min
      </Link>
    </div>
  )
}
function DeleteConfirmModal({ site, onClose, onConfirm, deleting }: {
  site: Website
  onClose: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  return (
    <div className="md-modal-backdrop" onClick={onClose}>
      <div className="md-modal" onClick={(e) => e.stopPropagation()}>
        <div className="md-modal-head">
          <h3>Remove this site?</h3>
          <button className="md-modal-close" onClick={onClose} type="button" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <p className="md-modal-sub">
          You'll stop monitoring <strong style={{ color: "var(--md-ink)" }}>{site.url.replace(/^https?:\/\//, "")}</strong>.
          This can't be undone.
        </p>

        <div className="md-modal-form">
          <button
            type="button"
            className="md-modal-submit md-modal-danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Removing…" : "Remove site"}
          </button>
          <button
            type="button"
            className="md-modal-cancel"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function AddWebsiteModal({ onClose, onAdded }: AddWebsiteModalProps) {
  const [url, setUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      const parsed = new URL(url)
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setError("URL must start with http:// or https://")
        return
      }
    } catch {
      setError("That doesn't look like a valid URL")
      return
    }

    const token = localStorage.getItem("token")
    setSubmitting(true)
    axios
      .post(
        "https://monitorizer.onrender.com/v1/add-website",
        { url },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        onAdded(res.data.website)
        onClose()
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? "Couldn't add that site — try again.")
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="md-modal-backdrop" onClick={onClose}>
      <div className="md-modal" onClick={(e) => e.stopPropagation()}>
        <div className="md-modal-head">
          <h3>Add a site to watch</h3>
          <button className="md-modal-close" onClick={onClose} type="button" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <p className="md-modal-sub">Paste any URL — checks start within 3 minutes.</p>

        <form onSubmit={handleSubmit} className="md-modal-form">
          <div className="md-modal-field">
            <Link2 size={15} className="md-modal-field-icon" />
            <input
              type="text"
              placeholder="https://yourapp.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
              required
            />
          </div>

          {error && <div className="md-modal-error">{error}</div>}

          <button type="submit" className="md-modal-submit" disabled={submitting}>
            {submitting ? "Adding…" : "Start monitoring"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const now = useNow()
  const [deleteTarget, setDeleteTarget] = useState<Website | null>(null)
const [deleting, setDeleting] = useState(false)

const handleDelete = useCallback(() => {
  if (!deleteTarget) return
  const token = localStorage.getItem("token")
  setDeleting(true)
  axios
    .delete(`https://monitorizer.onrender.com/v1/delete/${deleteTarget.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      setWebsites((prev) => prev.filter((w) => w.id !== deleteTarget.id))
      setDeleteTarget(null)
    })
    .catch((err) => {
      setError(err.response?.data?.message ?? "Couldn't remove that site — try again.")
    })
    .finally(() => setDeleting(false))
}, [deleteTarget])

  const handleAdded = useCallback((newSite: Website) => {
    setWebsites((prev) => [{ ...newSite, ticks: [] }, ...prev])
  }, [])

  const fetchWebsites = useCallback(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/")
      return
    }
    axios
      .get("https://monitorizer.onrender.com/v1/get-user", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setName(res.data.userWithWebsites.name)
        setWebsites(res.data.userWithWebsites.websites)
        setError(null)
      })
      .catch((err) => {
        console.error("Failed to fetch websites:", err)
        setError("Couldn't load your sites — check the API is running.")
      })
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    fetchWebsites()
    const id = setInterval(fetchWebsites, 3 * 60 * 1000) // matches the 3-min check cadence
    return () => clearInterval(id)
  }, [fetchWebsites])

  const overview = useMemo(() => {
    const up = websites.filter((w) => getDisplayStatus(w.ticks?.[0], now) === "Up").length
    const down = websites.filter((w) => getDisplayStatus(w.ticks?.[0], now) === "Down").length
    const allTicks = websites.flatMap((w) => w.ticks ?? [])
    const avgMs = allTicks.length
      ? Math.round(allTicks.reduce((s, t) => s + Math.max(0, t.response_time_ms), 0) / allTicks.length)
      : 0
    const upTicks = allTicks.filter((t) => t.status === "Up").length
    const overallUptime = allTicks.length ? ((upTicks / allTicks.length) * 100).toFixed(1) : "100.0"
    return { up, down, avgMs, overallUptime, total: websites.length }
  }, [websites, now])

  return (
    <div className="md-page">
      <style>{`
        .md-page {
          --md-bg: #0a0f0d;
          --md-bg-raised: #0f1613;
          --md-line: #1c2b28;
          --md-ink: #e9f3ee;
          --md-ink-dim: #7f9690;
          --md-green: #3ddc97;
          --md-green-dim: #2a9d6f;
          --md-red: #ff5d5d;
          --md-amber: #f0b64c;
          --md-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
          --md-sans: 'Inter', -apple-system, sans-serif;
          background: var(--md-bg);
          color: var(--md-ink);
          font-family: var(--md-sans);
          min-height: 100vh;
        }
        * { box-sizing: border-box; }
        .md-wrap { max-width: 1040px; margin: 0 auto; padding: 0 28px; }

        .md-nav { border-bottom: 1px solid var(--md-line); position: sticky; top: 0; background: rgba(10,15,13,0.85); backdrop-filter: blur(8px); z-index: 5; }
        .md-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; }
        .md-brand { display: flex; align-items: center; gap: 9px; font-family: var(--md-mono); font-weight: 600; font-size: 15px; }
        .md-brand .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--md-green); box-shadow: 0 0 8px var(--md-green); }
        .md-hello { font-size: 13.5px; color: var(--md-ink-dim); }

        .md-head { padding: 36px 0 24px; display: flex; justify-content: space-between; align-items: flex-end; }
        .md-title { font-family: var(--md-mono); font-size: 25px; font-weight: 700; margin: 0; }
        .md-add { font-family: var(--md-mono); background: var(--md-green); color: #06120d; border: none; padding: 10px 16px; border-radius: 7px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .md-add:hover { background: #4de8a4; }

        .md-overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--md-line); border: 1px solid var(--md-line); border-radius: 10px; overflow: hidden; margin-bottom: 32px; }
        .md-ov-cell { background: var(--md-bg-raised); padding: 18px 20px; }
        .md-ov-label { display: flex; align-items: center; gap: 6px; font-family: var(--md-mono); font-size: 11px; color: var(--md-ink-dim); letter-spacing: 0.04em; margin-bottom: 10px; }
        .md-ov-val { font-family: var(--md-mono); font-size: 26px; font-weight: 700; }
        .md-ov-val.green { color: var(--md-green); }
        .md-ov-val.red { color: var(--md-red); }

        .md-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; padding-bottom: 60px; }

        .md-card { background: var(--md-bg-raised); border: 1px solid var(--md-line); border-radius: 10px; padding: 18px; }
        .md-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .md-card-top-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .md-external { color: var(--md-ink-dim); display: flex; }
        .md-external:hover { color: var(--md-green); }
        .md-delete-icon { background: none; border: none; color: var(--md-ink-dim); display: flex; cursor: pointer; padding: 0; }
        .md-delete-icon:hover { color: var(--md-red); }
        .md-modal-danger { background: var(--md-red); }
        .md-modal-danger:hover { background: #ff7a7a; }
        .md-modal-cancel { background: none; border: 1px solid var(--md-line); color: var(--md-ink-dim); border-radius: 8px; padding: 11px; font-weight: 600; font-size: 13.5px; cursor: pointer; font-family: var(--md-sans); }
        .md-modal-cancel:hover { border-color: var(--md-ink-dim); color: var(--md-ink); }

        .md-card-mid { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
        .md-ring-wrap { position: relative; width: 48px; height: 48px; flex-shrink: 0; }
        .md-ring { width: 48px; height: 48px; transform: rotate(-90deg); }
        .md-ring-track { fill: none; stroke: var(--md-line); stroke-width: 4; }
        .md-ring-fill { fill: none; stroke-width: 4; stroke-linecap: round; transition: stroke-dashoffset 0.4s ease; }
        .md-ring-pct { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: var(--md-mono); font-size: 10px; font-weight: 700; }

        .md-card-stats { display: flex; flex-direction: column; gap: 6px; }
        .md-badge { display: inline-flex; align-items: center; gap: 6px; font-family: var(--md-mono); font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; padding: 3px 7px; border-radius: 5px; width: fit-content; }
        .md-badge-dot { width: 6px; height: 6px; border-radius: 50%; }
        .md-up { background: rgba(61,220,151,0.1); color: var(--md-green); }
        .md-up .md-badge-dot { background: var(--md-green); animation: md-blink 1.8s ease-in-out infinite; }
        .md-down { background: rgba(255,93,93,0.1); color: var(--md-red); }
        .md-down .md-badge-dot { background: var(--md-red); }
        .md-unknown { background: rgba(127,150,144,0.12); color: var(--md-ink-dim); }
        .md-unknown .md-badge-dot { background: var(--md-ink-dim); }
        @keyframes md-blink { 50% { opacity: 0.35; } }
        .md-stat-row { display: flex; align-items: center; gap: 6px; font-family: var(--md-mono); font-size: 11.5px; }
        .md-stat-row.md-dim { color: var(--md-ink-dim); }

        .md-details-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; background: var(--md-bg); border: 1px solid var(--md-line); color: var(--md-ink-dim); border-radius: 7px; padding: 9px; font-family: var(--md-mono); font-size: 11.5px; text-decoration: none; cursor: pointer; transition: border-color 0.15s, color 0.15s; }
        .md-details-btn:hover { border-color: var(--md-green-dim); color: var(--md-green); }

        .md-empty { text-align: center; padding: 90px 20px; color: var(--md-ink-dim); }
        .md-empty h3 { font-family: var(--md-mono); color: var(--md-ink); font-size: 18px; margin: 14px 0 8px; }
        .md-empty p { font-size: 13.5px; margin: 0 0 20px; }

        .md-loading { display: flex; align-items: center; gap: 8px; padding: 60px 0; justify-content: center; color: var(--md-ink-dim); font-family: var(--md-mono); font-size: 13px; }
        .md-spin { animation: md-spin 1s linear infinite; }
        @keyframes md-spin { to { transform: rotate(360deg); } }

        .md-error { background: rgba(255,93,93,0.08); border: 1px solid rgba(255,93,93,0.3); color: var(--md-red); border-radius: 8px; padding: 12px 16px; font-size: 13.5px; margin-bottom: 24px; }

        .md-modal-backdrop { position: fixed; inset: 0; background: rgba(6,10,9,0.7); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
        .md-modal { width: 100%; max-width: 420px; background: var(--md-bg-raised); border: 1px solid var(--md-line); border-radius: 12px; padding: 22px 24px 24px; }
        .md-modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .md-modal-head h3 { font-family: var(--md-mono); font-size: 17px; font-weight: 700; margin: 0; }
        .md-modal-close { background: none; border: none; color: var(--md-ink-dim); cursor: pointer; padding: 4px; display: flex; }
        .md-modal-close:hover { color: var(--md-ink); }
        .md-modal-sub { color: var(--md-ink-dim); font-size: 13px; margin: 0 0 20px; }
        .md-modal-form { display: flex; flex-direction: column; gap: 12px; }
        .md-modal-field { position: relative; display: flex; align-items: center; }
        .md-modal-field-icon { position: absolute; left: 12px; color: var(--md-ink-dim); pointer-events: none; }
        .md-modal-field input { width: 100%; background: var(--md-bg); border: 1px solid var(--md-line); border-radius: 8px; padding: 11px 12px 11px 36px; color: var(--md-ink); font-size: 14px; font-family: var(--md-sans); outline: none; }
        .md-modal-field input:focus { border-color: var(--md-green-dim); }
        .md-modal-error { background: rgba(255,93,93,0.08); border: 1px solid rgba(255,93,93,0.3); color: var(--md-red); border-radius: 7px; padding: 9px 12px; font-size: 12.5px; }
        .md-modal-submit { background: var(--md-green); color: #06120d; border: none; border-radius: 8px; padding: 11px; font-weight: 700; font-size: 13.5px; cursor: pointer; font-family: var(--md-mono); }
        .md-modal-submit:hover { background: #4de8a4; }
        .md-modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 720px) {
          .md-overview { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <nav className="md-nav">
        <div className="md-wrap md-nav-inner">
          <div className="md-brand"><span className="dot" /> monitorizer</div>
          {name && <span className="md-hello">Hey, {name}</span>}
        </div>
      </nav>

      <div className="md-wrap">
        <div className="md-head">
          <h1 className="md-title">Your sites</h1>
          <button className="md-add" type="button" onClick={() => setShowAddModal(true)}>
            <Plus size={15} /> Add site
          </button>
        </div>

        {error && <div className="md-error">{error}</div>}

        {!loading && websites.length > 0 && (
          <div className="md-overview">
            <div className="md-ov-cell">
              <div className="md-ov-label"><Globe size={12} /> MONITORED</div>
              <div className="md-ov-val">{overview.total}</div>
            </div>
            <div className="md-ov-cell">
              <div className="md-ov-label"><Activity size={12} /> UP NOW</div>
              <div className="md-ov-val green">{overview.up}</div>
            </div>
            <div className="md-ov-cell">
              <div className="md-ov-label"><Activity size={12} /> DOWN NOW</div>
              <div className="md-ov-val red">{overview.down}</div>
            </div>
            <div className="md-ov-cell">
              <div className="md-ov-label"><TrendingUp size={12} /> AVG RESPONSE</div>
              <div className="md-ov-val">{overview.avgMs}ms</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="md-loading"><RefreshCw size={14} className="md-spin" /> loading your sites…</div>
        ) : websites.length === 0 ? (
          <div className="md-empty">
            <Globe size={32} />
            <h3>Nothing monitored yet</h3>
            <p>Add a URL and checks start within 3 minutes.</p>
            <button className="md-add" type="button" style={{ margin: "0 auto" }} onClick={() => setShowAddModal(true)}>
              <Plus size={15} /> Add your first site
            </button>
          </div>
        ) : (
          <div className="md-grid">
            {websites.map((site) => (
                <WebsiteCard key={site.id} site={site} now={now} onDeleteClick={setDeleteTarget} />

            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddWebsiteModal onClose={() => setShowAddModal(false)} onAdded={handleAdded} />
        
      )}
   
      {deleteTarget && (
        <DeleteConfirmModal
          site={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  )
}
