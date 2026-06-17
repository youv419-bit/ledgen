require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { initDb } = require('./models/initDb');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { complianceHeaders } = require('./middleware/compliance');
const logger = require('./middleware/logger');

const leadsRouter = require('./routes/leads');
const searchRouter = require('./routes/search');
const auditRouter = require('./routes/audit');
const outreachRouter = require('./routes/outreach');
const exportRouter = require('./routes/export');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security ────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 15,
  message: { error: 'Search rate limit exceeded. Please wait a moment.' },
});

const auditLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Audit rate limit exceeded. Please wait a moment.' },
});

app.use('/api/', globalLimiter);

// ── Parsing ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request Logging ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(logger);
}

// ── Compliance Headers ────────────────────────────────────────────────────────
app.use(complianceHeaders);

// ── Health & Compliance endpoints ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/api/compliance', (req, res) => {
  res.json({
    tool: 'CommerceLead Finder',
    version: '1.0.0',
    compliance: {
      gdpr: true,
      robotsTxtRespected: true,
      publicDataOnly: true,
      noPrivateScraping: true,
    },
    notice: 'CommerceLead Finder only collects publicly available information. We respect robots.txt, do not scrape private or authenticated data, and comply with GDPR regulations.',
    dataTypesCollected: [
      'Company name (from public page title/meta)',
      'Website URL (public)',
      'Email addresses (visible in public HTML only)',
      'Phone numbers (visible in public HTML only)',
      'Social media links (visible in public HTML only)',
      'Technology stack (detectable from public HTTP headers/HTML)',
      'SEO metadata (public title, description, headings)',
    ],
    dataRetentionDays: 90,
    userRights: 'You may request deletion of any stored data at any time.',
    contact: process.env.COMPLIANCE_EMAIL || 'privacy@commercelead.app',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/leads', leadsRouter);
app.use('/api/search', searchLimiter, searchRouter);
app.use('/api/audit', auditLimiter, auditRouter);
app.use('/api/outreach', outreachRouter);
app.use('/api/export', exportRouter);
app.use('/api/stats', statsRouter);

// ── 404 & Error Handlers ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log('\x1b[36m┌─────────────────────────────────────────┐\x1b[0m');
      console.log(`\x1b[36m│\x1b[0m  🎯 CommerceLead Finder API             \x1b[36m│\x1b[0m`);
      console.log(`\x1b[36m│\x1b[0m  Port:  \x1b[32m${PORT}\x1b[0m                          \x1b[36m│\x1b[0m`);
      console.log(`\x1b[36m│\x1b[0m  Mode:  \x1b[33m${(process.env.NODE_ENV || 'development').padEnd(11)}\x1b[0m                  \x1b[36m│\x1b[0m`);
      console.log(`\x1b[36m│\x1b[0m  Health: http://localhost:${PORT}/health   \x1b[36m│\x1b[0m`);
      console.log('\x1b[36m└─────────────────────────────────────────┘\x1b[0m');
    });
  } catch (err) {
    console.error('\x1b[31mFailed to start server:\x1b[0m', err);
    process.exit(1);
  }
}

start();

module.exports = app;
