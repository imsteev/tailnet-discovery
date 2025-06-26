# Excalidraw Self-Hosting

This setup provides a self-hosted Excalidraw instance with automatic HTTPS via Let's Encrypt.

## Quick Start

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your domain and email:
   ```
   DOMAIN=your-domain.com
   EMAIL=your-email@example.com
   ```

3. Update `docker-compose.yml` to replace:
   - `your-domain.com` with your actual domain
   - `your-email@example.com` with your email

4. Deploy:
   ```bash
   docker-compose up -d
   ```

## Services

- **Excalidraw**: Available at `https://your-domain.com`
- **Traefik Dashboard**: Available at `https://traefik.your-domain.com:8080`

## Requirements

- Domain pointing to your server
- Ports 80 and 443 open
- Docker and Docker Compose installed

## Local Development

For local development, use the simplified compose file:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This will start Excalidraw at `http://localhost:3000`

## AWS Deployment

For AWS deployment, consider using:
- EC2 instance with security groups allowing ports 80/443
- Elastic IP for stable IP address
- Route 53 for DNS management