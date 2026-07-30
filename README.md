# Portfolio — Project Inquiry Backend

Production-ready backend for the Portfolio contact/start-a-project form.  
Built with **Fastify**, **Prisma**, **PostgreSQL (Supabase)**, and **Resend**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 20 |
| Framework | Fastify 5 |
| ORM | Prisma 6 |
| Database | PostgreSQL via Supabase |
| Email | Resend API |
| Validation | Zod |
| Security | Helmet · CORS · Rate Limit |
| Logging | Pino (pino-pretty in dev) |

---

## Project Structure

```
Portfolio/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration history
├── src/
│   ├── config/
│   │   └── env.js             # Zod-validated env loader
│   ├── emails/
│   │   └── templates.js       # HTML email templates (admin + client)
│   ├── middleware/
│   │   └── admin.js           # Admin API key guard
│   ├── prisma/
│   │   └── client.js          # Prisma singleton client
│   ├── routes/
│   │   └── inquiries.js       # All API route definitions
│   ├── services/
│   │   └── inquiry.js         # Business logic (create, read, update, delete)
│   ├── utils/
│   │   └── lead-id.js         # Lead ID generator (MC-YYYY-NNNNNN)
│   ├── validators/
│   │   └── inquiry.js         # Zod schemas for request validation
│   ├── app.js                 # Fastify app builder
│   └── server.js              # Server entry point
├── js/
│   └── inquiry-form.js        # Frontend form → API connector
├── .env.example               # Required environment variables
├── package.json
└── README.md
```

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/PORTFOLIO.git
cd PORTFOLIO
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then fill in all values in `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled connection (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase direct connection (port 5432, for migrations) |
| `RESEND_API_KEY` | Your Resend API key |
| `ADMIN_EMAIL` | Email address to receive inquiry notifications |
| `FROM_EMAIL` | Sender address (must be verified domain in Resend) |
| `FRONTEND_ORIGIN` | Frontend URL allowed by CORS (e.g. `http://localhost:5500`) |
| `ADMIN_API_KEY` | Secret key (≥24 chars) to protect admin routes |
| `PORT` | Server port (default: `3000`) |
| `NODE_ENV` | `development` or `production` |

> **Generate a secure ADMIN_API_KEY:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run database migrations

```bash
# Development (creates migration files)
npm run prisma:migrate

# Production (applies existing migrations only)
npm run prisma:deploy
```

### 6. Start the server

```bash
# Development (auto-restart on file change)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`.

---

## API Reference

### Public Endpoints

#### `POST /api/inquiry`

Submit a new project inquiry.

**Request Body** (JSON):

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "Acme Inc.",
  "service": "Web Design",
  "projectType": "Landing Page",
  "budget": "₹20,000 – ₹35,000",
  "timeline": "1 Month",
  "description": "We need a landing page for our new product launch...",
  "website": "",
  "formStartedAt": 1706600000000
}
```

**Success Response** (`201`):

```json
{
  "success": true,
  "leadId": "MC-2026-000001",
  "message": "Your inquiry has been received. We will contact you within 24 hours."
}
```

**Error Responses:**

| Status | Reason |
|---|---|
| `400` | Validation failed (field errors returned) |
| `409` | Duplicate submission within 10 minutes |
| `429` | Rate limited (10 requests/hour per IP) |

#### `GET /health`

Returns server status.

```json
{ "status": "ok", "timestamp": "...", "uptime": 123.45 }
```

---

### Admin Endpoints

All admin endpoints require the `x-admin-api-key` header matching `ADMIN_API_KEY`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/inquiries` | List all inquiries (newest first) |
| `GET` | `/api/inquiry/:id` | Get single inquiry by ID |
| `PATCH` | `/api/inquiry/:id/status` | Update inquiry status |
| `DELETE` | `/api/inquiry/:id` | Delete an inquiry |

**Status values:** `NEW` · `CONTACTED` · `IN_PROGRESS` · `COMPLETED` · `CLOSED`

**Example — update status:**

```bash
curl -X PATCH http://localhost:3000/api/inquiry/clxxxxxxx/status \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: your-admin-api-key" \
  -d '{"status": "CONTACTED"}'
```

---

## Database Schema

```prisma
model Inquiry {
  id          String        @id @default(cuid())
  leadId      String        @unique          // e.g. MC-2026-000001
  name        String
  email       String
  company     String?
  service     String
  projectType String
  budget      String?
  timeline    String
  description String
  status      InquiryStatus @default(NEW)
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

---

## Security Features

- **Helmet** — Sets secure HTTP headers
- **CORS** — Restricts requests to `FRONTEND_ORIGIN` only
- **Rate Limiting** — Max 10 requests per IP per hour
- **Honeypot Field** — Hidden `website` field; bots fill it in, humans don't
- **Timing Check** — Rejects submissions faster than 2.5 seconds (bot behavior)
- **Duplicate Guard** — Rejects same email + description within 10 minutes
- **Input Sanitization** — Strips `<>` characters from all text fields
- **HTML Escaping** — All email content is HTML-escaped before rendering
- **Admin API Key** — Protects admin routes with a secret header key
- **Environment Validation** — Server refuses to start with missing/invalid env vars

---

## Lead ID Format

Lead IDs follow the format **`MC-YYYY-NNNNNN`**:

```
MC-2026-000001
MC-2026-000002
...
MC-2027-000001   ← Resets each calendar year
```

---

## Supabase Connection Notes

Supabase provides two connection strings:

| Type | Port | Use for |
|---|---|---|
| **Pooled** (`DATABASE_URL`) | `6543` | Runtime queries (via PgBouncer) |
| **Direct** (`DIRECT_URL`) | `5432` | Prisma migrations only |

Both must be set in `.env`.

---

## License

MIT — see [LICENSE](./LICENSE)
