const express = require('express');
const { stringify } = require('csv-stringify/sync');
const { getDb } = require('../models/initDb');

const exportRouter = express.Router();
const statsRouter = express.Router();

// GET /api/export/csv
exportRouter.get('/csv', (req, res) => {
  try {
    const db = getDb();
    const { ids, country, platform, minScore } = req.query;

    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (ids) {
      const idList = ids.split(',');
      query += ` AND id IN (${idList.map(() => '?').join(',')})`;
      params.push(...idList);
    }
    if (country && country !== 'all') { query += ' AND country = ?'; params.push(country); }
    if (platform && platform !== 'all') { query += ' AND platform = ?'; params.push(platform); }
    if (minScore) { query += ' AND score >= ?'; params.push(parseInt(minScore)); }

    const leads = db.prepare(query).all(params);

    const csvData = leads.map(lead => ({
      'Company Name': lead.company_name || '',
      'Website': lead.website || '',
      'Country': lead.country || '',
      'Platform': lead.platform || '',
      'Industry': lead.industry || '',
      'Email': lead.email || '',
      'Phone': lead.phone || '',
      'LinkedIn': lead.linkedin_url || '',
      'Facebook': lead.facebook_url || '',
      'Instagram': lead.instagram_url || '',
      'Score': lead.score || '',
      'Status': lead.status || '',
      'Technology Stack': lead.technology_stack || '',
      'Theme': lead.theme || '',
      'Store Age': lead.store_age_estimate || '',
      'Contact Page': lead.contact_page_url || '',
      'About Page': lead.about_page_url || '',
      'Created At': lead.created_at || '',
    }));

    const csv = stringify(csvData, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="commercelead-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/overview
statsRouter.get('/overview', (req, res) => {
  try {
    const db = getDb();

    const totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    const shopifyLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE platform = 'shopify'").get().count;
    const wordpressLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE platform IN ('wordpress', 'woocommerce')").get().count;
    const hotLeads = db.prepare('SELECT COUNT(*) as count FROM leads WHERE score >= 70').get().count;
    const contactedLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'contacted'").get().count;
    const avgScore = db.prepare('SELECT AVG(score) as avg FROM leads').get().avg;

    const byCountry = db.prepare(`
      SELECT country, COUNT(*) as count FROM leads 
      WHERE country IS NOT NULL 
      GROUP BY country 
      ORDER BY count DESC
    `).all();

    const byPlatform = db.prepare(`
      SELECT platform, COUNT(*) as count FROM leads 
      WHERE platform IS NOT NULL 
      GROUP BY platform 
      ORDER BY count DESC
    `).all();

    const byIndustry = db.prepare(`
      SELECT industry, COUNT(*) as count FROM leads 
      WHERE industry IS NOT NULL 
      GROUP BY industry 
      ORDER BY count DESC
      LIMIT 5
    `).all();

    const recentLeads = db.prepare(`
      SELECT id, company_name, website, platform, country, score, created_at
      FROM leads ORDER BY created_at DESC LIMIT 5
    `).all();

    const scoreDistribution = [
      { range: '80-100', count: db.prepare('SELECT COUNT(*) as c FROM leads WHERE score >= 80').get().c },
      { range: '60-79', count: db.prepare('SELECT COUNT(*) as c FROM leads WHERE score >= 60 AND score < 80').get().c },
      { range: '40-59', count: db.prepare('SELECT COUNT(*) as c FROM leads WHERE score >= 40 AND score < 60').get().c },
      { range: '20-39', count: db.prepare('SELECT COUNT(*) as c FROM leads WHERE score >= 20 AND score < 40').get().c },
      { range: '0-19', count: db.prepare('SELECT COUNT(*) as c FROM leads WHERE score < 20').get().c },
    ];

    res.json({
      totals: { totalLeads, shopifyLeads, wordpressLeads, hotLeads, contactedLeads },
      avgScore: Math.round(avgScore || 0),
      byCountry,
      byPlatform,
      byIndustry,
      recentLeads,
      scoreDistribution,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { exportRouter, statsRouter };
