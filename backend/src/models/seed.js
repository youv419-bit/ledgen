/**
 * Seed Script — populate the database with realistic demo leads
 * Run: node src/models/seed.js
 */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { initDb, getDb } = require('./initDb');

const DEMO_LEADS = [
  {
    company_name: 'TrendStyle Co.',
    website: 'https://trendstyle-demo.myshopify.com',
    country: 'usa', platform: 'shopify', industry: 'fashion',
    email: 'hello@trendstyle.com', phone: '+1-555-0100',
    linkedin_url: 'https://linkedin.com/company/trendstyle',
    facebook_url: 'https://facebook.com/trendstyle',
    instagram_url: 'https://instagram.com/trendstyle',
    store_age_estimate: '2-3 years',
    technology_stack: 'Shopify, Google Analytics, Klaviyo, Facebook Pixel',
    theme: 'Dawn', score: 78, status: 'new',
    audit_data: JSON.stringify({
      seoScore: 45, performanceScore: 60, conversionScore: 40,
      loadTime: 3800,
      seo: { issues: [
        { id: 'missing-meta-desc', severity: 'critical', message: 'Missing meta description', impact: 'high' },
        { id: 'missing-alt-tags', severity: 'critical', message: '12 of 24 images missing alt text', impact: 'high' },
        { id: 'missing-structured-data', severity: 'warning', message: 'No structured data (Schema.org) found', impact: 'medium' },
      ], passed: [
        { id: 'title', message: 'Title tag present and well-optimized' },
        { id: 'ssl', message: 'HTTPS/SSL enabled' },
      ]},
      performance: { issues: [
        { id: 'slow-load', severity: 'critical', message: 'Slow page load: 3.8s (target: <3s)', impact: 'high' },
        { id: 'unoptimized-images', severity: 'warning', message: '8 images may not be using WebP format', impact: 'medium' },
      ], passed: [
        { id: 'viewport', message: 'Mobile viewport tag present' },
      ]},
      conversion: { issues: [
        { id: 'missing-reviews', severity: 'critical', message: 'No customer reviews or testimonials detected', impact: 'high' },
        { id: 'missing-live-chat', severity: 'info', message: 'No live chat widget detected', impact: 'medium' },
      ], passed: [
        { id: 'cta', message: 'Clear CTAs present' },
        { id: 'email-capture', message: 'Email capture present' },
      ]},
      opportunities: [
        { type: 'SEO', priority: 'high', title: 'Critical SEO Issues Detected',
          description: 'Found 2 critical SEO problems costing organic traffic.',
          service: 'SEO Audit & Optimization', estimatedValue: '$1,500 - $3,000/month' },
        { type: 'Performance', priority: 'high', title: 'Performance Optimization Needed',
          description: 'Slow load time hurting conversions and rankings.',
          service: 'Performance Optimization', estimatedValue: '$800 - $2,000 one-time' },
      ],
    }),
  },
  {
    company_name: 'Gemstone Gallery UK',
    website: 'https://gemstone-gallery.co.uk',
    country: 'uk', platform: 'woocommerce', industry: 'jewelry',
    email: 'info@gemstonegallery.co.uk', phone: '+44-20-7946-0958',
    linkedin_url: 'https://linkedin.com/company/gemstone-gallery',
    facebook_url: 'https://facebook.com/gemstonegallery',
    store_age_estimate: '3-5 years',
    technology_stack: 'WordPress, WooCommerce, Yoast SEO, WP Rocket',
    theme: 'Flatsome', score: 65, status: 'new',
  },
  {
    company_name: 'Schönheit Online',
    website: 'https://schoenheit-online.de',
    country: 'germany', platform: 'shopify', industry: 'beauty',
    email: 'kontakt@schoenheit-online.de', phone: '+49-30-12345678',
    instagram_url: 'https://instagram.com/schoenheitonline',
    store_age_estimate: '1-2 years',
    technology_stack: 'Shopify, Google Analytics',
    theme: 'Debut', score: 82, status: 'new',
  },
  {
    company_name: 'VitaLife Australia',
    website: 'https://vitalife.com.au',
    country: 'australia', platform: 'wordpress', industry: 'health',
    email: 'hello@vitalife.com.au', phone: '+61-2-9876-5432',
    instagram_url: 'https://instagram.com/vitalife_au',
    store_age_estimate: '2-3 years',
    technology_stack: 'WordPress, WooCommerce, Mailchimp',
    theme: 'Divi', score: 55, status: 'contacted',
  },
  {
    company_name: 'SportZone Canada',
    website: 'https://sportzone.ca',
    country: 'canada', platform: 'shopify', industry: 'sports',
    email: 'info@sportzone.ca', phone: '+1-416-555-9876',
    linkedin_url: 'https://linkedin.com/company/sportzone-ca',
    facebook_url: 'https://facebook.com/sportzonecanada',
    instagram_url: 'https://instagram.com/sportzonecanada',
    store_age_estimate: '5+ years',
    technology_stack: 'Shopify, Google Analytics, Klaviyo',
    theme: 'Impulse', score: 71, status: 'new',
  },
  {
    company_name: 'TechMart Electronics',
    website: 'https://techmart-electronics.com',
    country: 'usa', platform: 'woocommerce', industry: 'electronics',
    email: 'support@techmart-electronics.com', phone: '+1-800-555-0199',
    linkedin_url: 'https://linkedin.com/company/techmart-electronics',
    store_age_estimate: '3-5 years',
    technology_stack: 'WordPress, WooCommerce, WP Rocket, Google Analytics',
    theme: 'Electro', score: 88, status: 'new',
  },
  {
    company_name: 'British Home Styles',
    website: 'https://britishhomestyles.co.uk',
    country: 'uk', platform: 'shopify', industry: 'home-decor',
    email: 'hello@britishhomestyles.co.uk', phone: '+44-121-456-7890',
    facebook_url: 'https://facebook.com/britishhomestyles',
    instagram_url: 'https://instagram.com/britishhomestyles',
    store_age_estimate: '1-2 years',
    technology_stack: 'Shopify, Instagram Shopping',
    theme: 'Brooklyn', score: 60, status: 'new',
  },
  {
    company_name: 'Möbel Meister GmbH',
    website: 'https://moebel-meister.de',
    country: 'germany', platform: 'wordpress', industry: 'furniture',
    email: 'info@moebel-meister.de', phone: '+49-89-87654321',
    linkedin_url: 'https://linkedin.com/company/mobel-meister',
    store_age_estimate: '5+ years',
    technology_stack: 'WordPress, WooCommerce',
    theme: 'Woodmart', score: 45, status: 'new',
  },
  {
    company_name: 'Aussie Grub Box',
    website: 'https://aussiegrubbox.com.au',
    country: 'australia', platform: 'shopify', industry: 'food',
    email: 'orders@aussiegrubbox.com.au',
    instagram_url: 'https://instagram.com/aussiegrubbox',
    facebook_url: 'https://facebook.com/aussiegrubbox',
    store_age_estimate: '< 1 year',
    technology_stack: 'Shopify, Facebook Pixel',
    theme: 'Narrative', score: 91, status: 'new',
  },
  {
    company_name: 'AutoParts Direct CA',
    website: 'https://autopartsdirect.ca',
    country: 'canada', platform: 'woocommerce', industry: 'automotive',
    email: 'sales@autopartsdirect.ca', phone: '+1-604-555-3344',
    linkedin_url: 'https://linkedin.com/company/autoparts-direct-ca',
    store_age_estimate: '3-5 years',
    technology_stack: 'WordPress, WooCommerce, Google Analytics, Google Ads',
    theme: 'Flatsome', score: 67, status: 'new',
  },
  {
    company_name: 'LuxeJewels NYC',
    website: 'https://luxejewelsnyc.com',
    country: 'usa', platform: 'shopify', industry: 'jewelry',
    email: 'hello@luxejewelsnyc.com', phone: '+1-212-555-7788',
    instagram_url: 'https://instagram.com/luxejewelsnyc',
    linkedin_url: 'https://linkedin.com/company/luxejewels',
    store_age_estimate: '2-3 years',
    technology_stack: 'Shopify, Klaviyo, Google Analytics, Facebook Pixel',
    theme: 'Prestige', score: 74, status: 'qualified',
  },
  {
    company_name: 'Berlin Beauty Box',
    website: 'https://berlin-beauty-box.de',
    country: 'germany', platform: 'shopify', industry: 'beauty',
    email: 'hallo@berlin-beauty-box.de',
    instagram_url: 'https://instagram.com/berlinbeautybox',
    store_age_estimate: '< 1 year',
    technology_stack: 'Shopify, Instagram Shopping, Facebook Pixel',
    theme: 'Minimal', score: 85, status: 'new',
  },
];

async function seed() {
  try {
    await initDb();
    const db = getDb();

    console.log('🌱 Seeding database with demo leads...');

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO leads (
        id, company_name, website, country, platform, industry,
        email, phone, linkedin_url, facebook_url, instagram_url,
        store_age_estimate, technology_stack, theme,
        score, status, tags, audit_data,
        score_breakdown, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, '[]', ?,
        '[]', CURRENT_TIMESTAMP
      )
    `);

    let inserted = 0;
    for (const lead of DEMO_LEADS) {
      const id = uuidv4();
      const result = stmt.run(
        id, lead.company_name, lead.website, lead.country, lead.platform, lead.industry,
        lead.email || null, lead.phone || null,
        lead.linkedin_url || null, lead.facebook_url || null, lead.instagram_url || null,
        lead.store_age_estimate || null, lead.technology_stack || null, lead.theme || null,
        lead.score, lead.status || 'new',
        lead.audit_data || null,
      );
      if (result.changes > 0) inserted++;
    }

    console.log(`✅ Seeded ${inserted} leads (${DEMO_LEADS.length - inserted} already existed)`);

    // Show counts
    const total = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
    console.log(`📊 Total leads in database: ${total}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
