const axios = require('axios');
const cheerio = require('cheerio');
const { COMMON_HEADERS } = require('./detectionService');

async function auditWebsite(url) {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
  const startTime = Date.now();

  try {
    const response = await axios.get(normalizedUrl, {
      headers: COMMON_HEADERS,
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: (s) => s < 500,
    });

    const loadTime = Date.now() - startTime;
    const html = response.data;
    const $ = cheerio.load(html);
    const headers = response.headers;

    const seoAudit = runSEOAudit($, html, headers, normalizedUrl);
    const performanceAudit = runPerformanceAudit($, html, headers, loadTime);
    const conversionAudit = runConversionAudit($, html);

    const seoScore = calculateSectionScore(seoAudit.issues);
    const performanceScore = calculateSectionScore(performanceAudit.issues);
    const conversionScore = calculateSectionScore(conversionAudit.issues);

    const overallScore = calculateOverallScore(seoScore, performanceScore, conversionScore, seoAudit.issues, performanceAudit.issues, conversionAudit.issues);

    return {
      url: normalizedUrl,
      loadTime,
      seoScore,
      performanceScore,
      conversionScore,
      overallScore,
      seo: seoAudit,
      performance: performanceAudit,
      conversion: conversionAudit,
      opportunities: generateOpportunities(seoAudit, performanceAudit, conversionAudit),
      auditedAt: new Date().toISOString(),
    };
  } catch (err) {
    throw new Error(`Audit failed: ${err.message}`);
  }
}

function runSEOAudit($, html, headers, url) {
  const issues = [];
  const passed = [];

  // Title check
  const title = $('title').text().trim();
  if (!title) {
    issues.push({ id: 'missing-title', severity: 'critical', message: 'Missing page title tag', impact: 'high' });
  } else if (title.length < 30) {
    issues.push({ id: 'short-title', severity: 'warning', message: `Title too short (${title.length} chars, recommend 50-60)`, impact: 'medium' });
  } else if (title.length > 60) {
    issues.push({ id: 'long-title', severity: 'warning', message: `Title too long (${title.length} chars, recommend 50-60)`, impact: 'medium' });
  } else {
    passed.push({ id: 'title', message: 'Title tag present and well-optimized' });
  }

  // Meta description
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  if (!metaDesc) {
    issues.push({ id: 'missing-meta-desc', severity: 'critical', message: 'Missing meta description', impact: 'high' });
  } else if (metaDesc.length < 100) {
    issues.push({ id: 'short-meta-desc', severity: 'warning', message: `Meta description too short (${metaDesc.length} chars)`, impact: 'medium' });
  } else {
    passed.push({ id: 'meta-desc', message: 'Meta description present' });
  }

  // H1 check
  const h1Tags = $('h1');
  if (h1Tags.length === 0) {
    issues.push({ id: 'missing-h1', severity: 'critical', message: 'Missing H1 heading tag', impact: 'high' });
  } else if (h1Tags.length > 1) {
    issues.push({ id: 'multiple-h1', severity: 'warning', message: `Multiple H1 tags found (${h1Tags.length}), should have only one`, impact: 'medium' });
  } else {
    passed.push({ id: 'h1', message: 'Single H1 tag present' });
  }

  // Alt tags
  const images = $('img');
  const imagesWithoutAlt = images.filter((_, el) => !$(el).attr('alt')).length;
  const totalImages = images.length;
  if (imagesWithoutAlt > 0) {
    issues.push({ 
      id: 'missing-alt-tags', 
      severity: imagesWithoutAlt > 5 ? 'critical' : 'warning',
      message: `${imagesWithoutAlt} of ${totalImages} images missing alt text`, 
      impact: 'high' 
    });
  } else if (totalImages > 0) {
    passed.push({ id: 'alt-tags', message: 'All images have alt text' });
  }

  // Canonical URL
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    issues.push({ id: 'missing-canonical', severity: 'warning', message: 'Missing canonical URL tag', impact: 'medium' });
  } else {
    passed.push({ id: 'canonical', message: 'Canonical URL present' });
  }

  // Open Graph
  const ogTitle = $('meta[property="og:title"]').attr('content');
  if (!ogTitle) {
    issues.push({ id: 'missing-og', severity: 'info', message: 'Missing Open Graph meta tags for social sharing', impact: 'low' });
  } else {
    passed.push({ id: 'og-tags', message: 'Open Graph tags present' });
  }

  // Structured data
  const structuredData = $('script[type="application/ld+json"]').length;
  if (structuredData === 0) {
    issues.push({ id: 'missing-structured-data', severity: 'warning', message: 'No structured data (Schema.org) found', impact: 'medium' });
  } else {
    passed.push({ id: 'structured-data', message: `${structuredData} structured data blocks found` });
  }

  // SSL check
  if (!url.startsWith('https://')) {
    issues.push({ id: 'no-ssl', severity: 'critical', message: 'Site not using HTTPS/SSL', impact: 'high' });
  } else {
    passed.push({ id: 'ssl', message: 'HTTPS/SSL enabled' });
  }

  return { issues, passed };
}

function runPerformanceAudit($, html, headers, loadTime) {
  const issues = [];
  const passed = [];

  // Load time
  if (loadTime > 5000) {
    issues.push({ id: 'very-slow-load', severity: 'critical', message: `Very slow page load: ${(loadTime/1000).toFixed(1)}s (target: <3s)`, impact: 'high' });
  } else if (loadTime > 3000) {
    issues.push({ id: 'slow-load', severity: 'warning', message: `Slow page load: ${(loadTime/1000).toFixed(1)}s (target: <3s)`, impact: 'medium' });
  } else {
    passed.push({ id: 'load-time', message: `Good load time: ${(loadTime/1000).toFixed(1)}s` });
  }

  // Image optimization
  const images = $('img');
  let unoptimizedImages = 0;
  images.each((_, el) => {
    const src = $(el).attr('src') || '';
    if (src.match(/\.(jpg|jpeg|png|bmp)$/i) && !src.includes('webp')) {
      unoptimizedImages++;
    }
  });
  if (unoptimizedImages > 3) {
    issues.push({ id: 'unoptimized-images', severity: 'warning', message: `${unoptimizedImages} images may not be using WebP format`, impact: 'medium' });
  }

  // Lazy loading
  const imagesWithLazy = images.filter((_, el) => $(el).attr('loading') === 'lazy').length;
  if (images.length > 3 && imagesWithLazy === 0) {
    issues.push({ id: 'no-lazy-loading', severity: 'warning', message: 'No lazy loading on images', impact: 'medium' });
  } else if (images.length > 0) {
    passed.push({ id: 'lazy-loading', message: 'Lazy loading implemented' });
  }

  // Viewport meta
  const viewport = $('meta[name="viewport"]').attr('content');
  if (!viewport) {
    issues.push({ id: 'missing-viewport', severity: 'critical', message: 'Missing viewport meta tag (not mobile-friendly)', impact: 'high' });
  } else {
    passed.push({ id: 'viewport', message: 'Mobile viewport tag present' });
  }

  // Resource hints
  const preconnect = $('link[rel="preconnect"]').length;
  if (preconnect === 0) {
    issues.push({ id: 'no-preconnect', severity: 'info', message: 'No preconnect hints for external resources', impact: 'low' });
  }

  // Compression
  const contentEncoding = headers['content-encoding'];
  if (!contentEncoding || (!contentEncoding.includes('gzip') && !contentEncoding.includes('br'))) {
    issues.push({ id: 'no-compression', severity: 'warning', message: 'Response compression (gzip/brotli) not detected', impact: 'medium' });
  } else {
    passed.push({ id: 'compression', message: `Content compression enabled (${contentEncoding})` });
  }

  // Render-blocking resources
  const renderBlocking = $('script:not([async]):not([defer])').length;
  if (renderBlocking > 3) {
    issues.push({ id: 'render-blocking', severity: 'warning', message: `${renderBlocking} render-blocking scripts detected`, impact: 'medium' });
  }

  // CSS in head
  const stylesheets = $('link[rel="stylesheet"]').length;
  if (stylesheets > 8) {
    issues.push({ id: 'too-many-stylesheets', severity: 'info', message: `${stylesheets} stylesheets loaded (consider bundling)`, impact: 'low' });
  }

  return { issues, passed };
}

function runConversionAudit($, html) {
  const issues = [];
  const passed = [];

  // Trust badges / security seals
  const trustSignals = [
    'ssl', 'secure', 'trust', 'guarantee', 'verified', 'norton', 'mcafee', 'ssl-seal', 'money-back'
  ];
  const hasTrustBadges = trustSignals.some(signal => 
    html.toLowerCase().includes(signal)
  );
  if (!hasTrustBadges) {
    issues.push({ id: 'missing-trust-badges', severity: 'warning', message: 'No trust badges or security seals detected', impact: 'high' });
  } else {
    passed.push({ id: 'trust-badges', message: 'Trust/security indicators present' });
  }

  // Reviews / testimonials
  const reviewSignals = ['review', 'testimonial', 'stars', 'rating', 'customer', 'yotpo', 'judge.me', 'loox', 'trustpilot'];
  const hasReviews = reviewSignals.some(signal => html.toLowerCase().includes(signal));
  if (!hasReviews) {
    issues.push({ id: 'missing-reviews', severity: 'critical', message: 'No customer reviews or testimonials detected', impact: 'high' });
  } else {
    passed.push({ id: 'reviews', message: 'Customer reviews/testimonials present' });
  }

  // Email capture / newsletter
  const emailCaptureSignals = ['newsletter', 'subscribe', 'email', 'popup', 'klaviyo', 'mailchimp', 'enter your email'];
  const hasEmailCapture = emailCaptureSignals.some(signal => html.toLowerCase().includes(signal));
  if (!hasEmailCapture) {
    issues.push({ id: 'missing-email-capture', severity: 'warning', message: 'No email capture / newsletter signup detected', impact: 'high' });
  } else {
    passed.push({ id: 'email-capture', message: 'Email capture present' });
  }

  // Live chat
  const chatSignals = ['livechat', 'live-chat', 'intercom', 'zendesk', 'tidio', 'crisp', 'tawk', 'freshchat', 'drift'];
  const hasChat = chatSignals.some(signal => html.toLowerCase().includes(signal));
  if (!hasChat) {
    issues.push({ id: 'missing-live-chat', severity: 'info', message: 'No live chat widget detected', impact: 'medium' });
  } else {
    passed.push({ id: 'live-chat', message: 'Live chat present' });
  }

  // Clear CTA
  const ctaSignals = ['add to cart', 'buy now', 'shop now', 'get started', 'order now', 'checkout'];
  const hasCTA = ctaSignals.some(signal => html.toLowerCase().includes(signal));
  if (!hasCTA) {
    issues.push({ id: 'weak-cta', severity: 'warning', message: 'No clear call-to-action buttons detected', impact: 'high' });
  } else {
    passed.push({ id: 'cta', message: 'Clear CTAs present' });
  }

  // FAQ section
  const hasFAQ = html.toLowerCase().includes('faq') || html.toLowerCase().includes('frequently asked');
  if (!hasFAQ) {
    issues.push({ id: 'missing-faq', severity: 'info', message: 'No FAQ section found (helps reduce cart abandonment)', impact: 'low' });
  }

  // Return/refund policy
  const hasPolicy = html.toLowerCase().includes('return') || html.toLowerCase().includes('refund');
  if (!hasPolicy) {
    issues.push({ id: 'missing-policy', severity: 'warning', message: 'No return/refund policy visible', impact: 'medium' });
  } else {
    passed.push({ id: 'policy', message: 'Return/refund policy present' });
  }

  // Social proof numbers
  const hasSocialProof = html.match(/\d+[k+]?\s*(customer|order|sale|review|product)/i);
  if (!hasSocialProof) {
    issues.push({ id: 'missing-social-proof', severity: 'info', message: 'No social proof numbers (customers served, orders, etc.)', impact: 'low' });
  }

  return { issues, passed };
}

function calculateSectionScore(issues) {
  let score = 100;
  issues.forEach(issue => {
    if (issue.severity === 'critical') score -= 20;
    else if (issue.severity === 'warning') score -= 10;
    else if (issue.severity === 'info') score -= 3;
  });
  return Math.max(0, Math.min(100, score));
}

function calculateOverallScore(seoScore, perfScore, convScore, seoIssues, perfIssues, convIssues) {
  // Weighted average: SEO 35%, Performance 35%, Conversion 30%
  const weighted = (seoScore * 0.35) + (perfScore * 0.35) + (convScore * 0.30);
  
  // Lead opportunity score: INVERSE of quality (worse site = better lead)
  // We want leads who NEED our services
  const leadScore = Math.round(100 - weighted);
  return Math.max(1, Math.min(100, leadScore));
}

function generateOpportunities(seoAudit, performanceAudit, conversionAudit) {
  const opportunities = [];

  const criticalSEO = seoAudit.issues.filter(i => i.severity === 'critical').length;
  const criticalPerf = performanceAudit.issues.filter(i => i.severity === 'critical').length;
  const criticalConv = conversionAudit.issues.filter(i => i.severity === 'critical').length;

  if (criticalSEO >= 2) {
    opportunities.push({
      type: 'SEO',
      priority: 'high',
      title: 'Critical SEO Issues Detected',
      description: `Found ${criticalSEO} critical SEO problems that are likely costing this business significant organic traffic and rankings.`,
      service: 'SEO Audit & Optimization',
      estimatedValue: '$1,500 - $5,000/month'
    });
  }

  if (criticalPerf >= 1) {
    opportunities.push({
      type: 'Performance',
      priority: 'high',
      title: 'Performance Optimization Needed',
      description: 'Slow loading speeds are hurting conversions and search rankings. Speed optimization could significantly boost revenue.',
      service: 'Performance Optimization',
      estimatedValue: '$800 - $3,000 one-time'
    });
  }

  if (criticalConv >= 2) {
    opportunities.push({
      type: 'CRO',
      priority: 'high',
      title: 'Conversion Rate Issues',
      description: `Missing ${criticalConv} key conversion elements. Even a 1% increase in conversion rate could add thousands in monthly revenue.`,
      service: 'CRO & UX Optimization',
      estimatedValue: '$1,000 - $4,000/month'
    });
  }

  if (seoAudit.issues.length > 5) {
    opportunities.push({
      type: 'Maintenance',
      priority: 'medium',
      title: 'Ongoing SEO Maintenance',
      description: 'Multiple ongoing SEO issues suggest lack of regular maintenance. Monthly retainer would keep the site optimized.',
      service: 'SEO Maintenance Package',
      estimatedValue: '$500 - $2,000/month retainer'
    });
  }

  return opportunities;
}

module.exports = { auditWebsite };
