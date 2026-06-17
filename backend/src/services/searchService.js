const axios = require('axios');
const { COMMON_HEADERS } = require('./detectionService');

// Sample seed URLs for each industry and country combination
// In production, integrate SerpAPI, ScraperAPI, or similar
const SEED_DOMAINS_BY_INDUSTRY = {
  fashion: ['zara.com', 'h&m.com', 'asos.com', 'fashionnova.com', 'prettylittlething.com'],
  jewelry: ['pandora.net', 'kay.com', 'zales.com', 'tiffany.com', 'jared.com'],
  beauty: ['sephora.com', 'ulta.com', 'glossier.com', 'fenty.com', 'morphe.com'],
  health: ['gnc.com', 'vitacost.com', 'iherb.com', 'swansonvitamins.com'],
  electronics: ['bestbuy.com', 'newegg.com', 'bhphotovideo.com', 'adorama.com'],
  'home-decor': ['wayfair.com', 'potterybarn.com', 'cb2.com', 'zgallerie.com'],
  furniture: ['ikea.com', 'ashleyfurniture.com', 'westelm.com', 'article.com'],
  food: ['goldbelly.com', 'thrive.com', 'mouth.com', 'nuts.com'],
  sports: ['nike.com', 'adidas.com', 'underarmour.com', 'dickssportinggoods.com'],
  automotive: ['autozone.com', 'rockauto.com', 'carid.com', 'summitracing.com'],
};

const COUNTRY_TLD_MAP = {
  'usa': ['.com', '.us'],
  'uk': ['.co.uk', '.uk'],
  'germany': ['.de'],
  'australia': ['.com.au', '.au'],
  'canada': ['.ca'],
};

const COUNTRY_SEARCH_TERMS = {
  'usa': 'site:.com',
  'uk': 'site:.co.uk OR site:.uk',
  'germany': 'site:.de',
  'australia': 'site:.com.au',
  'canada': 'site:.ca',
};

// Demo leads for demonstration (replace with real scraping in production)
const DEMO_LEADS = [
  {
    website: 'https://demo-fashion-store.myshopify.com',
    company_name: 'TrendStyle Co.',
    country: 'usa',
    platform: 'shopify',
    industry: 'fashion',
    email: 'hello@trendstyle.com',
    phone: '+1-555-0100',
    score: 78,
    linkedinUrl: 'https://linkedin.com/company/trendstyle',
    facebookUrl: 'https://facebook.com/trendstyle',
    instagramUrl: 'https://instagram.com/trendstyle',
    technologyStack: 'Shopify, Google Analytics, Klaviyo, Facebook Pixel',
    theme: 'Dawn',
  },
  {
    website: 'https://example-jewelry.com',
    company_name: 'Gemstone Gallery',
    country: 'uk',
    platform: 'woocommerce',
    industry: 'jewelry',
    email: 'info@gemstonegallery.co.uk',
    phone: '+44-20-7946-0958',
    score: 65,
    linkedinUrl: 'https://linkedin.com/company/gemstone-gallery',
    facebookUrl: 'https://facebook.com/gemstonegallery',
    instagramUrl: null,
    technologyStack: 'WordPress, WooCommerce, Yoast SEO',
    theme: 'Flatsome',
  },
  {
    website: 'https://beauty-store-demo.de',
    company_name: 'Schönheit Shop',
    country: 'germany',
    platform: 'shopify',
    industry: 'beauty',
    email: 'kontakt@schoenheit-shop.de',
    phone: '+49-30-12345678',
    score: 82,
    linkedinUrl: null,
    facebookUrl: 'https://facebook.com/schoenheitshop',
    instagramUrl: 'https://instagram.com/schoenheitshop',
    technologyStack: 'Shopify, Google Analytics',
    theme: 'Debut',
  },
  {
    website: 'https://health-store.com.au',
    company_name: 'VitaLife Australia',
    country: 'australia',
    platform: 'wordpress',
    industry: 'health',
    email: 'hello@vitalife.com.au',
    phone: '+61-2-9876-5432',
    score: 55,
    linkedinUrl: 'https://linkedin.com/company/vitalife-australia',
    facebookUrl: null,
    instagramUrl: 'https://instagram.com/vitalife_au',
    technologyStack: 'WordPress, WooCommerce, Mailchimp',
    theme: 'Divi',
  },
  {
    website: 'https://sports-ca-demo.ca',
    company_name: 'SportZone Canada',
    country: 'canada',
    platform: 'shopify',
    industry: 'sports',
    email: 'info@sportzone.ca',
    phone: '+1-416-555-9876',
    score: 71,
    linkedinUrl: 'https://linkedin.com/company/sportzone-ca',
    facebookUrl: 'https://facebook.com/sportzonecanada',
    instagramUrl: 'https://instagram.com/sportzonecanada',
    technologyStack: 'Shopify, Google Analytics, Klaviyo',
    theme: 'Impulse',
  },
  {
    website: 'https://electronics-usa-demo.com',
    company_name: 'TechMart USA',
    country: 'usa',
    platform: 'woocommerce',
    industry: 'electronics',
    email: 'support@techmart.com',
    phone: '+1-800-555-0199',
    score: 88,
    linkedinUrl: 'https://linkedin.com/company/techmart-usa',
    facebookUrl: 'https://facebook.com/techmartusa',
    instagramUrl: null,
    technologyStack: 'WordPress, WooCommerce, WP Rocket',
    theme: 'Electro',
  },
  {
    website: 'https://home-decor-uk.co.uk',
    company_name: 'British Home Styles',
    country: 'uk',
    platform: 'shopify',
    industry: 'home-decor',
    email: 'hello@britishhomestyles.co.uk',
    phone: '+44-121-456-7890',
    score: 60,
    linkedinUrl: null,
    facebookUrl: 'https://facebook.com/britishhomestyles',
    instagramUrl: 'https://instagram.com/britishhomestyles',
    technologyStack: 'Shopify, Instagram Shopping',
    theme: 'Brooklyn',
  },
  {
    website: 'https://furniture-de-demo.de',
    company_name: 'Möbel Meister',
    country: 'germany',
    platform: 'wordpress',
    industry: 'furniture',
    email: 'info@moebel-meister.de',
    phone: '+49-89-87654321',
    score: 45,
    linkedinUrl: 'https://linkedin.com/company/mobel-meister',
    facebookUrl: 'https://facebook.com/mobelmeister',
    instagramUrl: null,
    technologyStack: 'WordPress, WooCommerce',
    theme: 'Woodmart',
  },
];

async function searchLeads(params) {
  const { country, industry, platform, limit = 20 } = params;

  // Filter demo leads based on search params
  let results = [...DEMO_LEADS];

  if (country && country !== 'all') {
    results = results.filter(l => l.country === country);
  }

  if (industry && industry !== 'all') {
    results = results.filter(l => l.industry === industry);
  }

  if (platform && platform !== 'all') {
    results = results.filter(l => 
      platform === 'shopify' ? l.platform === 'shopify' :
      platform === 'wordpress' ? (l.platform === 'wordpress' || l.platform === 'woocommerce') :
      l.platform === platform
    );
  }

  // Add timestamp
  results = results.map(lead => ({
    ...lead,
    discoveredAt: new Date().toISOString(),
    storeAgeEstimate: generateStoreAge(),
  }));

  return results.slice(0, limit);
}

function generateStoreAge() {
  const ages = ['< 1 year', '1-2 years', '2-3 years', '3-5 years', '5+ years'];
  return ages[Math.floor(Math.random() * ages.length)];
}

async function checkRobotsTxt(url) {
  try {
    const baseUrl = new URL(url.startsWith('http') ? url : `https://${url}`).origin;
    const robotsUrl = `${baseUrl}/robots.txt`;
    
    const response = await axios.get(robotsUrl, {
      timeout: 5000,
      headers: COMMON_HEADERS,
    });

    return {
      exists: true,
      content: response.data,
      allowed: !response.data.includes('Disallow: /') || response.data.includes('Allow: /'),
    };
  } catch {
    return { exists: false, allowed: true };
  }
}

module.exports = { searchLeads, checkRobotsTxt, DEMO_LEADS };
