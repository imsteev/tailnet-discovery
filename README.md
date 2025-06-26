# Tailnet Application Discovery

Web interface for managing services on your Tailscale network. Add hosts, manage services, and monitor connectivity.

<img width="1078" alt="Screenshot 2025-06-26 at 3 13 42 PM" src="https://github.com/user-attachments/assets/03947332-867c-4942-ad29-e78836a69cf1" />


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
