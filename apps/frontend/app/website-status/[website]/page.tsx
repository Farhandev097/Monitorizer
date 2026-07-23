"use client"
import axios from "axios"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock3, Zap, Activity, RefreshCw } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,  
} from "recharts"


interface Tick {
  id: string
  response_time_ms: number
  status: "Up" | "Down" | "Unknown"
  region_id: string
  website_id: string
  createdAt: string
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function CustomDot(props: any) {
  const { cx, cy, payload } = props
  if (payload.status === "Down") {
    return <circle cx={cx} cy={cy} r={4} fill="#ff5d5d" stroke="none" />
  }
  return <circle cx={cx} cy={cy} r={2.5} fill="#3ddc97" stroke="none" />
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const t: Tick = payload[0].payload
  return (
    <div className="ws-tooltip">
      <div className={`ws-tooltip-status ${t.status === "Up" ? "up" : t.status === "Down" ? "down" : "unknown"}`}>
        {t.status.toUpperCase()}
      </div>
      <div className="ws-tooltip-row">{Math.max(0, t.response_time_ms)}ms</div>
      <div className="ws-tooltip-row dim">{formatClock(t.createdAt)}</div>
    </div>
  )
}

export default function WebsiteStatusPage() {
  const params = useParams()
  const router = useRouter()
  const websiteId = params?.website as string

  const [ticks, setTicks] = useState<Tick[]>([])
  const [url, setUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/")
      return
    }
    axios
      .get(`https://monitorizer.onrender.com/v1/status/${websiteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data
        setTicks(data.ticks ?? data.website?.ticks ?? [])
        setUrl(data.url ?? data.website?.url ?? "")
        setError(null)
      })
      .catch((err) => {
        console.error("Failed to fetch website status:", err)
        setError("Couldn't load status for this site.")
      })
      .finally(() => setLoading(false))
  }, [websiteId, router])

  useEffect(() => {
    if (!websiteId) return
    fetchStatus()
    const id = setInterval(fetchStatus, 60_000) // refresh view every minute
    return () => clearInterval(id)
  }, [websiteId, fetchStatus])

  const chronological = [...ticks].reverse()
  const chartData = chronological.map((t) => ({
    ...t,
    label: formatClock(t.createdAt),
    ms: Math.max(0, t.response_time_ms),
  }))

  const downCount = ticks.filter((t) => t.status === "Down").length
  const avgMs = ticks.length
    ? Math.round(ticks.reduce((s, t) => s + Math.max(0, t.response_time_ms), 0) / ticks.length)
    : 0
  const uptimePct = ticks.length ? Math.round(((ticks.length - downCount) / ticks.length) * 100) : 100
  const latest = ticks[0]

  return (
    <div className="ws-page">
      <style>{`
        .ws-page {
          --ws-bg: #0a0f0d;
          --ws-bg-raised: #0f1613;
          --ws-line: #1c2b28;
          --ws-ink: #e9f3ee;
          --ws-ink-dim: #7f9690;
          --ws-green: #3ddc97;
          --ws-red: #ff5d5d;
          --ws-amber: #f0b64c;
          --ws-mono: 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
          --ws-sans: 'Inter', -apple-system, sans-serif;
          background: var(--ws-bg);
          color: var(--ws-ink);
          font-family: var(--ws-sans);
          min-height: 100vh;
        }
        * { box-sizing: border-box; }
        .ws-wrap { max-width: 900px; margin: 0 auto; padding: 0 28px 60px; }

        .ws-nav { border-bottom: 1px solid var(--ws-line); margin-bottom: 32px; margin-top: 16px; }
        .ws-nav-inner { display: flex; align-items: center; height: 64px; }
        .ws-back { display: flex; align-items: center; gap: 6px; color: var(--ws-ink-dim); text-decoration: none; font-family: var(--ws-mono); font-size: 12.5px; }
        .ws-back:hover { color: var(--ws-ink); }

        .ws-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
        .ws-url { font-family: var(--ws-mono); font-size: 24px; font-weight: 700; margin: 0 0 6px; word-break: break-all; }
        .ws-sub { color: var(--ws-ink-dim); font-size: 13.5px; margin: 0; }
        .ws-badge { display: flex; align-items: center; gap: 6px; font-family: var(--ws-mono); font-size: 11.5px; font-weight: 700; padding: 6px 12px; border-radius: 6px; flex-shrink: 0; }
        .ws-badge-dot { width: 6px; height: 6px; border-radius: 50%; }
        .ws-badge.up { background: rgba(61,220,151,0.1); color: var(--ws-green); }
        .ws-badge.up .ws-badge-dot { background: var(--ws-green); }
        .ws-badge.down { background: rgba(255,93,93,0.1); color: var(--ws-red); }
        .ws-badge.down .ws-badge-dot { background: var(--ws-red); }
        .ws-badge.unknown { background: rgba(127,150,144,0.12); color: var(--ws-ink-dim); }
        .ws-badge.unknown .ws-badge-dot { background: var(--ws-ink-dim); }

        .ws-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--ws-line); border: 1px solid var(--ws-line); border-radius: 10px; overflow: hidden; margin-bottom: 28px; }
        .ws-stat { background: var(--ws-bg-raised); padding: 16px 20px; }
        .ws-stat-label { display: flex; align-items: center; gap: 6px; font-family: var(--ws-mono); font-size: 11px; color: var(--ws-ink-dim); letter-spacing: 0.04em; margin-bottom: 8px; }
        .ws-stat-val { font-family: var(--ws-mono); font-size: 22px; font-weight: 700; }

        .ws-chart-card { background: var(--ws-bg-raised); border: 1px solid var(--ws-line); border-radius: 10px; padding: 20px 20px 8px; margin-bottom: 24px; }
        .ws-chart-title { font-family: var(--ws-mono); font-size: 13px; color: var(--ws-ink-dim); margin: 0 0 12px; }

        .ws-tooltip { background: var(--ws-bg); border: 1px solid var(--ws-line); border-radius: 8px; padding: 8px 12px; font-family: var(--ws-mono); }
        .ws-tooltip-status { font-size: 10.5px; font-weight: 700; margin-bottom: 4px; }
        .ws-tooltip-status.up { color: var(--ws-green); }
        .ws-tooltip-status.down { color: var(--ws-red); }
        .ws-tooltip-status.unknown { color: var(--ws-ink-dim); }
        .ws-tooltip-row { font-size: 12px; }
        .ws-tooltip-row.dim { color: var(--ws-ink-dim); font-size: 11px; }

        .ws-table { background: var(--ws-bg-raised); border: 1px solid var(--ws-line); border-radius: 10px; overflow: hidden; }
        .ws-table-head { display: grid; grid-template-columns: 80px 1fr 90px 90px; padding: 10px 18px; font-family: var(--ws-mono); font-size: 10.5px; color: var(--ws-ink-dim); letter-spacing: 0.05em; border-bottom: 1px solid var(--ws-line); }
        .ws-row { display: grid; grid-template-columns: 80px 1fr 90px 90px; padding: 10px 18px; font-family: var(--ws-mono); font-size: 12.5px; border-bottom: 1px solid var(--ws-line); align-items: center; }
        .ws-row:last-child { border-bottom: none; }
        .ws-row-status { font-weight: 700; }
        .ws-row-status.up { color: var(--ws-green); }
        .ws-row-status.down { color: var(--ws-red); }
        .ws-row-status.unknown { color: var(--ws-ink-dim); }
        .ws-row-dim { color: var(--ws-ink-dim); }

        .ws-loading, .ws-empty { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 80px 0; color: var(--ws-ink-dim); font-family: var(--ws-mono); font-size: 13px; }
        .ws-spin { animation: ws-spin 1s linear infinite; }
        @keyframes ws-spin { to { transform: rotate(360deg); } }
        .ws-error { background: rgba(255,93,93,0.08); border: 1px solid rgba(255,93,93,0.3); color: var(--ws-red); border-radius: 8px; padding: 12px 16px; font-size: 13.5px; margin-bottom: 24px; }

        @media (max-width: 640px) {
          .ws-stats { grid-template-columns: 1fr; }
          .ws-table-head, .ws-row { grid-template-columns: 60px 1fr 70px; }
          .ws-table-head span:nth-child(3), .ws-row span:nth-child(3) { display: none; }
        }
      `}</style>

      <nav className="ws-nav">
        <div className="ws-wrap ws-nav-inner">
          <Link href="/dashboard" className="ws-back">
            <ArrowLeft size={13} /> Back to dashboard
          </Link>
        </div>
      </nav>

      <div className="ws-wrap">
        {error && <div className="ws-error">{error}</div>}

        {loading ? (
          <div className="ws-loading"><RefreshCw size={14} className="ws-spin" /> loading status…</div>
        ) : (
          <>
            <div className="ws-head">
              <div>
                <h1 className="ws-url">{url.replace(/^https?:\/\//, "") || "Website"}</h1>
                <p className="ws-sub">Last 30 minutes · {ticks.length} checks</p>
              </div>
              {latest && (
                <div className={`ws-badge ${latest.status.toLowerCase()}`}>
                  <span className="ws-badge-dot" /> {latest.status.toUpperCase()}
                </div>
              )}
            </div>

            <div className="ws-stats">
              <div className="ws-stat">
                <div className="ws-stat-label"><Activity size={12} /> UPTIME (30 MIN)</div>
                <div className="ws-stat-val">{uptimePct}%</div>
              </div>
              <div className="ws-stat">
                <div className="ws-stat-label"><Zap size={12} /> AVG RESPONSE</div>
                <div className="ws-stat-val">{avgMs}ms</div>
              </div>
              <div className="ws-stat">
                <div className="ws-stat-label"><Clock3 size={12} /> FAILED CHECKS</div>
                <div className="ws-stat-val" style={{ color: downCount > 0 ? "var(--ws-red)" : undefined }}>
                  {downCount}
                </div>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="ws-empty">No checks recorded in the last 30 minutes yet.</div>
            ) : (
              <div className="ws-chart-card">
                <p className="ws-chart-title">Response time (ms)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke="#1c2b28" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#7f9690"
                      fontSize={11}
                      fontFamily="JetBrains Mono, monospace"
                      tickLine={false}
                      axisLine={{ stroke: "#1c2b28" }}
                      minTickGap={30}
                    />
                    <YAxis
                      stroke="#7f9690"
                      fontSize={11}
                      fontFamily="JetBrains Mono, monospace"
                      tickLine={false}
                      axisLine={false}
                      width={44}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="ms"
                      stroke="#3ddc97"
                      strokeWidth={2}
                      dot={<CustomDot />}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="ws-table">
              <div className="ws-table-head">
                <span>STATUS</span>
                <span>TIME</span>
                <span>RESPONSE</span>
                <span>REGION</span>
              </div>
              {ticks.map((t) => (
                <div className="ws-row" key={t.id}>
                  <span className={`ws-row-status ${t.status.toLowerCase()}`}>{t.status.toUpperCase()}</span>
                  <span>{formatClock(t.createdAt)}</span>
                  <span>{Math.max(0, t.response_time_ms)}ms</span>
                  <span className="ws-row-dim">India</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
