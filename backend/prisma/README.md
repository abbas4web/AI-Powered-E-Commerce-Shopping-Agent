# Prisma Setup Notes

## pgvector Extension

The `products` table uses a `vector(768)` column for semantic search embeddings.
This requires the pgvector extension to be enabled **before** running migrations.

The Docker image `pgvector/pgvector:pg16` (in `docker-compose.yml`) includes pgvector.

### First-time setup

```bash
# 1. Start the database
docker-compose up -d postgres

# 2. Run migrations (pgvector extension is enabled via schema.prisma extensions)
npx prisma migrate dev --name init

# 3. Seed the database
npx prisma db seed
```

## Notes on Unsupported fields

- `embedding Unsupported("vector(768)")` — used for pgvector similarity search.
  Prisma does not generate type-safe accessors for this field.
  It is written/read via raw SQL in Phase 5 (semantic search).

- `searchVector Unsupported("tsvector")` — auto-populated via a Postgres trigger
  added in the migration SQL. Used for full-text search.

## Schema overview

| Model             | Purpose                                      |
|-------------------|----------------------------------------------|
| User              | Authentication and profile                   |
| UserPreferences   | Personalization preferences                  |
| Category          | Hierarchical product categories              |
| Brand             | Product brands                               |
| Product           | Core product catalog (JSONB specs)           |
| Review            | User reviews with AI sentiment fields        |
| WishlistItem      | User wishlist                                |
| Conversation      | Multi-turn chat history (JSONB messages)     |
| Recommendation    | AI-generated recommendations with scores     |
| AnalyticsEvent    | Usage tracking                               |
