'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, auditApi, outreachApi } from '@/lib/api';
import { Lead, LEAD_STATUSES, AuditResult } from '@/types';
import {
  getPlatformColor, getPlatformIcon, getCountryFlag, getScoreColor,
  getScoreLabel, getSeverityColor, getSeverityIcon, formatDate, formatDomain, capitalizeFirst
} from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, Mail, Phone, Linkedin, Facebook,
  Instagram, Globe, Zap, BarChart2, MessageSquare, Edit2,
  CheckCircle, Loader2, Tag, FileText, Clock, Copy
} from 'lucide-react';

const TABS = ['Overview', 'Audit', 'Opportunities', 'Outreach', 'Notes'];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('Overview');
  const [notes, setNotes] = useState('');
  const [notesEditing, setNotesEditing] = useState(false);

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(id),
    enabled: !!id,
  });

  // Sync notes state when lead loads
  useEffect(() => {
    if (lead?.notes) setNotes(lead.notes);
  }, [lead?.notes]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => leadsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', id] });
      toast.success('Lead updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const auditMutation = useMutation({
    mutationFn: () => auditApi.run(lead!.website, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', id] });
      toast.success('Audit complete!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <DetailSkeleton />;
  if (!lead) return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">Lead not found.</p>
      <Link href="/leads" className="text-blue-600 hover:underline mt-2 inline-block">← Back to leads</Link>
    </div>
  );

  const audit: AuditResult | null = lead.audit_data as any;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()}
          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors flex-shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold truncate">
                {lead.company_name || formatDomain(lead.website)}
              </h1>
              <a href={lead.website} target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
              >
                {lead.website} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <button
              onClick={() => auditMutation.mutate()}
              disabled={auditMutation.isPending}
              className="flex items-center gap-1.5 text-sm bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {auditMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
              {auditMutation.isPending ? 'Auditing…' : 'Run Audit'}
            </button>
          </div>
        </div>
      </div>

      {/* Score card + info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-xl border p-4 flex items-center gap-4 ${getScoreColor(lead.score)}`}>
          <div className="text-4xl font-bold">{lead.score}</div>
          <div>
            <div className="font-semibold">{getScoreLabel(lead.score)}</div>
            <div className="text-xs opacity-80">Lead Score / 100</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className={`text-sm px-2 py-1 rounded-md border font-medium ${getPlatformColor(lead.platform || '')}`}>
              {getPlatformIcon(lead.platform || '')} {capitalizeFirst(lead.platform || 'Unknown')}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {getCountryFlag(lead.country || '')} <span className="capitalize">{lead.country || 'Unknown'}</span>
            {lead.industry && <span className="ml-2">· {lead.industry.replace(/-/g, ' ')}</span>}
          </div>
          {lead.store_age_estimate && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Store age: {lead.store_age_estimate}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Lead Status</label>
          <select
            value={lead.status}
            onChange={e => updateMutation.mutate({ status: e.target.value as any })}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {LEAD_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <div className="text-xs text-muted-foreground mt-1.5">Added: {formatDate(lead.created_at)}</div>
          {lead.last_audited && (
            <div className="text-xs text-muted-foreground">Audited: {formatDate(lead.last_audited)}</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      {activeTab === 'Overview' && <OverviewTab lead={lead} />}
      {activeTab === 'Audit' && <AuditTab audit={audit} />}
      {activeTab === 'Opportunities' && <OpportunitiesTab lead={lead} audit={audit} />}
      {activeTab === 'Outreach' && <OutreachTab lead={lead} />}
      {activeTab === 'Notes' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Notes</h3>
            {notesEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { updateMutation.mutate({ notes }); setNotesEditing(false); }}
                  disabled={updateMutation.isPending}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {updateMutation.isPending ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setNotes(lead.notes || ''); setNotesEditing(false); }}
                  className="text-xs border border-border px-3 py-1 rounded-lg hover:bg-muted"
                >Cancel</button>
              </div>
            ) : (
              <button onClick={() => setNotesEditing(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
          {notesEditing ? (
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={6}
              placeholder="Add notes about this lead…"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[80px]">
              {lead.notes || 'No notes yet. Click Edit to add notes.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function OverviewTab({ lead }: { lead: Lead }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-500" /> Contact Information
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Email', value: lead.email, icon: <Mail className="w-3.5 h-3.5" />, href: lead.email ? `mailto:${lead.email}` : null },
            { label: 'Phone', value: lead.phone, icon: <Phone className="w-3.5 h-3.5" />, href: lead.phone ? `tel:${lead.phone}` : null },
            { label: 'Contact', value: lead.contact_page_url ? 'View page →' : null, icon: <Globe className="w-3.5 h-3.5" />, href: lead.contact_page_url },
            { label: 'About', value: lead.about_page_url ? 'View page →' : null, icon: <FileText className="w-3.5 h-3.5" />, href: lead.about_page_url },
            { label: 'LinkedIn', value: lead.linkedin_url ? 'Profile →' : null, icon: <Linkedin className="w-3.5 h-3.5" />, href: lead.linkedin_url },
            { label: 'Facebook', value: lead.facebook_url ? 'Page →' : null, icon: <Facebook className="w-3.5 h-3.5" />, href: lead.facebook_url },
            { label: 'Instagram', value: lead.instagram_url ? 'Profile →' : null, icon: <Instagram className="w-3.5 h-3.5" />, href: lead.instagram_url },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2.5 text-sm">
              <span className="text-muted-foreground flex-shrink-0">{item.icon}</span>
              <span className="text-muted-foreground w-20 flex-shrink-0 text-xs">{item.label}:</span>
              {item.href && item.value ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >{item.value}</a>
              ) : (
                <span className="text-muted-foreground text-xs">{item.value || '—'}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" /> Technology Stack
          </h3>
          {lead.technology_stack ? (
            <div className="flex flex-wrap gap-1.5">
              {lead.technology_stack.split(', ').map(tech => (
                <span key={tech} className="text-xs bg-muted px-2 py-1 rounded-md font-medium">{tech}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Run an audit to detect tech stack</p>
          )}
          {lead.theme && <p className="text-xs text-muted-foreground mt-2">Theme: <strong>{lead.theme}</strong></p>}
        </div>

        {lead.score_breakdown && lead.score_breakdown.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3">Score Breakdown</h3>
            <div className="space-y-1.5">
              {lead.score_breakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.factor}</span>
                  <span className="font-bold text-blue-600">+{item.points}</span>
                </div>
              ))}
              <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between text-xs font-semibold">
                <span>Total Score</span>
                <span className="text-blue-600">{lead.score}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditTab({ audit }: { audit: AuditResult | null }) {
  if (!audit) return (
    <div className="bg-card border border-border rounded-xl p-12 text-center">
      <BarChart2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
      <p className="font-semibold mb-1">No audit data yet</p>
      <p className="text-sm text-muted-foreground">Click "Run Audit" above to analyze this website.</p>
    </div>
  );

  const sections = [
    { title: 'SEO', icon: '🔍', data: audit.seo, score: audit.seoScore },
    { title: 'Performance', icon: '⚡', data: audit.performance, score: audit.performanceScore },
    { title: 'Conversion', icon: '💰', data: audit.conversion, score: audit.conversionScore },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {sections.map(s => (
          <div key={s.title} className={`rounded-xl p-4 text-center border ${
            s.score >= 70 ? 'bg-green-50 border-green-200 text-green-700' :
            s.score >= 40 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
            'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="text-2xl font-bold">{s.score}</div>
            <div className="text-xs font-medium mt-0.5">{s.icon} {s.title}</div>
          </div>
        ))}
      </div>

      {audit.loadTime && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <Zap className={`w-5 h-5 ${audit.loadTime > 3000 ? 'text-red-500' : audit.loadTime > 2000 ? 'text-yellow-500' : 'text-green-500'}`} />
          <span className="text-sm">Page load: <strong>{(audit.loadTime / 1000).toFixed(2)}s</strong></span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${
            audit.loadTime < 2000 ? 'bg-green-100 text-green-700' :
            audit.loadTime < 4000 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
          }`}>
            {audit.loadTime < 2000 ? 'Fast' : audit.loadTime < 4000 ? 'Moderate' : 'Slow'}
          </span>
        </div>
      )}

      {sections.map(section => (
        <div key={section.title} className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3">{section.icon} {section.title} Issues</h3>
          <div className="space-y-2 mb-3">
            {(section.data?.issues || []).map(issue => (
              <div key={issue.id} className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${getSeverityColor(issue.severity)}`}>
                <span className="flex-shrink-0 mt-0.5">{getSeverityIcon(issue.severity)}</span>
                <span className="flex-1">{issue.message}</span>
                <span className="text-xs opacity-60 capitalize flex-shrink-0">{issue.severity}</span>
              </div>
            ))}
            {(section.data?.issues || []).length === 0 && (
              <div className="text-sm text-green-600 flex items-center gap-2 bg-green-50 p-2.5 rounded-lg">
                <CheckCircle className="w-4 h-4" /> No issues found
              </div>
            )}
          </div>
          {(section.data?.passed || []).length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium mb-1">✅ Passing</p>
              {section.data!.passed.map(p => (
                <div key={p.id} className="text-xs text-green-600 flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 flex-shrink-0" /> {p.message}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function OpportunitiesTab({ lead, audit }: { lead: Lead; audit: AuditResult | null }) {
  const opps = (lead.opportunity_report || audit?.opportunities || []) as any[];
  if (opps.length === 0) return (
    <div className="bg-card border border-border rounded-xl p-12 text-center">
      <Zap className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
      <p className="font-semibold mb-1">No opportunities yet</p>
      <p className="text-sm text-muted-foreground">Run an audit to generate AI opportunity reports.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>💡 {opps.length} service opportunit{opps.length > 1 ? 'ies' : 'y'} identified</strong> for {lead.company_name || formatDomain(lead.website)}.
      </div>
      {opps.map((opp, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold">{opp.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${
              opp.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
              opp.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
              'bg-blue-100 text-blue-700 border-blue-200'
            }`}>{opp.priority} priority</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{opp.description}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="bg-muted px-2 py-1 rounded text-xs font-medium">{opp.service}</span>
            <span className="text-green-600 font-semibold text-xs">{opp.estimatedValue}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function OutreachTab({ lead }: { lead: Lead }) {
  const [type, setType] = useState<'cold_email' | 'linkedin' | 'followup'>('cold_email');
  const [generated, setGenerated] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: () => outreachApi.generate(lead.id, type),
    onSuccess: (data) => { setGenerated(data); toast.success('Message generated!'); },
    onError: (e: any) => toast.error(e.message),
  });

  const copy = () => {
    const text = type === 'cold_email' ? `Subject: ${generated.subject}\n\n${generated.body}` : generated.body;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const typeLabels: Record<string, string> = {
    cold_email: '📧 Cold Email',
    linkedin: '💼 LinkedIn DM',
    followup: '🔄 Follow-up',
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-500" /> Generate Personalized Outreach
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {(['cold_email', 'linkedin', 'followup'] as const).map(t => (
            <button key={t} onClick={() => { setType(t); setGenerated(null); }}
              className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                type === t ? 'bg-blue-600 text-white border-blue-600' : 'border-border hover:bg-muted'
              }`}
            >{typeLabels[t]}</button>
          ))}
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-60 transition-colors"
        >
          {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Zap className="w-4 h-4" /> Generate</>}
        </button>
      </div>

      {generated && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">{typeLabels[type]}</h3>
            <button onClick={copy}
              className="flex items-center gap-1.5 text-xs border border-border px-3 py-1 rounded-lg hover:bg-muted"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {generated.subject && (
            <div className="mb-3">
              <span className="text-xs font-medium text-muted-foreground">SUBJECT:</span>
              <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">{generated.subject}</div>
            </div>
          )}
          <div>
            <span className="text-xs font-medium text-muted-foreground">MESSAGE:</span>
            <div className="mt-1 p-3 bg-muted rounded text-sm whitespace-pre-wrap leading-relaxed">{generated.body}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">💡 Replace [Your Name] and [Your Company] before sending.</p>
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="h-8 w-64 bg-muted rounded shimmer" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl shimmer" />)}
      </div>
      <div className="h-10 bg-muted rounded shimmer" />
      <div className="h-64 bg-muted rounded-xl shimmer" />
    </div>
  );
}
