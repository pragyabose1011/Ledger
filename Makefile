.PHONY: help up down build rebuild logs backend frontend db shell-backend shell-db setup

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  setup          Copy .env.example → backend/.env (first-time setup)"
	@echo "  up             Start all services"
	@echo "  down           Stop all services"
	@echo "  build          Build all images"
	@echo "  rebuild        Full rebuild — no cache"
	@echo "  backend        Rebuild + restart backend only"
	@echo "  frontend       Rebuild + restart frontend only"
	@echo "  logs           Tail logs for all services"
	@echo "  logs-backend   Tail backend logs only"
	@echo "  shell-backend  Bash shell inside backend container"
	@echo "  shell-db       MySQL shell inside db container"

setup:
	@test -f backend/.env && echo "backend/.env already exists — skipping" || (cp backend/.env.example backend/.env && echo "Created backend/.env — edit it before running make up")

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

rebuild:
	docker compose build --no-cache

backend:
	docker compose up --build backend -d

frontend:
	docker compose up --build frontend -d

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

shell-backend:
	docker exec -it ledger-backend bash

shell-db:
	docker exec -it ledger-db mysql -uledger -pledgerpass ledger
