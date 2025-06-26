# Tailnet Application Discovery

Web interface for managing services on your Tailscale network. Add hosts, manage services, and monitor connectivity.

## Quick Start

```bash
bun install
bun run build:frontend
bun run dev
```

Open `http://localhost:3000`

## Features

- Add/delete hosts and services
- Real-time connectivity testing
- Port validation
- SQLite persistence

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Hono + Bun runtime
- **Database**: SQLite
