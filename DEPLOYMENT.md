# Plainview Deployment Guide

## Quick Start (Development)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Start all services with Docker Compose
docker-compose up -d

# 3. Check health
curl http://localhost:4000/health

# 4. Access dashboard
open http://localhost:5173
```

The system will start:
- **API**: http://localhost:4000
- **Dashboard**: http://localhost:5173
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## Production Deployment

### Prerequisites

- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker Compose)
- Redis 7+ (or use Docker Compose)
- Domain with SSL certificate
- Secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

### Environment Configuration

1. **Generate API keys**:
```bash
openssl rand -hex 32
```

2. **Set production environment variables**:
```bash
# Required
export ENVIRONMENT=production
export POSTGRES_URL=postgresql+asyncpg://user:password@host:5432/plainview
export API_KEY_ENABLED=true
export API_KEYS=your_generated_key_here
export CORS_ORIGINS=https://app.yourdomain.com,https://dashboard.yourdomain.com

# Optional (Summit.OS integration)
export SUMMIT_ENABLED=true
export SUMMIT_MQTT_URL=wss://mqtt.summit-os.com
export SUMMIT_API_KEY=summit_key_here
export SUMMIT_ORG_ID=your_org_id
```

3. **Deploy with Docker Compose**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Kubernetes Deployment

Create Kubernetes manifests:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: plainview-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: plainview-api
  template:
    metadata:
      labels:
        app: plainview-api
    spec:
      containers:
      - name: api
        image: your-registry/plainview-api:latest
        ports:
        - containerPort: 4000
        env:
        - name: POSTGRES_URL
          valueFrom:
            secretKeyRef:
              name: plainview-secrets
              key: postgres-url
        - name: API_KEYS
          valueFrom:
            secretKeyRef:
              name: plainview-secrets
              key: api-keys
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## Database Setup

### Initial Schema

```bash
# Run migrations (when using Alembic)
docker-compose exec api alembic upgrade head

# Or initialize manually
docker-compose exec postgres psql -U plainview -c "CREATE DATABASE plainview;"
```

### Backup Strategy

```bash
# Daily backup
docker-compose exec postgres pg_dump -U plainview plainview > backup-$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U plainview plainview < backup-20250113.sql
```

---

## Security Checklist

- [ ] Change default database password
- [ ] Enable API key authentication (`API_KEY_ENABLED=true`)
- [ ] Generate strong API keys (32+ characters)
- [ ] Restrict CORS to specific origins
- [ ] Use HTTPS/TLS in production
- [ ] Store secrets in secrets manager (not .env files)
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up intrusion detection
- [ ] Enable audit logging

---

## Monitoring & Observability

### Health Checks

```bash
# Basic health
curl http://localhost:4000/health

# Expected response:
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "mqtt": "ok",
    "event_bus": "ok"
  },
  "uptime_sec": 1234,
  "version": "0.0.1"
}
```

### Prometheus Metrics (TODO)

Once metrics endpoint is added:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'plainview-api'
    static_configs:
      - targets: ['plainview-api:4000']
    metrics_path: '/metrics'
```

### Logging

Logs are written to stdout/stderr. Capture with:
- Docker: `docker-compose logs -f api`
- Kubernetes: `kubectl logs -f deployment/plainview-api`
- Production: Forward to CloudWatch, Datadog, or Grafana Loki

---

## Troubleshooting

### API won't start
```bash
# Check logs
docker-compose logs api

# Common issues:
# 1. Database connection failed -> verify POSTGRES_URL
# 2. Port already in use -> change PORT in .env
# 3. Missing dependencies -> rebuild: docker-compose build api
```

### Dashboard can't connect to API
```bash
# 1. Check CORS settings
curl -H "Origin: http://localhost:5173" -I http://localhost:4000/health

# 2. Verify VITE_API_BASE
docker-compose exec dashboard env | grep VITE

# 3. Check API health
curl http://localhost:4000/health
```

### Database migrations failed
```bash
# Reset database (CAUTION: destroys data)
docker-compose down -v
docker-compose up -d postgres
docker-compose exec api alembic upgrade head
```

### MQTT connection issues
```bash
# 1. Check Summit.OS settings
docker-compose exec api env | grep SUMMIT

# 2. Test MQTT broker connectivity
docker-compose exec api curl -v ws://mqtt-broker:1883

# 3. Check logs for connection errors
docker-compose logs api | grep -i mqtt
```

---

## Performance Tuning

### Database Connection Pooling

Edit `config.py`:
```python
create_kwargs = {
    "pool_size": 20,        # Increase for high traffic
    "max_overflow": 40,
    "pool_recycle": 3600,
    "pool_pre_ping": True,
}
```

### Redis Caching

Enable Redis for session storage and caching (requires additional code).

### Horizontal Scaling

- Run multiple API replicas behind a load balancer
- Use Redis for shared session state
- PostgreSQL read replicas for read-heavy workloads

---

## Upgrading

1. **Backup database**
2. **Pull latest code**: `git pull origin main`
3. **Rebuild containers**: `docker-compose build`
4. **Run migrations**: `docker-compose exec api alembic upgrade head`
5. **Restart services**: `docker-compose up -d`
6. **Verify health**: `curl http://localhost:4000/health`

---

## Support & Contact

For issues or questions:
- GitHub Issues: [your-repo]/issues
- Documentation: [your-docs-site]
- Email: support@plainview.com
