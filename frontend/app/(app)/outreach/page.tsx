'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { leadsApi, outreachApi } from '@/lib/api';
import { Lead } from '@/types';
import { getPlatformIcon, getCountryFlag, getScoreColor, formatDate, formatDomain } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Mail, MessageSquare, RefreshCw, Loader2, Copy, CheckCircle,
  ExternalLink, Zap, ChevronDown, Search, Filter
} from 'lucide-react';

const OUTREACH_TYPES = [
  { value: 'cold_email', label: '📧 Cold Email', desc: 'First contact via email' },
  { value: 'linkedin', label: '💼 LinkedIn DM', desc: 'Short LinkedIn message' },
  { value: 'followup', label: '🔄 Follow-up', desc: 'Follow up after no reply' },
];

export default function OutreachPage() {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [minScore, setMinScore] = useState(50);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [generatedMessages, setGeneratedMessages] = useState<Record<string, any>>({});
  const [outreachType, setOutreachType] = useState('cold_email');

  const { data, isLoading } = useQuery({
    queryKey: ['leads-outreach', search, platformFilter, minScore],
    queryFn: () => leadsApi.list({
      search,
      platform: platformFilter,
      minScore,
      sortBy: 'score',
      sortOrder: 'DESC',
      limit: 50,
    }),
  });

  const generateMutation = useMutation({
    mutationFn: (leadId: string) => outreachApi.generate(leadId, outreachType),
    onSuccess: (data, leadId) => {
      setGeneratedMessages(prev => ({ ...prev, [leadId]: data }));
      toast.success('Message generated!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const generateAll = async () => {
    const ids = Array.from(selectedLeads);
    if (ids.length === 0) return toast.error('Select leads first');
    toast.loading(`Generating ${ids.length} messages...`, { id: 'gen-all' });
    for (const id of ids) {
      try {
        const msg = await outreachApi.generate(id, outreachType);
        setGeneratedMessages(prev => ({ ...prev, [id]: msg }));
      } catch {}
    }
    toast.dismiss('gen-all');
    toast.success(`Generated ${ids.length} messages!`);
  };

  const leads: Lead[] = data?.leads || [];
  const toggleLead = (id: string) => {
    setSelectedLeads(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Outreach Hub</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Generate personalized cold emails, LinkedIn messages, and follow-ups
          </p>
        </div>
        {selectedLeads.size > 0 && (
          <button
            onClick={generateAll}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Generate for {selectedLeads.size} selected leads
          </button>
        )}
      </div>

      {/* Type selector */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">Select Message Type</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OUTREACH_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setOutreachType(type.value)}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                outreachType === type.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-border hover:border-border/60 hover:bg-muted/50'
              }`}
            >
              <div className="font-medium text-sm">{type.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={platformFilter}
          onChange={e => setPlatformFilter(e.target.value)}
          className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Platforms</option>
          <option value="shopify">Shopify</option>
          <option value="wordpress">WordPress</option>
          <option value="woocommerce">WooCommerce</option>
        </select>
        <div className="flex items-center gap-2 border border-input rounded-lg px-3 py-2 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">Min Score:</span>
          <input
            type="number"
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            min={0} max={100}
            className="w-16 bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Leads list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl shimmer" />)}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-medium mb-1">No leads match your filters</p>
          <p className="text-sm text-muted-foreground mb-4">Try lowering the minimum score or changing platform filter.</p>
          <Link href="/search" className="text-blue-600 hover:underline text-sm">Find new leads →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{leads.length} leads available</p>
            <button
              onClick={() => {
                if (selectedLeads.size === leads.length) setSelectedLeads(new Set());
                else setSelectedLeads(new Set(leads.map(l => l.id)));
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              {selectedLeads.size === leads.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          {leads.map(lead => (
            <OutreachLeadCard
              key={lead.id}
              lead={lead}
              selected={selectedLeads.has(lead.id)}
              onToggle={() => toggleLead(lead.id)}
              message={generatedMessages[lead.id]}
              onGenerate={() => generateMutation.mutate(lead.id)}
              isGenerating={generateMutation.isPending && generateMutation.variables === lead.id}
              outreachType={outreachType}
            />
          ))}
        </div>
      )}

      {/* Template tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-3 text-blue-800">📋 Outreach Best Practices</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-blue-700">
          {[
            { tip: 'Personalize [Your Name] and [Your Company] before sending', icon: '✍️' },
            { tip: 'Reference specific audit findings for higher response rates', icon: '🎯' },
            { tip: 'Follow up 3-5 business days after first contact', icon: '📅' },
            { tip: 'Keep LinkedIn messages under 200 words', icon: '💼' },
            { tip: 'Include a clear, single call-to-action in each message', icon: '👆' },
            { tip: 'A/B test subject lines for cold emails', icon: '🧪' },
          ].map(({ tip, icon }) => (
            <div key={tip} className="flex items-start gap-2 bg-white/60 rounded-lg p-2.5">
              <span>{icon}</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OutreachLeadCard({
  lead, selected, onToggle, message, onGenerate, isGenerating, outreachType
}: {
  lead: Lead;
  selected: boolean;
  onToggle: () => void;
  message: any;
  onGenerate: () => void;
  isGenerating: boolean;
  outreachType: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const text = outreachType === 'cold_email'
      ? `Subject: ${message?.subject}\n\n${message?.body}`
      : message?.body || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-card border rounded-xl transition-all ${selected ? 'border-blue-400 shadow-sm' : 'border-border'}`}>
      <div className="p-4 flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 rounded cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/leads/${lead.id}`} className="font-semibold text-sm hover:text-blue-600 transition-colors">
                  {lead.company_name || formatDomain(lead.website)}
                </Link>
                <span className={`text-xs px-1.5 py-0.5 rounded border font-bold ${getScoreColor(lead.score)}`}>
                  {lead.score}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <a href={lead.website} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  {formatDomain(lead.website)} <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span className="text-xs text-muted-foreground">
                  {getPlatformIcon(lead.platform || '')} {lead.platform}
                </span>
                <span className="text-xs text-muted-foreground">
                  {getCountryFlag(lead.country || '')} {lead.country}
                </span>
                {lead.email && <span className="text-xs text-muted-foreground">✉️ {lead.email}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {message ? (
                <>
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 text-xs border border-border px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setExpanded(e => !e)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    {expanded ? 'Hide' : 'Show'} <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                </>
              ) : (
                <button
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors font-medium"
                >
                  {isGenerating
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                    : <><Zap className="w-3.5 h-3.5" /> Generate</>
                  }
                </button>
              )}
            </div>
          </div>

          {/* Generated message preview */}
          {message && expanded && (
            <div className="mt-3 bg-muted/50 rounded-lg p-3 text-xs space-y-2">
              {message.subject && (
                <div>
                  <span className="font-semibold text-muted-foreground uppercase tracking-wide">Subject: </span>
                  <span className="font-medium">{message.subject}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground border-t border-border pt-2">
                {message.body}
              </div>
            </div>
          )}
          {message && !expanded && (
            <div className="mt-2 text-xs text-muted-foreground truncate">
              {message.subject
                ? `📧 Subject: ${message.subject}`
                : message.body?.substring(0, 100) + '…'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
