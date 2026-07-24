<div align="center">

# 🟢 Monitorizer

**Real-time website uptime monitoring — know the moment something goes down.**

Monitorizer checks your sites every 3 minutes and gives you a live dashboard of uptime, response times, and status history — no config files, no YAML, just paste a URL and go.

[Live App](https://monitorizer-frontend.vercel.app) · [Report a bug](../../issues) · [Request a feature](../../issues)

</div>

---

## ✨ What it does

- **Add any URL** and Monitorizer starts checking it automatically within 3 minutes
- **Live status badges** — Up / Down / Unknown, updated in near real time on the dashboard
- **Response time tracking** for every check, with a rolling uptime ring per site
- **Overview stats** — total sites monitored, how many are up/down right now, average response time across your whole fleet
- **One-click removal** with a confirmation step, so you don't nuke a site by accident
- **Auto-refreshing dashboard** — polls in the background and flips stale data to "Unknown" if a check hasn't landed recently, so you're never staring at a false Up

---

## 🧱 Tech stack

Monitorizer is a [Turborepo](https://turborepo.dev) monorepo:

| Layer | Tech |
|---|---|
| Frontend | Next.js (React), deployed on [Vercel](https://vercel.com) |
| Backend API | Express, deployed on [Render](https://render.com) |
| Database | [Prisma Postgres](https://www.prisma.io/postgres) via Prisma 7 |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Package manager | Bun / pnpm |
| Monorepo tooling | Turborepo |
| Auth | JWT bearer tokens |

### Monorepo layout

```
monitorizer/
├─ apps/
│  ├─ web/            # Next.js dashboard (frontend)
│  └─ http-backend/    # Express API
├─ packages/
│  ├─ db/              # Prisma schema, client, and DB access layer (@repo/db)
│  ├─ eslint-config/
│  └─ typescript-config/
└─ turbo.json
```

---

## 🚀 Getting started

### Prerequisites

- [Bun](https://bun.sh) or pnpm
- A [Prisma Postgres](https://www.prisma.io/postgres) database (or any Postgres instance)

### 1. Clone and install

```bash
git clone https://github.com/Farhandev097/Monitorizer.git
cd Monitorizer
bun install
```

### 2. Configure the database

Inside `packages/db`, create a `.env` file:

```env
DATABASE_URL="your-postgres-connection-string"
```

Then push the schema:

```bash
cd packages/db
bun run db:push
```

### 3. Run everything

From the repo root:

```bash
bun run dev
```

This starts the Next.js dashboard and the Express API together via Turborepo.

### Useful commands

| Command | What it does |
|---|---|
| `bun run dev` | Run all apps in dev mode |
| `bun run --filter=web dev` | Run just the frontend |
| `bun run --filter=http-backend dev` | Run just the API |
| `bun run db:push` (in `packages/db`) | Push schema changes without a migration |
| `bun run migrate:dev` (in `packages/db`) | Create and apply a migration |

---

## 📊 How the monitoring works

1. Sites you add are checked on a **3-minute cadence**
2. Each check writes a **tick** — status (`Up` / `Down`), response time, and timestamp
3. The dashboard polls the API in the background and computes each site's current status from its latest tick
4. If a tick is older than the expected check window (plus a small buffer for network jitter), the dashboard shows `Unknown` instead of a stale status — so you never get a false sense of security from an old data point

---

## 🗺️ Roadmap

- [ ] Email / webhook alerts on status change
- [ ] Multi-region checks
- [ ] Historical uptime graphs beyond the last 30 minutes
- [ ] Public status pages

---

## 🤝 Contributing

Issues and PRs are welcome — this project is a work in progress and still evolving.

---

## 📄 License

MIT
