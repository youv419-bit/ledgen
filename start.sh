#!/bin/bash

# CommerceLead Finder - Quick Start Script
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}┌─────────────────────────────────────┐${NC}"
echo -e "${CYAN}│   🎯 CommerceLead Finder Setup       │${NC}"
echo -e "${CYAN}└─────────────────────────────────────┘${NC}"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ required. Install from https://nodejs.org${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# ── Backend Setup ─────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install --silent

# Create .env if missing
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${GREEN}✓ Created backend/.env from .env.example${NC}"
  echo -e "${YELLOW}  ⚠ Edit backend/.env with your settings${NC}"
fi

# Init DB
echo -e "${YELLOW}🗄  Initializing database...${NC}"
node src/models/initDb.js

# Seed demo data
echo -e "${YELLOW}🌱 Seeding demo leads...${NC}"
node src/models/seed.js

cd ..

# ── Frontend Setup ────────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd frontend
npm install --silent

# Create .env.local if missing
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  echo -e "${GREEN}✓ Created frontend/.env.local${NC}"
fi

cd ..

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}┌─────────────────────────────────────────┐${NC}"
echo -e "${GREEN}│   ✅ Setup complete! Start with:         │${NC}"
echo -e "${GREEN}│                                          │${NC}"
echo -e "${GREEN}│   Terminal 1: cd backend && npm run dev  │${NC}"
echo -e "${GREEN}│   Terminal 2: cd frontend && npm run dev │${NC}"
echo -e "${GREEN}│                                          │${NC}"
echo -e "${GREEN}│   Frontend: http://localhost:3000        │${NC}"
echo -e "${GREEN}│   Backend:  http://localhost:3001        │${NC}"
echo -e "${GREEN}│   Health:   http://localhost:3001/health │${NC}"
echo -e "${GREEN}└─────────────────────────────────────────┘${NC}"
echo ""
