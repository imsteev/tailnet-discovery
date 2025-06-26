# Tailnet Application Discovery

A modern web application for discovering and managing services running on your Tailscale network. Built with React, TypeScript, and Hono, this tool provides a clean interface to monitor service availability and manage your tailnet infrastructure.

## Features

- 🔍 **Service Discovery**: Automatically discover services running on your tailnet hosts
- 📊 **Real-time Status Monitoring**: Check service availability with live status indicators
- ✏️ **Service Management**: Add, edit, and delete services through an intuitive interface
- 🧪 **Connectivity Testing**: Test individual services with one-click connectivity checks
- 💾 **Persistent Storage**: SQLite database for reliable service configuration storage
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS

## Quick Start

1. **Install dependencies**:

   ```bash
   bun install
   ```

2. **Build the frontend**:

   ```bash
   bun run build:frontend
   ```

3. **Start the development server**:

   ```bash
   bun run dev
   ```

4. **Access the application**:
   Open `http://localhost:3000` in your browser

## Development

### Prerequisites

- [Bun](https://bun.sh) runtime
- Node.js (for tooling compatibility)

### Available Scripts

- `bun run dev` - Start development server with hot reload for both frontend and backend
- `bun run dev:backend` - Start only the backend server
- `bun run build:frontend` - Build the frontend for production
- `bun run build:frontend:watch` - Build frontend with file watching

### Project Structure

```
src/
├── frontend/           # React frontend application
│   ├── components/     # Reusable React components
│   │   ├── ServiceCard.tsx
│   │   ├── ServiceGrid.tsx
│   │   ├── ServiceModal.tsx
│   │   └── TailnetServicesContainer.tsx
│   ├── App.tsx        # Main application container
│   ├── index.tsx      # React entry point
│   └── styles.css     # Tailwind CSS styles
└── index.ts           # Hono backend server
```

## API Endpoints

- `GET /` - Serve the React application
- `GET /api/services` - Get all configured services
- `POST /api/services` - Add or update a service
- `DELETE /api/services/:ip/:port` - Delete a service
- `GET /check/:ip/:port` - Test service connectivity

## Service Configuration

Services are stored in a SQLite database (`services.db`) with the following schema:

```sql
CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  port INTEGER NOT NULL,
  name TEXT NOT NULL,
  host_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Hono (web framework), Bun runtime
- **Database**: SQLite with prepared statements
- **Build Tools**: Bun bundler, Tailwind CLI
- **Development**: Concurrent watching for frontend and backend

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run prettier to format code (`npx prettier --write "src/**/*"`)
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
