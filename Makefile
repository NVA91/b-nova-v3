# Makefile
.PHONY: help setup start stop restart logs clean build deploy

DOCKER_COMPOSE := docker-compose
ENV_FILE := .env

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Initial setup (copy env, generate secrets)
	@echo "🔧 Setting up environment..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "✅ .env created"; fi
	@mkdir -p traefik/dynamic letsencrypt monitoring/prometheus monitoring/grafana/dashboards
	@touch traefik/acme.json && chmod 600 traefik/acme.json
	@echo "✅ Directories created"

build: ## Build all Docker images
	@echo "🏗️  Building images..."
	$(DOCKER_COMPOSE) build --parallel

start: ## Start all services
	@echo "🚀 Starting services..."
	$(DOCKER_COMPOSE) up -d
	@sleep 5
	@$(DOCKER_COMPOSE) ps

stop: ## Stop all services
	@echo "🛑 Stopping services..."
	$(DOCKER_COMPOSE) down

restart: stop start ## Restart all services

logs: ## Show logs (use: make logs SERVICE=backend)
	$(DOCKER_COMPOSE) logs -f $(SERVICE)

ps: ## Show running containers
	$(DOCKER_COMPOSE) ps

health: ## Check health of all services
	@echo "🏥 Health check..."
	@curl -f http://localhost/health || echo "❌ Frontend down"
	@curl -f http://localhost:8000/health || echo "❌ Backend down"

clean: ## Remove all containers, volumes, and images
	@echo "🧹 Cleaning up..."
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -af --volumes

deploy: setup build start ## Full deployment

monitoring-start: ## Start monitoring stack
	$(DOCKER_COMPOSE) -f docker-compose.monitoring.yml up -d

monitoring-stop: ## Stop monitoring stack
	$(DOCKER_COMPOSE) -f docker-compose.monitoring.yml down

backup-db: ## Backup PostgreSQL database
	@echo "💾 Backing up database..."
	docker exec ai-db pg_dump -U $(DB_USER) $(DB_NAME) > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup complete"

restore-db: ## Restore PostgreSQL database (use: make restore-db FILE=backup.sql)
	@echo "📥 Restoring database..."
	docker exec -i ai-db psql -U $(DB_USER) $(DB_NAME) < $(FILE)
	@echo "✅ Restore complete"

controller-up:
	docker-compose -f environments/controller/docker-compose.yml up -d

controller-down:
	docker-compose -f environments/controller/docker-compose.yml down

controller-logs:
	docker-compose -f environments/controller/docker-compose.yml logs -f

controller-ps:
	docker-compose -f environments/controller/docker-compose.yml ps

controller-deps:
	ansible-galaxy collection install -r ansible/requirements.yml

controller-configure:
	ansible-playbook ansible/playbooks/controller.yml -i ansible/inventory/controller/hosts.yml
