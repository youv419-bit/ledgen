const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/initDb');
const { calculateLeadScore } = require('../services/scoringService');

const router = express.Router();

// GET /api/leads - List leads with filters
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const {
      search, country, platform, industry, status, tag,
      minScore, maxScore, page = 1, limit = 50,
      sortBy = 'created_at', sortOrder = 'DESC'
    } = req.query;

    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (company_name LIKE ? OR website LIKE ? OR email LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    if (country && country !== 'all') {
      query += ' AND country = ?';
      params.push(country);
    }
    if (platform && platform !== 'all') {
      if (platform === 'wordpress') {
        query += ' AND (platform = ? OR platform = ?)';
        params.push('wordpress', 'woocommerce');
      } else {
        query += ' AND platform = ?';
        params.push(platform);
      }
    }
    if (industry && industry !== 'all') {
      query += ' AND industry = ?';
      params.push(industry);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (tag) {
      query += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }
    if (minScore) {
      query += ' AND score >= ?';
      params.push(parseInt(minScore));
    }
    if (maxScore) {
      query += ' AND score <= ?';
      params.push(parseInt(maxScore));
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countQuery).get(params);

    // Sort
    const allowedSortFields = ['created_at', 'score', 'company_name', 'country', 'platform'];
    const safeSort = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${safeSort} ${safeOrder}`;

    // Paginate
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const leads = db.prepare(query).all(params);

    // Parse JSON fields
    const parsedLeads = leads.map(lead => ({
      ...lead,
      tags: safeParseJson(lead.tags, []),
      score_breakdown: safeParseJson(lead.score_breakdown, []),
      audit_data: safeParseJson(lead.audit_data, null),
      opportunity_report: safeParseJson(lead.opportunity_report, []),
    }));

    res.json({
      leads: parsedLeads,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    res.json({
      ...lead,
      tags: safeParseJson(lead.tags, []),
      score_breakdown: safeParseJson(lead.score_breakdown, []),
      audit_data: safeParseJson(lead.audit_data, null),
      opportunity_report: safeParseJson(lead.opportunity_report, []),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads - Create lead
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const id = uuidv4();
    const lead = req.body;

    const scoreResult = calculateLeadScore(lead, lead.audit_data);

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO leads (
        id, company_name, website, country, platform, industry,
        email, contact_page_url, about_page_url, linkedin_url,
        facebook_url, instagram_url, phone, store_age_estimate,
        technology_stack, theme, plugins, woocommerce,
        score, score_breakdown, status, tags, notes,
        audit_data, opportunity_report, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      )
    `);

    stmt.run(
      id,
      lead.company_name || null,
      lead.website,
      lead.country || null,
      lead.platform || null,
      lead.industry || null,
      lead.email || null,
      lead.contact_page_url || null,
      lead.about_page_url || null,
      lead.linkedin_url || null,
      lead.facebook_url || null,
      lead.instagram_url || null,
      lead.phone || null,
      lead.store_age_estimate || null,
      lead.technology_stack || null,
      lead.theme || null,
      JSON.stringify(lead.plugins || []),
      lead.woocommerce ? 1 : 0,
      scoreResult.score,
      JSON.stringify(scoreResult.breakdown),
      lead.status || 'new',
      JSON.stringify(lead.tags || []),
      lead.notes || null,
      lead.audit_data ? JSON.stringify(lead.audit_data) : null,
      lead.opportunity_report ? JSON.stringify(lead.opportunity_report) : null,
    );

    const created = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    res.status(201).json({
      ...created,
      tags: safeParseJson(created.tags, []),
      score_breakdown: safeParseJson(created.score_breakdown, []),
    });
  } catch (err) {
    console.error('Create lead error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/leads/:id - Update lead
router.patch('/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Lead not found' });

    const updates = req.body;
    const fields = [];
    const values = [];

    const allowedFields = [
      'company_name', 'status', 'notes', 'tags', 'industry',
      'country', 'email', 'phone', 'linkedin_url', 'facebook_url', 'instagram_url'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(typeof updates[field] === 'object' ? JSON.stringify(updates[field]) : updates[field]);
      }
    });

    if (fields.length === 0) return res.json(existing);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`).run(values);

    const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    res.json({
      ...updated,
      tags: safeParseJson(updated.tags, []),
      score_breakdown: safeParseJson(updated.score_breakdown, []),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/leads - Bulk delete
router.delete('/', (req, res) => {
  try {
    const db = getDb();
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array required' });
    }
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM leads WHERE id IN (${placeholders})`).run(ids);
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/tags/all
router.get('/tags/all', (req, res) => {
  try {
    const db = getDb();
    const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function safeParseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

module.exports = router;
