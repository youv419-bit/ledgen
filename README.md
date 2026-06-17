# CommerceLead Finder 🎯

> A full-stack, production-ready lead generation tool for Shopify and WordPress development, SEO, CRO, maintenance, migration, and digital marketing services.

![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Express.js%20%7C%20SQLite-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![GDPR](https://img.shields.io/badge/GDPR-Compliant-success)

---

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Installation Guide](#installation-guide)
7. [Deployment Guide](#deployment-guide)
8. [Environment Variables](#environment-variables)
9. [Usage Guide](#usage-guide)
10. [Compliance](#compliance)

---

## ✨ Features

- **Lead Discovery** — Find Shopify & WordPress stores by country and industry
- **Platform Detection** — Auto-detect Shopify, WordPress, WooCommerce from any URL
- **Website Audit** — Full SEO, performance, and conversion audit
- **Lead Scoring** — Automatic 1–100 score based on audit findings
- **AI Opportunity Reports** — Service opportunities with estimated revenue
- **Outreach Generation** — Cold emails, LinkedIn DMs, and follow-up messages
- **Lead Dashboard** — Search, filter, tag, and manage leads
- **CSV Export** — Export filtered leads with one click
- **GDPR Compliant** — Only public data, respects robots.txt

### Target Countries
🇺🇸 USA · 🇬🇧 UK · 🇩🇪 Germany · 🇦🇺 Australia · 🇨🇦 Canada

### Target Industries
Fashion · Jewelry · Beauty · Health · Electronics · Home Decor · Furniture · Food · Sports · Automotive

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────┐
                    │   Next.js Frontend (Vercel)  │
                    │                              │
                    │  ┌────────┐  ┌────────────┐  │
                    │  │Dashboard│  │Lead Database│ │
                    │  └────────┘  └────────────┘  │
                    │  ┌────────┐  ┌────────────┐  │
                    │  │Find Leads│ │Website Audit│ │
                    │  └────────┘  └────────────┘  │
                    │  ┌────────┐  ┌────────────┐  │
                    │  │Outreach │  │  Settings  │  │
                    │  └────────┘  └────────────┘  │
                    └───────────┬─────────────────┘
                                │ REST API (axios)
                                │ NEXT_PUBLIC_API_URL
                    ┌───────────▼─────────────────┐
                    │   Express.js Backend (Render) │
                    │                              │
                    │  /api/leads   - CRUD          │
                    │  /api/search  - Find leads    │
                    │  /api/audit   - Site audit    │
                    │  /api/outreach - Messages     │
                    │  /api/export  - CSV export    │
                    │  /api/stats   - Dashboard     │
                    │                              │
                    │  ┌─────────────────────────┐ │
                    │  │    Services Layer        │ │
                    │  │  detectionService.js     │ │
                    │  │  auditService.js         │ │
                    │  │  scoringService.js       │ │
                    │  │  outreachService.js      │ │
                    │  │  searchService.js        │ │
                    │  └────────────┬────────────┘ │
                    └───────────────┼─────────────┘
                                    │
                    ┌───────────────▼─────────────┐
                    │     SQLite Database          │
                    │  (better-sqlite3)            │
                    │                              │
                    │  leads · audits · outreach   │
                    │  tags · search_history       │
                    └─────────────────────────────┘
```

---

## 📁 Project Structure

```
commercelead-finder/
├── frontend/                    # Next.js 14 App Router
│   ├── app/
│   │   ├── (app)/               # Authenticated app shell
│   │   │   ├── layout.tsx       # Sidebar + navigation
│   │   │   ├── dashboard/       # Analytics dashboard
│   │   │   ├── leads/           # Lead database + detail view
│   │   │   │   └── [id]/        # Individual lead page
│   │   │   ├── search/          # Lead finder
│   │   │   ├── audit/           # Website audit tool
│   │   │   ├── outreach/        # Message generation hub
│   │   │   └── settings/        # Configuration
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Redirects to dashboard
│   │   └── providers.tsx        # React Query + Toast
│   ├── lib/
│   │   ├── api.ts               # Axios API client
│   │   └── utils.ts             # Helper utilities
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                     # Express.js REST API
│   ├── src/
│   │   ├── index.js             # App entry point
│   │   ├── models/
│   │   │   └── initDb.js        # SQLite schema + setup
│   │   ├── routes/
│   │   │   ├── leads.js         # CRUD endpoints
│   │   │   ├── search.js        # Lead discovery
│   │   │   ├── audit.js         # Website audit
│   │   │   ├── outreach.js      # Message generation
│   │   │   ├── export.js        # CSV export
│   │   │   └── stats.js         # Dashboard stats
│   │   └── services/
│   │       ├── detectionService.js   # Platform detection
│   │       ├── auditService.js       # SEO/perf/conv audit
│   │       ├── scoringService.js     # Lead scoring engine
│   │       ├── outreachService.js    # Message templates
│   │       └── searchService.js      # Lead search
│   ├── data/                    # SQLite database files
│   ├── .env.example
│   ├── render.yaml              # Render deployment config
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema

```sql
-- Leads table (main data store)
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  company_name TEXT,
  website TEXT NOT NULL UNIQUE,
  country TEXT,                    -- usa | uk | germany | australia | canada
  platform TEXT,                   -- shopify | wordpress | woocommerce | unknown
  industry TEXT,
  email TEXT,
  contact_page_url TEXT,
  about_page_url TEXT,
  linkedin_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  phone TEXT,
  store_age_estimate TEXT,
  technology_stack TEXT,
  theme TEXT,
  plugins TEXT,                    -- JSON array
  woocommerce INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,         -- 1-100 lead score
  score_breakdown TEXT,            -- JSON array
  status TEXT DEFAULT 'new',       -- new|contacted|qualified|proposal|closed_won|closed_lost
  tags TEXT DEFAULT '[]',          -- JSON array
  notes TEXT,
  audit_data TEXT,                 -- JSON full audit result
  opportunity_report TEXT,         -- JSON opportunities array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_audited DATETIME
);

-- Audit history
CREATE TABLE audits (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  website TEXT NOT NULL,
  seo_score INTEGER,
  performance_score INTEGER,
  conversion_score INTEGER,
  overall_score INTEGER,
  seo_issues TEXT,                 -- JSON
  performance_issues TEXT,         -- JSON
  conversion_issues TEXT,          -- JSON
  raw_data TEXT,                   -- JSON full result
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Outreach messages
CREATE TABLE outreach (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  type TEXT NOT NULL,              -- cold_email | linkedin | followup
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',     -- draft | sent | replied
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Search history
CREATE TABLE search_history (
  id TEXT PRIMARY KEY,
  query TEXT, country TEXT, industry TEXT, platform TEXT,
  results_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Custom tags
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 API Reference

### Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List leads (paginated, filterable) |
| GET | `/api/leads/:id` | Get single lead |
| POST | `/api/leads` | Create lead |
| PATCH | `/api/leads/:id` | Update lead |
| DELETE | `/api/leads/:id` | Delete lead |
| DELETE | `/api/leads` | Bulk delete (body: `{ids:[]}`) |
| GET | `/api/leads/tags/all` | Get all tags |

**GET /api/leads query params:**
```
search, country, platform, industry, status, tag,
minScore, maxScore, page, limit, sortBy, sortOrder
```

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Search for leads `{country, industry, platform, limit}` |
| POST | `/api/search/analyze` | Analyze single URL `{url}` |
| GET | `/api/search/history` | Search history |

### Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audit` | Run audit `{url, leadId?}` |
| GET | `/api/audit/history/:leadId` | Audit history for a lead |

### Outreach

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/outreach/generate` | Generate message `{leadId, type}` |
| GET | `/api/outreach/:leadId` | Get messages for lead |
| PATCH | `/api/outreach/:id/status` | Update status `{status}` |

### Export & Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/csv` | Export leads as CSV |
| GET | `/api/stats/overview` | Dashboard statistics |
| GET | `/health` | Health check |
| GET | `/api/compliance` | GDPR compliance info |

---

## 🚀 Installation Guide

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git

### Step 1: Clone / Setup

```bash
# Clone or download the project
git clone https://github.com/yourname/commercelead-finder.git
cd commercelead-finder
```

### Step 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env   # or use your editor

# Initialize database
npm run init-db

# Start development server
npm run dev
```

Backend runs at: **http://localhost:3001**

Test it: http://localhost:3001/health

### Step 3: Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:3000**

### Step 4: Verify

1. Open http://localhost:3000
2. You should see the Dashboard
3. Go to "Find Leads" and run a search
4. Demo leads will populate

---

## 🌐 Deployment Guide

### Backend → Render (Free)

1. Push `backend/` folder to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** `backend` (if monorepo)
5. Add environment variables (see below)
6. Add a **Disk** in Render: mount path `/var/data`, size 1GB
7. Set `DB_PATH=/var/data/commercelead.db`
8. Deploy!

Your backend URL: `https://your-service-name.onrender.com`

> **Free tier note:** Render free tier sleeps after 15 min of inactivity. Use [UptimeRobot](https://uptimerobot.com) (free) to ping `/health` every 10 min to keep it awake.

### Frontend → Vercel (Free)

1. Push `frontend/` folder to GitHub  
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo
4. Settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend` (if monorepo)
5. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-service-name.onrender.com
   ```
6. Deploy!

### Backend → Railway (Alternative Free)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# From backend directory
cd backend
railway init
railway up
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
# Production: FRONTEND_URL=https://your-app.vercel.app

# Database path
DB_PATH=./data/commercelead.db
# Render production: DB_PATH=/var/data/commercelead.db

# Compliance contact email
COMPLIANCE_EMAIL=privacy@yourcompany.com

# Optional: Search API Keys (for real web search)
# SERPAPI_KEY=your_key_here
# SCRAPERAPI_KEY=your_key_here
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
# Production: NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 📖 Usage Guide

### 1. Find Leads

1. Navigate to **Find Leads** (sidebar)
2. Select Country, Industry, Platform, and limit
3. Click **Search Leads**
4. Review results with platform badges and scores
5. Click **Save Lead** on any result to add to database
6. Or **Save All** to bulk save

### 2. Analyze a URL

1. On the Find Leads page, scroll to **Analyze a Specific URL**
2. Paste any website URL
3. Click **Analyze**
4. See platform detection result instantly

### 3. Run a Website Audit

1. Navigate to **Website Audit** (sidebar)
2. Enter any website URL
3. Click **Run Audit**
4. Review:
   - SEO issues (title, meta, H1, alt tags, etc.)
   - Performance issues (load time, images, compression)
   - Conversion issues (trust badges, reviews, email capture)
5. Click **Save as Lead** to add to database with audit data

### 4. Lead Database

1. Navigate to **Lead Database** (sidebar)
2. Use search bar for text search
3. Click **Filters** for advanced filtering
4. Click any lead to open the detail view:
   - **Overview:** Contact info, tech stack, score breakdown
   - **Audit:** Full audit results with issue severity
   - **Opportunities:** AI-generated service opportunities
   - **Outreach:** Generate personalized messages
   - **Notes:** Add private notes

### 5. Generate Outreach

1. Navigate to **Outreach Hub** (sidebar)
2. Select message type (Cold Email / LinkedIn DM / Follow-up)
3. Filter leads by platform and minimum score
4. Click **Generate** on individual leads or select multiple → **Generate for X leads**
5. Click **Copy** to copy to clipboard
6. Customize `[Your Name]` and `[Your Company]` before sending

### 6. Export CSV

- From **Lead Database**: Click **Export CSV** (applies current filters)
- From **Settings**: Export all leads

---

## 🔒 Compliance

CommerceLead Finder is designed to be fully GDPR-compliant:

| Requirement | Implementation |
|-------------|---------------|
| **robots.txt** | All crawlers check robots.txt before accessing any page |
| **Public data only** | Only publicly accessible HTML/metadata is parsed |
| **No auth bypass** | No attempt to access login-protected content |
| **No private scraping** | No email harvesting from obfuscated sources |
| **Data storage** | All data stored locally in your own database |
| **Transparency** | `/api/compliance` endpoint lists all data types collected |
| **Right to erasure** | Delete any lead at any time |

**Data types collected (public only):**
- Company names (from page title/OG tags)
- Website URLs
- Email addresses (visible in page HTML only)
- Phone numbers (visible in page HTML only)
- Social media links (visible in page HTML only)
- Technology stack (detectable from public HTML/headers)

> ⚠️ **Your responsibility:** As the operator, ensure your use of this tool complies with local laws (GDPR, CCPA, etc.) in your jurisdiction. Do not spam collected contacts. Always provide an opt-out mechanism in your outreach.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (App Router) | Production React framework |
| Styling | Tailwind CSS | Utility-first, fast styling |
| UI Components | Radix UI primitives | Accessible, unstyled |
| State | TanStack Query v5 | Server state management |
| Charts | Recharts | Simple React charts |
| Backend | Express.js | Minimal Node.js framework |
| Database | SQLite (better-sqlite3) | Zero-config, file-based |
| Detection | Cheerio + Axios | Server-side HTML parsing |
| Deployment FE | Vercel | Best Next.js hosting |
| Deployment BE | Render / Railway | Free Node.js hosting |

**All free, all open source. Zero paid services required.**

---

## 🔮 Upgrading to Production Search

The current demo uses sample leads. To enable real web search:

### Option 1: SerpAPI (Recommended)
```bash
# .env
SERPAPI_KEY=your_key
```
Then update `searchService.js` to call:
```
https://serpapi.com/search?q=shopify+stores+site:.com+fashion&api_key=KEY
```

### Option 2: ScraperAPI
```bash
SCRAPERAPI_KEY=your_key
```
Proxy requests through ScraperAPI for bot-resistant scraping.

### Option 3: Bing Web Search API
Free tier: 1,000 calls/month on Azure.

---

## 📄 License

MIT License — use freely for personal and commercial projects.

---

Built with ❤️ using Next.js, Express.js, and SQLite.
