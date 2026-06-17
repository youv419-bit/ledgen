const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const SHOPIFY_SIGNALS = [
  'cdn.shopify.com',
  'shopify.com/s/files',
  'Shopify.theme',
  'window.Shopify',
  'myshopify.com',
  '/cdn/shop/',
  'shopify-section',
  'data-shopify',
  '__st',
  'Shopify.shop',
];

const WORDPRESS_SIGNALS = [
  'wp-content',
  'wp-includes',
  'wp-json',
  'WordPress',
  '/wp-login.php',
  'generator.*WordPress',
  'wp-emoji',
];

const WOOCOMMERCE_SIGNALS = [
  'woocommerce',
  'wc-',
  'add-to-cart',
  'woocommerce-',
  'WooCommerce',
];

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; CommerceleadBot/1.0; +https://commercelead.app/bot)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
};

async function detectPlatform(url) {
  try {
    // Normalize URL
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const response = await axios.get(normalizedUrl, {
      headers: COMMON_HEADERS,
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    });

    const html = response.data;
    const headers = response.headers;
    const $ = cheerio.load(html);

    const result = {
      platform: 'unknown',
      isShopify: false,
      isWordPress: false,
      isWooCommerce: false,
      theme: null,
      plugins: [],
      shopifyData: {},
      wordpressData: {},
      finalUrl: response.request?.res?.responseUrl || normalizedUrl,
    };

    // Check Shopify
    const shopifyScore = SHOPIFY_SIGNALS.filter(signal => 
      html.includes(signal)
    ).length;

    // Check X-Powered-By or Shopify headers
    if (headers['x-shopify-shop-id'] || headers['x-shopify-stage']) {
      result.isShopify = true;
    }

    if (shopifyScore >= 2) {
      result.isShopify = true;
    }

    // Check WordPress
    const wpScore = WORDPRESS_SIGNALS.filter(signal => 
      html.includes(signal)
    ).length;

    const generatorMeta = $('meta[name="generator"]').attr('content') || '';
    if (generatorMeta.toLowerCase().includes('wordpress')) {
      result.isWordPress = true;
    }

    if (headers['x-powered-by']?.toLowerCase().includes('wordpress')) {
      result.isWordPress = true;
    }

    if (wpScore >= 2) {
      result.isWordPress = true;
    }

    // Check WooCommerce
    const wcScore = WOOCOMMERCE_SIGNALS.filter(signal =>
      html.includes(signal)
    ).length;
    if (wcScore >= 2 && result.isWordPress) {
      result.isWooCommerce = true;
    }

    // Set platform
    if (result.isShopify) {
      result.platform = 'shopify';
      result.shopifyData = extractShopifyData($, html);
    } else if (result.isWordPress) {
      result.platform = result.isWooCommerce ? 'woocommerce' : 'wordpress';
      result.wordpressData = extractWordPressData($, html, headers);
    }

    // Extract theme
    result.theme = extractTheme($, html, result.platform);

    // Extract plugins (WordPress)
    if (result.isWordPress) {
      result.plugins = extractWordPressPlugins(html);
    }

    return result;
  } catch (err) {
    return { 
      platform: 'unknown', 
      isShopify: false, 
      isWordPress: false,
      isWooCommerce: false,
      error: err.message 
    };
  }
}

function extractShopifyData($, html) {
  const data = {};

  // Try to get shop name from Shopify object
  const shopifyMatch = html.match(/Shopify\.shop\s*=\s*["']([^"']+)["']/);
  if (shopifyMatch) data.shopDomain = shopifyMatch[1];

  // Theme
  const themeMatch = html.match(/Shopify\.theme\s*=\s*\{[^}]*name:\s*["']([^"']+)["']/);
  if (themeMatch) data.themeName = themeMatch[1];

  // Currency
  const currencyMatch = html.match(/Shopify\.currency\s*=\s*\{[^}]*active:\s*["']([^"']+)["']/);
  if (currencyMatch) data.currency = currencyMatch[1];

  return data;
}

function extractWordPressData($, html, headers) {
  const data = {};

  // WordPress version
  const versionMatch = html.match(/WordPress\s+([\d.]+)/);
  if (versionMatch) data.version = versionMatch[1];

  const generatorContent = $('meta[name="generator"]').attr('content') || '';
  const versionFromMeta = generatorContent.match(/WordPress\s+([\d.]+)/);
  if (versionFromMeta) data.version = versionFromMeta[1];

  return data;
}

function extractTheme($, html, platform) {
  if (platform === 'shopify') {
    // Shopify theme from CDN URL pattern
    const themeMatch = html.match(/cdn\.shopify\.com\/s\/files\/[^/]+\/[^/]+\/assets\/([^/?"]+)/);
    if (themeMatch) return themeMatch[1];

    const shopifyTheme = html.match(/Shopify\.theme\s*=\s*\{[^}]*name:\s*["']([^"']+)["']/);
    if (shopifyTheme) return shopifyTheme[1];
  }

  if (platform === 'wordpress' || platform === 'woocommerce') {
    // WP theme from stylesheet link
    const themeMatch = html.match(/wp-content\/themes\/([^/]+)\//);
    if (themeMatch) return themeMatch[1];
  }

  return null;
}

function extractWordPressPlugins(html) {
  const plugins = new Set();
  const pluginMatches = html.matchAll(/wp-content\/plugins\/([^/]+)\//g);
  for (const match of pluginMatches) {
    plugins.add(match[1]);
  }
  return Array.from(plugins).slice(0, 20); // Max 20 plugins
}

async function extractContactInfo($, html, baseUrl) {
  const info = {
    email: null,
    phone: null,
    contactPageUrl: null,
    aboutPageUrl: null,
    linkedinUrl: null,
    facebookUrl: null,
    instagramUrl: null,
  };

  // Extract emails (public only - from visible text, not obfuscated)
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatches = html.match(emailRegex) || [];
  const validEmails = emailMatches.filter(email => 
    !email.includes('example.com') && 
    !email.includes('yourdomain') &&
    !email.includes('email@') &&
    email.length < 100
  );
  if (validEmails.length > 0) {
    info.email = validEmails[0];
  }

  // Extract phone
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phoneMatches = html.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    info.phone = phoneMatches[0].trim();
  }

  // Find contact and about pages
  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().toLowerCase();
    
    const fullUrl = href.startsWith('http') ? href : 
                    href.startsWith('/') ? `${baseUrl}${href}` : null;

    if (!fullUrl) return;

    if ((text.includes('contact') || href.includes('contact')) && !info.contactPageUrl) {
      info.contactPageUrl = fullUrl;
    }
    if ((text.includes('about') || href.includes('about')) && !info.aboutPageUrl) {
      info.aboutPageUrl = fullUrl;
    }
    if ((href.includes('linkedin.com') || text.includes('linkedin')) && !info.linkedinUrl) {
      info.linkedinUrl = fullUrl;
    }
    if ((href.includes('facebook.com') || href.includes('fb.com')) && !info.facebookUrl) {
      info.facebookUrl = fullUrl;
    }
    if ((href.includes('instagram.com') || text.includes('instagram')) && !info.instagramUrl) {
      info.instagramUrl = fullUrl;
    }
  });

  return info;
}

async function extractCompanyName($, html, url) {
  // Try OG title
  const ogTitle = $('meta[property="og:title"]').attr('content');
  if (ogTitle) return ogTitle.split(/[-|]/)[0].trim();

  // Try page title
  const title = $('title').text();
  if (title) return title.split(/[-|–]/)[0].trim();

  // Try h1
  const h1 = $('h1').first().text();
  if (h1) return h1.trim();

  // Fallback to domain
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return domain.replace('www.', '').split('.')[0];
  } catch {
    return url;
  }
}

async function analyzeWebsite(url) {
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const response = await axios.get(normalizedUrl, {
      headers: COMMON_HEADERS,
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const [platformInfo, contactInfo] = await Promise.all([
      detectPlatform(url),
      Promise.resolve(extractContactInfo($, html, normalizedUrl)),
    ]);

    const companyName = await extractCompanyName($, html, url);
    const contact = await contactInfo;

    return {
      companyName,
      platform: platformInfo.platform,
      isShopify: platformInfo.isShopify,
      isWordPress: platformInfo.isWordPress,
      isWooCommerce: platformInfo.isWooCommerce,
      theme: platformInfo.theme,
      plugins: platformInfo.plugins || [],
      ...contact,
      finalUrl: platformInfo.finalUrl || normalizedUrl,
      technologyStack: buildTechStack(platformInfo, html),
    };
  } catch (err) {
    throw new Error(`Failed to analyze website: ${err.message}`);
  }
}

function buildTechStack(platformInfo, html) {
  const stack = [];
  
  if (platformInfo.isShopify) stack.push('Shopify');
  if (platformInfo.isWordPress) stack.push('WordPress');
  if (platformInfo.isWooCommerce) stack.push('WooCommerce');
  if (platformInfo.theme) stack.push(`Theme: ${platformInfo.theme}`);

  // Common tech detection
  if (html.includes('google-analytics.com') || html.includes('gtag(')) stack.push('Google Analytics');
  if (html.includes('googletagmanager.com')) stack.push('Google Tag Manager');
  if (html.includes('facebook.com/tr') || html.includes('fbevents.js')) stack.push('Facebook Pixel');
  if (html.includes('klaviyo')) stack.push('Klaviyo');
  if (html.includes('mailchimp')) stack.push('Mailchimp');
  if (html.includes('zendesk')) stack.push('Zendesk');
  if (html.includes('intercom')) stack.push('Intercom');
  if (html.includes('hotjar')) stack.push('Hotjar');
  if (html.includes('stripe.com')) stack.push('Stripe');
  if (html.includes('paypal.com')) stack.push('PayPal');

  return stack.join(', ');
}

module.exports = { detectPlatform, analyzeWebsite, extractContactInfo, COMMON_HEADERS };
