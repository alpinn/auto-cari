-- Autocari Phase 1 — initial schema (Neon Postgres)
-- Run: psql "$DATABASE_URL" -f app/db/migrations/001_initial.sql

-- UUID helpers (gen_random_uuid lives in pgcrypto on older PGs)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Queries table (analytics)
CREATE TABLE IF NOT EXISTS queries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID,
  raw_query     TEXT NOT NULL,
  category      VARCHAR(50),
  is_cached     BOOLEAN DEFAULT FALSE,
  response_time INTEGER,
  result_count  INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at);
CREATE INDEX IF NOT EXISTS idx_queries_category ON queries(category);

-- Products table (cache)
CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     VARCHAR(255) UNIQUE,
  name            TEXT NOT NULL,
  marketplace     VARCHAR(50),
  store_name      VARCHAR(255),
  store_badge     VARCHAR(50),
  price           BIGINT,
  rating          DECIMAL(3,2),
  image_url       TEXT,
  product_url     TEXT NOT NULL,
  specifications  JSONB,
  raw_data        JSONB,
  last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id);
CREATE INDEX IF NOT EXISTS idx_products_marketplace ON products(marketplace);

-- Search results (query -> products mapping)
CREATE TABLE IF NOT EXISTS search_results (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id         UUID REFERENCES queries(id),
  product_id       UUID REFERENCES products(id),
  rank             INTEGER,
  score            DECIMAL(4,2),
  ai_reasoning     TEXT,
  pros             TEXT[],
  cons             TEXT[],
  is_editor_choice BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_search_results_query_id ON search_results(query_id);

-- Waitlist (coming soon categories)
CREATE TABLE IF NOT EXISTS waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL,
  category    VARCHAR(50) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, category)
);

-- Rate limits fallback
CREATE TABLE IF NOT EXISTS rate_limits (
  ip_address   VARCHAR(45) PRIMARY KEY,
  query_count  INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
