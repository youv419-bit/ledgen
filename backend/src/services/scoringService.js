/**
 * Lead Scoring Engine
 * Score 1-100: Higher score = more likely to need our services = better lead
 */

function calculateLeadScore(leadData, auditData) {
  let score = 0;
  const breakdown = [];

  // ==================
  // Platform-based scoring (max 20 points)
  // ==================
  if (leadData.platform === 'shopify') {
    score += 15;
    breakdown.push({ factor: 'Shopify store detected', points: 15 });
  } else if (leadData.platform === 'woocommerce') {
    score += 15;
    breakdown.push({ factor: 'WooCommerce store detected', points: 15 });
  } else if (leadData.platform === 'wordpress') {
    score += 10;
    breakdown.push({ factor: 'WordPress site detected', points: 10 });
  }

  // ==================
  // SEO Issues (max 30 points)
  // ==================
  if (auditData?.seo?.issues) {
    const criticalSEO = auditData.seo.issues.filter(i => i.severity === 'critical').length;
    const warningSEO = auditData.seo.issues.filter(i => i.severity === 'warning').length;

    const seoPoints = Math.min(30, (criticalSEO * 8) + (warningSEO * 4));
    if (seoPoints > 0) {
      score += seoPoints;
      breakdown.push({ factor: `SEO issues found (${criticalSEO} critical, ${warningSEO} warnings)`, points: seoPoints });
    }
  }

  // ==================
  // Performance Issues (max 20 points)
  // ==================
  if (auditData?.performance?.issues) {
    const criticalPerf = auditData.performance.issues.filter(i => i.severity === 'critical').length;
    const warningPerf = auditData.performance.issues.filter(i => i.severity === 'warning').length;

    const perfPoints = Math.min(20, (criticalPerf * 7) + (warningPerf * 3));
    if (perfPoints > 0) {
      score += perfPoints;
      breakdown.push({ factor: `Performance issues (${criticalPerf} critical, ${warningPerf} warnings)`, points: perfPoints });
    }
  }

  // Load time scoring
  if (auditData?.loadTime) {
    if (auditData.loadTime > 5000) {
      score += 10;
      breakdown.push({ factor: 'Very slow page load (>5s)', points: 10 });
    } else if (auditData.loadTime > 3000) {
      score += 5;
      breakdown.push({ factor: 'Slow page load (>3s)', points: 5 });
    }
  }

  // ==================
  // Conversion Issues (max 20 points)
  // ==================
  if (auditData?.conversion?.issues) {
    const criticalConv = auditData.conversion.issues.filter(i => i.severity === 'critical').length;
    const warningConv = auditData.conversion.issues.filter(i => i.severity === 'warning').length;

    const convPoints = Math.min(20, (criticalConv * 6) + (warningConv * 3));
    if (convPoints > 0) {
      score += convPoints;
      breakdown.push({ factor: `Conversion issues (${criticalConv} critical, ${warningConv} warnings)`, points: convPoints });
    }
  }

  // ==================
  // Contact info available (bonus, max 10)
  // ==================
  if (leadData.email) {
    score += 5;
    breakdown.push({ factor: 'Public email found', points: 5 });
  }
  if (leadData.linkedinUrl) {
    score += 3;
    breakdown.push({ factor: 'LinkedIn profile found', points: 3 });
  }
  if (leadData.phone) {
    score += 2;
    breakdown.push({ factor: 'Phone number found', points: 2 });
  }

  // Cap at 100
  const finalScore = Math.max(1, Math.min(100, score));

  return {
    score: finalScore,
    breakdown,
    grade: getGrade(finalScore),
    label: getLabel(finalScore),
  };
}

function getGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

function getLabel(score) {
  if (score >= 80) return 'Hot Lead';
  if (score >= 60) return 'Warm Lead';
  if (score >= 40) return 'Potential Lead';
  if (score >= 20) return 'Cold Lead';
  return 'Low Priority';
}

module.exports = { calculateLeadScore };
