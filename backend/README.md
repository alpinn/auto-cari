# Autocari Backend — Phase 1

AI-powered product recommendation API for the Indonesian market. Built with
**FastAPI (Python 3.12)**. Phase 1 covers electronics only.

## Architecture

```
Request → sanitize → rate limit (Redis) → cache (Redis)
        → intent classify (LLM) → [coming_soon | clarifying]
        → query optimize (LLM) → parallel Serper + Tavily
        → normalize → AI rank & reason (LLM) → cache → log (Postgres) → response
```

LLM provider is switchable via `LLM_PROVIDER`:
- `grok` → `grok-3-mini` (classifier) + `grok-3` (reasoning), via the OpenAI SDK
- `claude` → `claude-haiku-4-5` (classifier) + `claude-sonnet-4` (reasoning)

All external dependencies (Redis, Postgres, Serper, Tavily, LLM) **degrade
gracefully** — missing credentials disable that feature instead of crashing,
so you can run the API locally with only a subset configured.

## Layout

```
app/
├── main.py            # FastAPI app: CORS, request-id, error handlers, lifespan
├── config.py          # pydantic-settings (all config from env)
├── api/routes/        # search, products, categories, health
├── agents/            # intent_classifier, product_agent
├── services/          # serper, tavily, llm, cache (Redis), db (Postgres)
├── models/            # request/response Pydantic models
├── utils/             # sanitizer, normalizer, rate_limiter, http retry
└── db/migrations/     # 001_initial.sql
```

## Setup

```bash
cd backend
python3 -m venv .venv          # already present in this repo
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env           # then fill in your keys
```

Apply the DB schema (optional — analytics degrade gracefully without it):

```bash
psql "$DATABASE_URL" -f app/db/migrations/001_initial.sql
```

## Run

```bash
# from backend/
.venv/bin/uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs
- Health: http://localhost:8000/health

### Docker

```bash
docker build -t autocari-backend .
docker run --env-file .env -p 8000:8000 autocari-backend
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/search` | Core search → `success` / `clarifying` / `coming_soon` / `error` |
| GET | `/api/product/{id}` | Product detail (served from search cache) |
| GET | `/api/categories` | Category catalog |
| GET | `/api/categories/{id}` | Category detail + live products |
| GET | `/health` | Liveness + dependency status |

## Smoke tests

```bash
# electronics → success
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "laptop buat coding budget 8 juta"}'

# coming soon
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "saham apa yang bagus tahun ini"}'

# ambiguous → clarifying
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "HP bagus"}'

curl http://localhost:8000/health
```

## Notes

- Rate limit: `MAX_QUERIES_PER_DAY` per IP (default 10), tracked in Redis with a
  Postgres fallback table.
- Caching TTLs: search 24h, product 12h, category 6h, trending 7d.
- API keys are never logged or returned. CORS is restricted to the configured
  frontend origins.
- Phase 2 (finance agent) is intentionally out of scope.
