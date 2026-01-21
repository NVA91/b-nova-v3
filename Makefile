.PHONY: help build up down logs clean test

help:
	@echo "NOVA v3 - Available Commands:"
	@echo "  make build    - Build all Docker images"
	@echo "  make up       - Start all services"
	@echo "  make down     - Stop all services"
	@echo "  make logs     - Show logs"
	@echo "  make clean    - Remove all containers and volumes"
	@echo "  make test     - Run backend tests"

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "✅ NOVA v3 is running!"
	@echo "Frontend: http://localhost"
	@echo "Backend API: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/api/docs"

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

test:
	cd backend && pytest tests/ -v
