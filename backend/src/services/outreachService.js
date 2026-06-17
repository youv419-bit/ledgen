/**
 * AI-powered outreach email generator
 * Generates personalized cold emails, LinkedIn messages, and follow-ups
 * based on audit data
 */

function generateOutreach(lead, auditData, type = 'cold_email') {
  const companyName = lead.company_name || extractDomain(lead.website);
  const platform = lead.platform;
  const topIssues = getTopIssues(auditData);
  const opportunities = auditData?.opportunities || [];

  switch (type) {
    case 'cold_email':
      return generateColdEmail(companyName, lead.website, platform, topIssues, opportunities);
    case 'linkedin':
      return generateLinkedInMessage(companyName, platform, topIssues);
    case 'followup':
      return generateFollowUp(companyName, lead.website, platform);
    default:
      return generateColdEmail(companyName, lead.website, platform, topIssues, opportunities);
  }
}

function generateColdEmail(companyName, website, platform, issues, opportunities) {
  const platformName = getPlatformDisplayName(platform);
  const topIssue = issues[0];
  const secondIssue = issues[1];

  const subject = generateSubjectLine(companyName, topIssue, platform);
  
  const body = `Hi ${companyName} Team,

I was browsing ${website} earlier and noticed your ${platformName} store${topIssue ? ` has ${topIssue.message.toLowerCase()}` : ''}.

${secondIssue ? `I also noticed ${secondIssue.message.toLowerCase()}, which is likely costing you organic traffic and conversions.` : ''}

As a ${platformName} specialist, I've helped ${getIndustryExample(platform)} similar to yours:
- Increase organic traffic by 40-120% through technical SEO fixes
- Improve conversion rates by 15-35% through UX optimization
- Reduce page load times by 60-80% for better Core Web Vitals scores

${opportunities.length > 0 ? `Based on a quick analysis of your site, I can see ${opportunities.length} specific opportunities worth exploring.` : ''}

Would you be open to a free 15-minute call this week? I'd love to share exactly what I found and how we could help.

Best regards,
[Your Name]
[Your Company]
[Your Phone]

P.S. I can send you a full audit report for ${website} — no cost, no obligation.`;

  return { subject, body, type: 'cold_email' };
}

function generateLinkedInMessage(companyName, platform, issues) {
  const platformName = getPlatformDisplayName(platform);
  const topIssue = issues[0];

  const body = `Hi [First Name],

I came across ${companyName}'s ${platformName} store and noticed ${topIssue ? topIssue.message.toLowerCase() : 'a few opportunities for improvement'}.

I specialize in ${platformName} optimization and have helped similar businesses grow their revenue through SEO, performance, and conversion improvements.

Would you be open to a quick chat about what I found? Happy to share a free audit with zero obligation.

Best,
[Your Name]`;

  return { subject: null, body, type: 'linkedin' };
}

function generateFollowUp(companyName, website, platform) {
  const platformName = getPlatformDisplayName(platform);

  const subject = `Following up — ${companyName} ${platformName} audit`;

  const body = `Hi [First Name],

I reached out a few days ago about ${website} and wanted to follow up.

I know inboxes get busy, so I'll be brief: I ran a quick audit of your ${platformName} store and found several opportunities that, if addressed, could meaningfully impact your organic rankings and conversion rates.

I've put together a brief report with the top 3 findings — would it be worth 10 minutes to review it together?

If now isn't the right time, just let me know and I'll follow up in a few months.

Best,
[Your Name]
[Your Company]`;

  return { subject, body, type: 'followup' };
}

function generateSubjectLine(companyName, topIssue, platform) {
  const platformName = getPlatformDisplayName(platform);
  
  const subjects = [
    `Quick question about ${companyName}'s ${platformName} store`,
    `I found ${topIssue ? 'a critical SEO issue' : 'some opportunities'} on ${companyName}'s website`,
    `${companyName}: Free ${platformName} audit findings`,
    `Noticed something on ${companyName}'s site — worth a 5-min chat?`,
    `Your ${platformName} store is losing organic traffic (here's why)`,
  ];

  // Rotate based on company name hash for variety
  const hash = companyName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return subjects[hash % subjects.length];
}

function getTopIssues(auditData) {
  if (!auditData) return [];
  
  const allIssues = [
    ...(auditData.seo?.issues || []),
    ...(auditData.performance?.issues || []),
    ...(auditData.conversion?.issues || []),
  ];

  // Sort by severity
  const sorted = allIssues.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return sorted.slice(0, 3);
}

function getPlatformDisplayName(platform) {
  const names = {
    shopify: 'Shopify',
    wordpress: 'WordPress',
    woocommerce: 'WooCommerce',
    unknown: 'e-commerce',
  };
  return names[platform] || 'e-commerce';
}

function getIndustryExample(platform) {
  const examples = {
    shopify: 'Shopify stores',
    wordpress: 'WordPress sites',
    woocommerce: 'WooCommerce stores',
    unknown: 'online businesses',
  };
  return examples[platform] || 'online businesses';
}

function extractDomain(url) {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
}

module.exports = { generateOutreach };
