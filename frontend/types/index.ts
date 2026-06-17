export type Platform = 'shopify' | 'wordpress' | 'woocommerce' | 'unknown';
export type Country = 'usa' | 'uk' | 'germany' | 'australia' | 'canada';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed_won' | 'closed_lost';
export type SeverityLevel = 'critical' | 'warning' | 'info';

export interface Lead {
  id: string;
  company_name: string | null;
  website: string;
  country: Country | null;
  platform: Platform | null;
  industry: string | null;
  email: string | null;
  contact_page_url: string | null;
  about_page_url: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  phone: string | null;
  store_age_estimate: string | null;
  technology_stack: string | null;
  theme: string | null;
  plugins: string[];
  woocommerce: boolean;
  score: number;
  score_breakdown: ScoreBreakdownItem[];
  status: LeadStatus;
  tags: string[];
  notes: string | null;
  audit_data: AuditResult | null;
  opportunity_report: Opportunity[];
  created_at: string;
  updated_at: string;
  last_audited: string | null;
}

export interface ScoreBreakdownItem {
  factor: string;
  points: number;
}

export interface AuditIssue {
  id: string;
  severity: SeverityLevel;
  message: string;
  impact: 'high' | 'medium' | 'low';
}

export interface AuditSection {
  issues: AuditIssue[];
  passed: { id: string; message: string }[];
}

export interface AuditResult {
  url: string;
  loadTime: number;
  seoScore: number;
  performanceScore: number;
  conversionScore: number;
  overallScore: number;
  seo: AuditSection;
  performance: AuditSection;
  conversion: AuditSection;
  opportunities: Opportunity[];
  auditedAt: string;
  leadScore?: number;
  scoreBreakdown?: ScoreBreakdownItem[];
}

export interface Opportunity {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  service: string;
  estimatedValue: string;
}

export interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface StatsOverview {
  totals: {
    totalLeads: number;
    shopifyLeads: number;
    wordpressLeads: number;
    hotLeads: number;
    contactedLeads: number;
  };
  avgScore: number;
  byCountry: { country: string; count: number }[];
  byPlatform: { platform: string; count: number }[];
  byIndustry: { industry: string; count: number }[];
  recentLeads: Partial<Lead>[];
  scoreDistribution: { range: string; count: number }[];
}

export interface SearchFilters {
  country?: string;
  platform?: string;
  industry?: string;
  search?: string;
  minScore?: number;
  maxScore?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export const COUNTRIES: { value: Country; label: string; flag: string }[] = [
  { value: 'usa', label: 'United States', flag: '🇺🇸' },
  { value: 'uk', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'germany', label: 'Germany', flag: '🇩🇪' },
  { value: 'australia', label: 'Australia', flag: '🇦🇺' },
  { value: 'canada', label: 'Canada', flag: '🇨🇦' },
];

export const INDUSTRIES = [
  'fashion', 'jewelry', 'beauty', 'health', 'electronics',
  'home-decor', 'furniture', 'food', 'sports', 'automotive'
];

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'shopify', label: 'Shopify' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'woocommerce', label: 'WooCommerce' },
];

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-700' },
  { value: 'proposal', label: 'Proposal Sent', color: 'bg-orange-100 text-orange-700' },
  { value: 'closed_won', label: 'Closed Won', color: 'bg-green-100 text-green-700' },
  { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 text-red-700' },
];
