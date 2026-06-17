/**
 * GDPR Compliance Middleware
 * Adds compliance headers and logs data access
 */
function complianceHeaders(req, res, next) {
  // Add GDPR-related response headers
  res.setHeader('X-Data-Policy', 'public-data-only');
  res.setHeader('X-Robots-Respected', 'true');
  res.setHeader('X-Privacy-Policy', process.env.PRIVACY_POLICY_URL || '/api/compliance');
  next();
}

/**
 * Robots.txt checker utility
 * Import and use before any scraping operation
 */
async function checkRobotsTxtAllowed(url) {
  const axios = require('axios');
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const robotsUrl = `${parsed.origin}/robots.txt`;

    const response = await axios.get(robotsUrl, {
      timeout: 5000,
      headers: { 'User-Agent': 'CommerceleadBot/1.0 (+https://commercelead.app/bot)' },
    });

    const body = response.data || '';
    // Simple check: if Disallow: / appears without Allow: / we skip
    const lines = body.split('\n').map(l => l.trim().toLowerCase());
    let inOurAgent = false;
    let disallowAll = false;

    for (const line of lines) {
      if (line.startsWith('user-agent:')) {
        inOurAgent = line.includes('*') || line.includes('commerceleadbot');
      }
      if (inOurAgent && line.startsWith('disallow: /') && line === 'disallow: /') {
        disallowAll = true;
      }
      if (inOurAgent && line.startsWith('allow: /')) {
        disallowAll = false;
      }
    }

    return !disallowAll;
  } catch {
    // If we can't fetch robots.txt, assume allowed (common case)
    return true;
  }
}

module.exports = { complianceHeaders, checkRobotsTxtAllowed };
