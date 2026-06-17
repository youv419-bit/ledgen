const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/commercelead.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

async function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      company_name TEXT,
      website TEXT NOT NULL,
      country TEXT,
      platform TEXT,
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
      plugins TEXT,
      woocommerce INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      score_breakdown TEXT,
      status TEXT DEFAULT 'new',
      tags TEXT DEFAULT '[]',
      notes TEXT,
      audit_data TEXT,
      opportunity_report TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_audited DATETIME,
      UNIQUE(website)
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      website TEXT NOT NULL,
      seo_score INTEGER,
      performance_score INTEGER,
      conversion_score INTEGER,
      overall_score INTEGER,
      seo_issues TEXT,
      performance_issues TEXT,
      conversion_issues TEXT,
      raw_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS outreach (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      type TEXT NOT NULL,
      subject TEXT,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS search_history (
      id TEXT PRIMARY KEY,
      query TEXT,
      country TEXT,
      industry TEXT,
      platform TEXT,
      results_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Default tags
  const insertTag = database.prepare(`INSERT OR IGNORE INTO tags (id, name, color) VALUES (?, ?, ?)`);
  [
    ['tag-1', 'Hot Lead', '#EF4444'],
    ['tag-2', 'Contacted', '#F59E0B'],
    ['tag-3', 'Follow Up', '#8B5CF6'],
    ['tag-4', 'Closed', '#10B981'],
    ['tag-5', 'Not Interested', '#6B7280'],
  ].forEach(([id, name, color]) => insertTag.run(id, name, color));

  console.log('✅ Database initialized at:', DB_PATH);
  return database;
}

module.exports = { getDb, initDb };

// Allow running as a script: node src/models/initDb.js
if (require.main === module) {
  initDb()
    .then(() => { console.log('Done.'); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
}
