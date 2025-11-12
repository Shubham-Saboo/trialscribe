# TrialScribe Deployment Guide

This guide covers deploying TrialScribe to production using Docker and various cloud platforms.

## Prerequisites

- Docker and Docker Compose installed
- OpenAI API key
- Domain name (optional, for production)

## Quick Start with Docker Compose

### 1. Set Environment Variables

Create a `.env` file in the root directory:

```bash
# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0

# Backend Configuration
PORT=5001
DEBUG=false
CLINICAL_TRIALS_TIMEOUT=10

# Frontend Configuration (optional - defaults to relative paths)
REACT_APP_API_URL=http://localhost:5001
```

### 2. Build and Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost:5001

## Production Deployment

### Using Docker Compose (Production)

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Docker Deployment

#### Backend

```bash
cd backend
docker build -t trialscribe-backend .
docker run -d \
  --name trialscribe-backend \
  -p 5001:5001 \
  -e OPENAI_API_KEY=your_key_here \
  -e PORT=5001 \
  -e DEBUG=false \
  trialscribe-backend
```

#### Frontend

```bash
cd frontend
docker build -t trialscribe-frontend --build-arg REACT_APP_API_URL=http://your-backend-url:5001 .
docker run -d \
  --name trialscribe-frontend \
  -p 80:80 \
  trialscribe-frontend
```

## Cloud Platform Deployment

### Render.com

#### Backend Deployment

1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `cd backend && pip install -r requirements.txt && pip install gunicorn`
4. Set start command: `cd backend && gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 120 app:app`
5. Add environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional)
   - `PORT` (auto-set by Render)
   - `DEBUG=false`

#### Frontend Deployment

1. Create a new Static Site
2. Connect your GitHub repository
3. Set build command: `cd frontend && npm install && npm run build`
4. Set publish directory: `frontend/build`
5. Add environment variable:
   - `REACT_APP_API_URL` (your backend URL)

### Vercel

#### Frontend Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Run: `vercel`
4. Set environment variable `REACT_APP_API_URL` in Vercel dashboard

#### Backend Deployment

Vercel supports Python serverless functions. You'll need to adapt the Flask app for serverless or use a different platform for the backend.

### AWS (EC2 + Docker)

1. Launch an EC2 instance (Ubuntu 22.04)
2. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```
3. Install Docker Compose:
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```
4. Clone repository and set up `.env` file
5. Run: `docker-compose -f docker-compose.prod.yml up -d`
6. Configure security groups to allow HTTP (80) and HTTPS (443)

### AWS (ECS/Fargate)

1. Build and push images to ECR
2. Create ECS task definitions
3. Create ECS service with load balancer
4. Configure environment variables in task definition

### Google Cloud Platform (Cloud Run)

#### Backend

```bash
cd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/trialscribe-backend
gcloud run deploy trialscribe-backend \
  --image gcr.io/PROJECT_ID/trialscribe-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=your_key,DEBUG=false
```

#### Frontend

```bash
cd frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/trialscribe-frontend
gcloud run deploy trialscribe-frontend \
  --image gcr.io/PROJECT_ID/trialscribe-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Reverse Proxy Setup (Nginx)

For production, use Nginx as a reverse proxy:

```nginx
upstream backend {
    server localhost:5001;
}

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Using Cloudflare

1. Add your domain to Cloudflare
2. Update DNS records
3. Enable SSL/TLS encryption mode: "Full"
4. Cloudflare will automatically provide SSL certificates

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model to use |
| `OPENAI_TEMPERATURE` | No | `0` | Model temperature |
| `PORT` | No | `5001` | Server port |
| `DEBUG` | No | `false` | Debug mode |
| `CLINICAL_TRIALS_TIMEOUT` | No | `10` | API timeout in seconds |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_URL` | No | `''` | Backend API URL (empty = same origin) |

## Health Checks

- Backend: `GET http://your-backend-url:5001/health`
- Frontend: `GET http://your-frontend-url/health`

## Monitoring

### Logs

```bash
# Docker Compose logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Individual container logs
docker logs -f trialscribe-backend
docker logs -f trialscribe-frontend
```

### Health Monitoring

Set up monitoring to check:
- `/health` endpoint responds with 200
- API response times
- Error rates
- Container resource usage

## Scaling

### Horizontal Scaling (Backend)

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3
```

Use a load balancer (Nginx, HAProxy) to distribute traffic.

### Vertical Scaling

Adjust Docker resource limits:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Troubleshooting

### Backend won't start

1. Check environment variables: `docker-compose exec backend env`
2. Check logs: `docker-compose logs backend`
3. Verify OpenAI API key is valid

### Frontend can't connect to backend

1. Verify `REACT_APP_API_URL` is set correctly
2. Check CORS settings in backend
3. Verify network connectivity between containers

### High memory usage

1. Reduce Gunicorn workers: `--workers 2`
2. Monitor with: `docker stats`

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set `DEBUG=false` in production
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated
- [ ] Use non-root user in containers
- [ ] Configure firewall rules
- [ ] Enable rate limiting (consider adding)
- [ ] Set up log monitoring
- [ ] Regular security audits

## Backup and Recovery

### Database (if added in future)

```bash
# Backup
docker-compose exec backend python backup.py

# Restore
docker-compose exec backend python restore.py backup_file.sql
```

### Configuration

Keep `.env` files backed up securely (not in git).

## Support

For issues or questions, please open an issue in the repository.

