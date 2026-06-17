'use client';
import { useState } from 'react';
import { searchApi, leadsApi } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, Loader2, Globe, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { COUNTRIES, INDUSTRIES, PLATFORMS } from '@/types';
import { getPlatformColor, getPlatformIcon, getCountryFlag, getScoreColor, capitalizeFirst } from '@/lib/utils';
import Link from 'next/link';

export default function SearchPage() {
  const [filters, setFilters] = useState({
    country: 'all',
    industry: 'all',
    platform: 'all',
    limit: 20,
  });
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const searchMutation = useMutation({
    mutationFn: searchApi.search,
    onSuccess: (data) => {
      setResults(data.leads || []);
      setSearched(true);
      toast.success(`Found ${data.leads?.length || 0} leads!`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Search failed');
    },
  });

  const saveMutation = useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => toast.success('Lead saved to database!'),
    onError: (err: any) => toast.error(err.message),
  });

  const handleSearch = () => {
    searchMutation.mutate(filters);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Find Leads</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Discover Shopify and WordPress stores by country and industry
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm">Search Filters</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Country */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Country</label>
            <select
              value={filters.country}
              onChange={e => setFilters(f => ({ ...f, country: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Countries</option>
              {COUNTRIES.map(c => (
                <option key={c.value} value={c.value}>
                  {c.flag} {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Industry</label>
            <select
              value={filters.industry}
              onChange={e => setFilters(f => ({ ...f, industry: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Industries</option>
              {INDUSTRIES.map(i => (
                <option key={i} value={i}>{capitalizeFirst(i)}</option>
              ))}
            </select>
          </div>

          {/* Platform */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Platform</label>
            <select
              value={filters.platform}
              onChange={e => setFilters(f => ({ ...f, platform: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Platforms</option>
              {PLATFORMS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Limit */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Max Results</label>
            <select
              value={filters.limit}
              onChange={e => setFilters(f => ({ ...f, limit: parseInt(e.target.value) }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={10}>10 leads</option>
              <option value={20}>20 leads</option>
              <option value={50}>50 leads</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleSearch}
            disabled={searchMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {searchMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
            ) : (
              <><Search className="w-4 h-4" /> Search Leads</>
            )}
          </button>

          <p className="text-xs text-muted-foreground">
            ✓ Respects robots.txt &nbsp;·&nbsp; ✓ Public data only &nbsp;·&nbsp; ✓ GDPR compliant
          </p>
        </div>
      </div>

      {/* URL Analyzer */}
      <URLAnalyzer />

      {/* Results */}
      {searched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">
              Search Results <span className="text-muted-foreground font-normal text-sm">({results.length} found)</span>
            </h2>
            {results.length > 0 && (
              <button
                onClick={() => {
                  results.forEach(lead => saveMutation.mutate(lead));
                  toast.success(`Saving ${results.length} leads...`);
                }}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Save All to Database →
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">No leads found for these filters. Try adjusting your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((lead, i) => (
                <LeadResultCard 
                  key={i} 
                  lead={lead}
                  onSave={() => saveMutation.mutate(lead)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function URLAnalyzer() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);

  const analyzeMutation = useMutation({
    mutationFn: () => searchApi.analyze(url),
    onSuccess: (data) => {
      setResult(data);
      toast.success('Analysis complete!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-orange-500" />
        <span className="font-semibold text-sm">Analyze a Specific URL</span>
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={e => e.key === 'Enter' && url && analyzeMutation.mutate()}
        />
        <button
          onClick={() => url && analyzeMutation.mutate()}
          disabled={!url || analyzeMutation.isPending}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-60 transition-colors"
        >
          {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Analyze
        </button>
      </div>

      {result && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
          <div className="flex flex-wrap gap-3">
            <div><span className="text-muted-foreground">Platform:</span> <strong className="capitalize">{result.platform || 'Unknown'}</strong></div>
            {result.theme && <div><span className="text-muted-foreground">Theme:</span> <strong>{result.theme}</strong></div>}
            {result.email && <div><span className="text-muted-foreground">Email:</span> <strong>{result.email}</strong></div>}
            {result.isWooCommerce && <span className="text-purple-600 font-medium">WooCommerce ✓</span>}
          </div>
          {result.technologyStack && (
            <div className="mt-1.5 text-xs text-muted-foreground">
              <span className="font-medium">Tech Stack:</span> {result.technologyStack}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeadResultCard({ lead, onSave }: { lead: any; onSave: () => void }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
            {(lead.company_name || lead.website || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{lead.company_name || 'Unknown'}</div>
            <a 
              href={lead.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline truncate block"
            >
              {lead.website}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreColor(lead.score || 0)}`}>
            {lead.score || '--'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {lead.platform && (
          <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${getPlatformColor(lead.platform)}`}>
            {getPlatformIcon(lead.platform)} {lead.platform}
          </span>
        )}
        {lead.country && (
          <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            {getCountryFlag(lead.country)} {lead.country}
          </span>
        )}
        {lead.industry && (
          <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground capitalize">
            {lead.industry}
          </span>
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
        {lead.email && <div>✉️ {lead.email}</div>}
        {lead.phone && <div>📞 {lead.phone}</div>}
        {lead.technologyStack && <div className="truncate">⚙️ {lead.technologyStack}</div>}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Save Lead
        </button>
        <Link
          href={`/audit?url=${encodeURIComponent(lead.website)}`}
          className="flex items-center gap-1.5 text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          Audit →
        </Link>
      </div>
    </div>
  );
}
