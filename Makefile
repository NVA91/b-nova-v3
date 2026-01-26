.PHONY: help build up down logs clean test deploy controller-up controller-down controller-logs controller-ps controller-deps controller-configure

ANSIBLE_HOST ?= pve01
ANSIBLE_INVENTORY ?= ansible/inventory/production/hosts.yml
DEPLOY_PATH ?= /opt/nova-v3

help:
	@echo "NOVA v3 - Available Commands:"
	@echo "  make build    - Build all Docker images"
	@echo "  make up       - Start all services"
	@echo "  make down     - Stop all services"
	@echo "  make logs     - Show logs"
	@echo "  make clean    - Remove all containers and volumes"
	@echo "  make test     - Run backend tests"
	@echo "  make deploy   - Sync + rebuild on target host"
	@echo "  make controller-up        - Start AWX controller stack"
	@echo "  make controller-down      - Stop AWX controller stack"
	@echo "  make controller-logs      - Tail AWX controller logs"
	@echo "  make controller-ps        - Show AWX controller status"
	@echo "  make controller-deps      - Install Ansible collections (incl. awx.awx)"
	@echo "  make controller-configure - Configure AWX via controller playbook"
	@echo "  vars: ANSIBLE_HOST, ANSIBLE_INVENTORY, DEPLOY_PATH"

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

deploy:
	ansible $(ANSIBLE_HOST) -i $(ANSIBLE_INVENTORY) -m synchronize -a "src=./ dest=$(DEPLOY_PATH)/ delete=no rsync_opts=--exclude=.git,--exclude=node_modules,--exclude=.venv,--exclude=ansible"
	ansible $(ANSIBLE_HOST) -i $(ANSIBLE_INVENTORY) -m shell -a "cd $(DEPLOY_PATH) && docker compose down && docker compose build --no-cache frontend && docker compose up -d"

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
