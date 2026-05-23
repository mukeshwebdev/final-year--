# FIR Management System

A full-stack AI-powered First Information Report (FIR) Management System for a police station, built with React.js, Node.js/Express, PostgreSQL (Prisma ORM), and a Python FastAPI AI microservice.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  React Frontend │────▶│  Node.js/Express API  │────▶│  PostgreSQL (Prisma)│
│  (port 3000)    │     │  (port 5000)          │     │  (port 5432)        │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘
                                  │
                                  ▼
                        ┌──────────────────────┐
                        │  Python FastAPI AI   │
                        │  (port 8000)         │
                        └──────────────────────┘
```

---

## Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+ (or Docker)
- npm or yarn

---

## Quick Start

### Step 1 — Clone and set up environment

```bash
cd fir-management
cp .env.example .env
# Edit .env with your actual values
```

### Step 2 — Start PostgreSQL

**Option A: Docker (recommended)**
```bash
docker-compose up -d postgres
```

**Option B: Local PostgreSQL**
```
Create a database named: fir_management
Update DATABASE_URL in .env accordingly
```

### Step 3 — Set up the Node.js backend

```bash
cd server
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database
node ../prisma/seed.js

# Start the server
npm run dev
```

Server runs at: http://localhost:5000

### Step 4 — Set up the Python AI microservice

```bash
cd ai-service

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Start AI service
python main.py
```

AI service runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

### Step 5 — Set up the React frontend

```bash
cd client
npm install
npm start
```

Frontend runs at: http://localhost:3000

---

## Login Credentials (after seeding)

| Role        | Email                | Password     |
|-------------|----------------------|--------------|
| Super Admin | admin@fir.gov        | Admin@123    |
| Inspector   | inspector@fir.gov    | Inspect@123  |
| SI          | si@fir.gov           | SI@12345     |
| Writer      | writer1@fir.gov      | Writer@123   |
| Writer 2    | writer2@fir.gov      | Writer@456   |
| Citizen     | citizen@fir.gov      | Citizen@123  |

---

## Features

### Role-Based Access Control
- **Super Admin** — Full system access, user management, audit logs, analytics
- **Inspector** — Approve/reject FIRs, close cases, manage court hearings
- **SI (Sub-Inspector)** — Investigate assigned cases, add investigation logs
- **Writer (Clerk)** — File new FIRs, generate PDFs, send acknowledgments
- **Citizen** — File complaints online, track FIR status by number

### AI Features (Python microservice)
1. **Crime Categorization** — Predicts crime type from incident description (keyword + Gemini fallback)
2. **Urgency Scoring** — Rule-based + keyword scoring (LOW/MEDIUM/HIGH/CRITICAL)
3. **Named Entity Recognition** — Extracts names, locations, dates using spaCy
4. **Duplicate Detection** — Sentence-transformers similarity scoring (all-MiniLM-L6-v2), warns at >85%
5. **Case Summarization** — 3-5 line summary via Gemini API

### Core Features
- Complete FIR lifecycle: Filed → Under Investigation → Chargesheet → Court → Closed
- Aadhaar-based criminal search with repeat offender flagging
- Watchlist management
- Court hearing scheduling with email reminders
- Timeline view per FIR
- PDF export with QR code (official + watermarked citizen copy)
- Evidence file uploads (images, PDFs)
- Investigation logs per case
- Chargesheet generation
- Full audit log of all actions

### Dashboard & Analytics
- Role-specific dashboards
- Charts: FIRs per month, crime type distribution, case status breakdown (Recharts)
- Top crime locations table
- Repeat offender and watchlist counts

---

## API Documentation

Base URL: `http://localhost:5000/api`

### Auth
| Method | Endpoint              | Description              |
|--------|----------------------|--------------------------|
| POST   | /auth/login           | Login                    |
| POST   | /auth/refresh         | Refresh access token     |
| GET    | /auth/me              | Get current user         |
| POST   | /auth/change-password | Change password          |

### FIRs
| Method | Endpoint                        | Description                     |
|--------|---------------------------------|---------------------------------|
| GET    | /firs                           | List FIRs (with pagination/filters) |
| POST   | /firs                           | File new FIR                    |
| GET    | /firs/:id                       | Get FIR details                 |
| PUT    | /firs/:id                       | Update FIR                      |
| PATCH  | /firs/:id/status                | Update status                   |
| PATCH  | /firs/:id/assign                | Assign to officer               |
| POST   | /firs/:id/investigation-log     | Add investigation note          |
| GET    | /firs/:id/pdf                   | Download PDF                    |
| GET    | /firs/:id/summary               | Get AI summary                  |
| POST   | /firs/check-duplicates          | Check for duplicates            |
| POST   | /firs/:id/chargesheet           | Generate chargesheet            |
| GET    | /firs/track/:firNumber          | Track FIR by number (public)    |

### Aadhaar
| Method | Endpoint                       | Description              |
|--------|-------------------------------|--------------------------|
| GET    | /aadhaar/:aadhaarNumber        | Search by Aadhaar        |
| GET    | /aadhaar/search?query=...      | Search citizens          |
| GET    | /aadhaar/watchlist             | Get watchlist            |
| POST   | /aadhaar/watchlist/:accusedId  | Add to watchlist         |
| DELETE | /aadhaar/watchlist/:accusedId  | Remove from watchlist    |

### Court
| Method | Endpoint                           | Description             |
|--------|------------------------------------|-------------------------|
| GET    | /court/upcoming                    | Upcoming hearings (7d)  |
| GET    | /court/fir/:firId/hearings         | Hearings for FIR        |
| POST   | /court/fir/:firId/hearings         | Add hearing             |
| PUT    | /court/hearings/:hearingId         | Update hearing          |
| GET    | /court/fir/:firId/timeline         | Case timeline           |
| POST   | /court/hearings/:hearingId/remind  | Send email reminder     |

### Admin (Super Admin only)
| Method | Endpoint                      | Description            |
|--------|------------------------------|------------------------|
| GET    | /admin/users                 | List all users         |
| POST   | /admin/users                 | Create user            |
| PUT    | /admin/users/:id             | Update user            |
| POST   | /admin/users/:id/reset-password | Reset password      |
| GET    | /admin/audit-logs            | View audit logs        |
| GET    | /admin/analytics             | System analytics       |

---

## Environment Variables

See `.env.example` for the full list. Key variables:

```
DATABASE_URL          — PostgreSQL connection string
JWT_SECRET            — Secret for access tokens
JWT_REFRESH_SECRET    — Secret for refresh tokens
GEMINI_API_KEY        — Google Gemini API key (for crime categorization + summarization)
AI_SERVICE_URL        — Python AI service URL (default: http://localhost:8000)
EMAIL_HOST/USER/PASS  — SMTP config for email notifications
```

---

## Project Structure

```
fir-management/
├── prisma/           Schema + seed
├── ai-service/       Python FastAPI AI microservice
├── server/           Node.js Express API
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── services/   (AI, PDF, Email, Aadhaar)
│       └── utils/
├── client/           React.js frontend
│   └── src/
│       ├── api/        Axios API layer
│       ├── context/    Auth context
│       ├── components/ Sidebar, Navbar, etc.
│       └── pages/      Auth, Dashboard, FIR, Search, Court, Admin
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## Prisma Commands

```bash
# Inside /server directory
npx prisma generate          # Regenerate client after schema changes
npx prisma migrate dev        # Run migrations
npx prisma migrate reset      # Reset DB (dev only)
npx prisma studio            # GUI DB browser
node ../prisma/seed.js       # Reseed database
```

---

## Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Create an API key
3. Add it to `.env` as `GEMINI_API_KEY=your_key`

The system works without Gemini — it falls back to keyword-based categorization and rule-based summarization automatically.

---

## Notes

- The Aadhaar lookup uses a local mock table (no real UIDAI integration)
- Files are stored in `/server/uploads/` locally
- All actions are recorded in the AuditLog table
- PDF generation uses PDFKit with embedded QR codes
- Email requires valid SMTP credentials (works with Gmail App Passwords)
