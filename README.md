# SmartShop AI — AI-Powered E-Commerce Shopping Agent

A production-quality AI-powered shopping assistant that understands natural-language
requirements, searches products intelligently, ranks them against your needs, and
explains its recommendations.

---

## Architecture Overview

```
smartshop-ai/
├── backend/          # NestJS API server
├── frontend/         # Next.js web application
├── shared/           # Shared TypeScript types and contracts
└── docker-compose.yml
```

### Backend Modules

| Module          | Responsibility                                      |
|-----------------|-----------------------------------------------------|
| Auth            | JWT authentication, refresh tokens                  |
| Users           | User management and profiles                        |
| Products        | Product catalog CRUD                                |
| Categories      | Category taxonomy                                   |
| Brands          | Brand registry                                      |
| Search          | Hybrid search (structured + semantic/vector)        |
| AI              | Gemini integration, tool orchestration              |
| Recommendations | Deterministic scoring and ranking engine            |
| Comparisons     | Side-by-side product comparison                     |
| Reviews         | Review storage and intelligence                     |
| Wishlist        | User wishlists                                      |
| Conversations   | Multi-turn conversation state                       |
| Preferences     | User preference profiles                            |
| Analytics       | Usage and recommendation analytics                  |

### AI Flow

```
User Message
  → Intent Detection
  → Requirement Extraction
  → Requirement Validation
  → Tool Selection (searchProducts, getProductDetails, ...)
  → Backend Service Execution
  → Hard Filtering (deterministic, not by AI)
  → Ranking Engine
  → Review Analysis
  → Recommendation Generation
  → Structured JSON Response
  → Frontend Rendering
```

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | Next.js 14, React 18, TypeScript, Tailwind CSS  |
| UI         | shadcn/ui, Radix UI                             |
| Backend    | NestJS, TypeScript, Prisma ORM                  |
| Database   | PostgreSQL 16 + pgvector                        |
| Cache      | Redis 7                                         |
| Queue      | BullMQ                                          |
| AI         | Google Gemini (provider-agnostic interface)     |
| Storage    | Cloudinary / S3-compatible                      |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- A Google Gemini API key

### 1. Start infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL (with pgvector) and Redis.

### 2. Backend setup

```bash
cd backend
cp ../.env.example .env
# Fill in your values in .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Backend runs on `http://localhost:4000`  
Frontend runs on `http://localhost:3000`

---

## Environment Variables

See `.env.example` in the root directory for all required variables.

---

## Implementation Phases

| Phase | Status      | Description                          |
|-------|-------------|--------------------------------------|
| 1     | ✅ Complete  | Project setup and architecture       |
| 2     | ⏳ Pending   | Database schema (Prisma)             |
| 3     | ⏳ Pending   | Authentication                       |
| 4     | ⏳ Pending   | Product catalog                      |
| 5     | ⏳ Pending   | Product search and filtering         |
| 6     | ⏳ Pending   | Gemini AI integration                |
| 7     | ⏳ Pending   | AI requirement extraction            |
| 8     | ⏳ Pending   | AI tool calling                      |
| 9     | ⏳ Pending   | Recommendation engine                |
| 10    | ⏳ Pending   | Product comparison                   |
| 11    | ⏳ Pending   | Review intelligence                  |
| 12    | ⏳ Pending   | Conversation memory                  |
| 13    | ⏳ Pending   | Personalization                      |
| 14    | ⏳ Pending   | Wishlist and history                 |
| 15    | ⏳ Pending   | Admin dashboard                      |
| 16    | ⏳ Pending   | Testing, security, optimization      |

---

## Security Principles

- AI cannot execute arbitrary SQL or shell commands
- AI interacts with data only via controlled tool functions
- All inputs validated with Zod/class-validator
- JWT with short-lived access tokens + refresh tokens
- Secrets never exposed to the frontend
- Rate limiting on all AI endpoints
- Prompt injection protection

---

## License

MIT
