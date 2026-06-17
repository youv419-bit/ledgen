'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auditApi, leadsApi } from '@/lib/api';
import { AuditResult } from '@/types';
import { getSeverityColor, getSeverityIcon, formatDomain } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  BarChart2, Loader2, CheckCircle, Zap,
  TrendingUp, Globe, Shield, ExternalLink
} from 'lucide-react';

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function getLeadScoreColor(s: number) {
  if (s >= 70) return 'bg-red-50 border-red-200 text-red-700';
  if (s >= 50) return 'bg-orange-50 border-orange-200 text-orange-700';
  if (s >= 30) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
  return 'bg-blue-50 border-blue-200 text-blue-700';
}
function getQualityColor(s: number) {
  if (s >= 80) return 'bg-green-50 border-green-200 text-green-700';
  if (s >= 60) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
  if (s >= 40) return 'bg-orange-50 border-orange-200 text-orange-700';
  return 'bg-red-50 border-red-200 text-red-700';
}

function AuditInner() {
  const searchParams = useSearchParams();
  const prefilledUrl = searchParams.get('url') || '';
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);

  useEffect(() => { if (prefilledUrl) setUrl(prefilledUrl); }, [prefilledUrl]);

  const auditMutation = useMutation({
    mutationFn: (u: string) => auditApi.run(u),
    onSuccess: (data) => { setResult(data); toast.success('Audit complete!'); },
    onError: (e: any) => toast.error(e.message || 'Audit failed'),
  });

  const saveMutation = useMutation({
    mutationFn: () => leadsApi.create({
      website: url, audit_data: result,
      opportunity_report: result?.opportunities || [],
      score: result?.leadScore || result?.overallScore,
    }),
    onSuccess: () => { toast.success('Saved as lead!'); qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['stats'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const run = () => {
    if (!url.trim()) return toast.error('Enter a URL');
    const u = url.startsWith('http') ? url : `https://${url}`;
    setUrl(u);
    auditMutation.mutate(u);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Website Audit</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Full SEO, performance &amp; conversion analysis</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <label className="text-sm font-medium mb-2 block">Enter Website URL</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com" onKeyDown={e => e.key === 'Enter' && run()}
              className="w-full pl-9 pr-4 py-2.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button onClick={run} disabled={auditMutation.isPending || !url.trim()}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {auditMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Auditing…</> : <><BarChart2 className="w-4 h-4" />Run Audit</>}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">✓ Respects robots.txt &nbsp;·&nbsp; ✓ Public data only &nbsp;·&nbsp; ✓ GDPR compliant</p>
      </div>

      {auditMutation.isPending && (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <BarChart2 className="absolute inset-0 m-auto w-6 h-6 text-blue-500" />
          </div>
          <p className="font-medium mb-1">Analyzing {url ? formatDomain(url) : 'website'}…</p>
          <p className="text-sm text-muted-foreground">Checking SEO, performance, and conversion elements</p>
        </div>
      )}

      {result && !auditMutation.isPending && (
        <div className="space-y-5">
          {/* Score cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Lead Score', value: result.leadScore ?? result.overallScore, desc: 'Higher = better lead', fn: getLeadScoreColor },
              { label: 'SEO Score', value: result.seoScore, desc: 'SEO health', fn: getQualityColor },
              { label: 'Performance', value: result.performanceScore, desc: 'Speed & CWV', fn: getQualityColor },
              { label: 'Conversion', value: result.conversionScore, desc: 'CRO elements', fn: getQualityColor },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-4 text-center ${s.fn(s.value)}`}>
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-xs font-semibold mt-0.5">{s.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Load time + CTA */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Zap className={`w-5 h-5 ${result.loadTime > 3000 ? 'text-red-500' : result.loadTime > 2000 ? 'text-yellow-500' : 'text-green-500'}`} />
              <span className="text-sm">Load time: <strong>{(result.loadTime / 1000).toFixed(2)}s</strong></span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.loadTime < 2000 ? 'bg-green-100 text-green-700' : result.loadTime < 4000 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {result.loadTime < 2000 ? 'Fast' : result.loadTime < 4000 ? 'Moderate' : 'Slow'}
              </span>
            </div>
            <div className="flex gap-2">
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Visit
              </a>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium">
                {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5" />}
                {saveMutation.isPending ? 'Saving…' : 'Save as Lead'}
              </button>
            </div>
          </div>

          {/* Issue sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'SEO Issues', icon: '🔍', data: result.seo },
              { title: 'Performance Issues', icon: '⚡', data: result.performance },
              { title: 'Conversion Issues', icon: '💰', data: result.conversion },
            ].map(section => (
              <div key={section.title} className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3">{section.icon} {section.title}</h3>
                <div className="space-y-1.5 mb-3">
                  {(section.data?.issues || []).length === 0 ? (
                    <div className="text-xs text-green-600 flex items-center gap-1.5 p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> No issues found!
                    </div>
                  ) : (
                    (section.data?.issues || []).map(issue => (
                      <div key={issue.id} className={`p-2 rounded-lg text-xs flex items-start gap-2 ${getSeverityColor(issue.severity)}`}>
                        <span className="flex-shrink-0 mt-0.5">{getSeverityIcon(issue.severity)}</span>
                        <span className="leading-tight">{issue.message}</span>
                      </div>
                    ))
                  )}
                </div>
                {(section.data?.passed || []).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">✅ Passing</p>
                    {(section.data?.passed || []).slice(0, 3).map(p => (
                      <div key={p.id} className="text-xs text-green-700 flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 flex-shrink-0" /><span className="truncate">{p.message}</span>
                      </div>
                    ))}
                    {(section.data?.passed?.length || 0) > 3 && (
                      <p className="text-xs text-muted-foreground">+{(section.data?.passed?.length || 0) - 3} more</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Opportunities */}
          {(result.opportunities || []).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" /> Service Opportunities ({result.opportunities.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.opportunities.map((opp, i) => (
                  <div key={i} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium text-sm">{opp.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${opp.priority === 'high' ? 'bg-red-100 text-red-700' : opp.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{opp.priority}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{opp.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-muted px-2 py-1 rounded font-medium">{opp.service}</span>
                      <span className="text-xs font-semibold text-green-600">{opp.estimatedValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance */}
          <div className="bg-muted/50 border border-border rounded-xl p-4 flex items-start gap-3 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
            <div><strong className="text-foreground">GDPR Compliance:</strong> Only publicly accessible data analyzed. Robots.txt respected. No private data collected.</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted rounded shimmer" />
        <div className="h-32 bg-muted rounded-xl shimmer" />
      </div>
    }>
      <AuditInner />
    </Suspense>
  );
}
