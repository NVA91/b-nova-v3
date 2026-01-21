#!/bin/bash
# 🐦‍🔥 NOVA v3 Bootstrap Script - Phoenix Moment
# Erweckt NOVA v3 von 0 auf 100

set -e  # Exit on error

echo "🐦‍🔥 NOVA v3 Bootstrap - Phoenix Moment"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { log_error "Docker is not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is not installed. Aborting."; exit 1; }
log_info "Docker and Docker Compose are installed"

# Check if .env exists
if [ ! -f .env ]; then
    log_warn ".env file not found, creating from .env.example..."
    cp .env.example .env
    log_info ".env file created - Please configure it before continuing!"
    log_warn "Press Enter to continue after configuring .env, or Ctrl+C to abort..."
    read
fi

# Stop existing containers
echo ""
echo "🛑 Stopping existing containers..."
docker-compose down -v 2>/dev/null || true
log_info "Existing containers stopped"

# Build images
echo ""
echo "🔨 Building Docker images..."
docker-compose build
log_info "Docker images built"

# Start services
echo ""
echo "🚀 Starting services..."
docker-compose up -d
log_info "Services started"

# Wait for database
echo ""
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if backend is healthy
echo ""
echo "🏥 Checking backend health..."
max_attempts=30
attempt=0
until curl -f http://localhost:8000/health >/dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        log_error "Backend failed to start after $max_attempts attempts"
        docker-compose logs backend
        exit 1
    fi
    echo "Waiting for backend... (attempt $attempt/$max_attempts)"
    sleep 2
done
log_info "Backend is healthy"

# Seed database
echo ""
echo "🌱 Seeding database with initial data..."
docker-compose exec -T backend python -m app.seed
log_info "Database seeded"

# Show status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🎉 NOVA v3 Bootstrap completed!"
echo ""
echo "🌐 Access points:"
echo "   Frontend:       http://localhost"
echo "   Backend API:    http://localhost:8000"
echo "   API Docs:       http://localhost:8000/api/docs"
echo "   Traefik:        http://localhost:8080"
echo ""
echo "🐦‍🔥 Phoenix is alive!"
