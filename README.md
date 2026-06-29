# AWS Route 53 Clone

A functional clone of the AWS Route 53 web application built with Next.js, FastAPI, and SQLite.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Git

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd route53-clone
```

### 2. Start the Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API docs: http://localhost:8000/docs

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

### 4. Use the app
1. Open http://localhost:3000
2. Create an account (no AWS account needed)
3. Start creating hosted zones and DNS records

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Port 3000)                      │
│                                                                 │
│   ┌──────────┐   ┌──────────────────────────────────────────┐  │
│   │ Sidebar  │   │              Main Content                │  │
│   │ TopNav   │   │  Hosted Zones │ DNS Records │ Dashboard  │  │
│   └──────────┘   └──────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP (Axios)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Port 8000)                  │
│                                                                 │
│   /api/auth      /api/zones      /api/zones/{id}/records       │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              SQLAlchemy ORM                              │  │
│   └──────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │   SQLite DB     │
                    │  route53.db     │
                    └─────────────────┘
```

### Frontend (Next.js 14 + TypeScript)
- **App Router** with file-based routing
- **No external UI library** — all components hand-built to match AWS aesthetics
- **Axios** for API calls with JWT interceptors
- **LocalStorage** for session persistence
- CSS custom properties for the AWS dark color system

### Backend (FastAPI + Python)
- **JWT authentication** via `python-jose`
- **bcrypt** password hashing
- **SQLAlchemy** ORM with SQLite
- **Pydantic v2** for request/response validation
- **CORS** configured for local development

---

## 🗄️ Database Schema

```sql
-- Users table
CREATE TABLE users (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Hosted zones
CREATE TABLE hosted_zones (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,           -- e.g. "example.com."
    comment          TEXT DEFAULT '',
    private_zone     BOOLEAN DEFAULT FALSE,
    record_count     INTEGER DEFAULT 2,
    status           TEXT DEFAULT 'INSYNC',
    caller_reference TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME
);

-- DNS records
CREATE TABLE dns_records (
    id             TEXT PRIMARY KEY,
    zone_id        TEXT REFERENCES hosted_zones(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,             -- e.g. "www"
    record_type    TEXT NOT NULL,             -- A, AAAA, CNAME, MX, TXT, NS, PTR, SRV, CAA
    ttl            INTEGER DEFAULT 300,
    value          TEXT NOT NULL,             -- newline-separated for multiple values
    routing_policy TEXT DEFAULT 'Simple',
    alias          BOOLEAN DEFAULT FALSE,
    comment        TEXT DEFAULT '',
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME
);
```

---

## 🔌 API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Hosted Zones
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/zones?search=&page=&page_size=` | List zones (paginated) |
| POST | `/api/zones` | Create zone |
| GET | `/api/zones/{id}` | Get zone details |
| PUT | `/api/zones/{id}` | Update zone comment |
| DELETE | `/api/zones/{id}` | Delete zone + all records |

### DNS Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/zones/{id}/records?search=&record_type=&page=` | List records |
| POST | `/api/zones/{id}/records` | Create record |
| GET | `/api/zones/{id}/records/{rid}` | Get record |
| PUT | `/api/zones/{id}/records/{rid}` | Update record |
| DELETE | `/api/zones/{id}/records/{rid}` | Delete record |

All protected endpoints require: `Authorization: Bearer <token>`

Full interactive docs at: `http://localhost:8000/docs`

---

## ✅ Features Implemented

- [x] Mocked authentication (register / login / logout) with JWT + bcrypt
- [x] Session persistence via localStorage
- [x] Hosted Zones — full CRUD with search, pagination, modals
- [x] DNS Records — full CRUD with type filter, search, pagination
- [x] Supported record types: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
- [x] Routing policies: Simple, Weighted, Latency, Failover, Geolocation, Multivalue
- [x] AWS-authentic dark UI (color system, table style, badges, modals, toasts)
- [x] Sticky top navigation + sidebar with active state
- [x] Dashboard with service cards
- [x] Coming Soon stubs: Traffic Policies, Health Checks, Resolver, Profiles
- [x] SQLite persistence for all data

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS + Custom CSS variables |
| HTTP Client | Axios |
| Icons | Lucide React |
| Backend | FastAPI (Python 3.10+) |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Validation | Pydantic v2 |
