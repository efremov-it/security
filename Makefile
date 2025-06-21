DEFAULT_GOAL: up

up:
	docker compose -f tools/docker-compose.yml up -d
	docker compose up -d

down:
	docker compose -f tools/docker-compose.yml down
	docker compose down
