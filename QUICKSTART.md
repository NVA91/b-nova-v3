# Quick-Start Commands

```bash
# 1. Initial setup
make setup

# 2. Edit .env with your values
nano .env

# 3. Generate Traefik auth
htpasswd -nb admin yourpassword

# 4. Deploy
make deploy

# 5. Check status
make ps
make health

# 6. View logs
make logs SERVICE=backend

# 7. Start monitoring
make monitoring-start

# 8. Access services
# Frontend: https://yourdomain.com
# Backend API: https://api.yourdomain.com
# Traefik: https://traefik.yourdomain.com
# N8N: https://n8n.yourdomain.com
# Grafana: https://grafana.yourdomain.com
```