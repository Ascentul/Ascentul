# Dev Seed API

Seed endpoint for populating the database with templates and themes during development.

## Security Features

### 1. Environment Protection
- **Production Blocked**: Endpoint returns `403 Forbidden` in production
- Only accessible when `NODE_ENV !== "production"`

### 2. Optional API Key Authentication
- Set `DEV_SEED_API_KEY` in `.env.local` for additional protection
- When set, requests must include: `Authorization: Bearer <your-key>`
- When not set, endpoint works without authentication in development
- **Timing Attack Protection**: Uses `crypto.timingSafeEqual()` for constant-time comparison to prevent API key guessing via timing analysis

### 3. Safe Error Handling
- Generic error messages prevent leaking sensitive information
- Detailed errors logged server-side only
- No exposure of database connections, paths, or stack traces

## Usage

### Without API Key (Default)

```bash
# Seed the database
curl -X POST http://localhost:3000/api/dev/seed

# Check catalog counts
curl http://localhost:3000/api/dev/seed
```

### With API Key (Recommended)

1. Add to `.env.local`:
```bash
DEV_SEED_API_KEY=your-secret-key-here
```

2. Use with authorization header:
```bash
# Seed the database
curl -X POST http://localhost:3000/api/dev/seed \
  -H "Authorization: Bearer your-secret-key-here"

# Check catalog counts
curl http://localhost:3000/api/dev/seed \
  -H "Authorization: Bearer your-secret-key-here"
```

## Response Format

### POST Success Response
```json
{
  "before": { "templates": 0, "themes": 0 },
  "templates": { "inserted": 6, "message": "Templates seeded" },
  "themes": { "inserted": 4, "message": "Themes seeded" },
  "after": { "templates": 6, "themes": 4 }
}
```

### GET Response
```json
{
  "templates": 6,
  "themes": 4
}
```

### Error Responses

**Production Environment (403)**:
```json
{
  "error": "Seeding is only available in development"
}
```

**Unauthorized (401)** - when API key is set but not provided:
```json
{
  "error": "Unauthorized"
}
```

**Server Error (500)** - POST endpoint:
```json
{
  "error": "Failed to seed database"
}
```

**Server Error (500)** - GET endpoint:
```json
{
  "error": "Failed to fetch catalog"
}
```

**Note**: Detailed error information is logged server-side only and not exposed to clients for security.

## Alternative: CLI Script

For direct seeding without the HTTP endpoint:

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-url.convex.cloud node scripts/seed.mjs
```

This bypasses the API endpoint entirely and seeds directly via Convex client.

## Idempotent Design

- Running multiple times won't create duplicates
- Checks for existing data before inserting
- Safe to run repeatedly during development
