'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, exportApi } from '@/lib/api';
import { Lead, COUNTRIES, INDUSTRIES, PLATFORMS, LEAD_STATUSES } from '@/types';
import {
  getPlatformColor, getPlatformIcon, getCountryFlag,
  getScoreColor, getScoreLabel, capitalizeFirst, formatDate, formatDomain
} from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  Search, Filter, Download, Trash2, RefreshCw, ChevronLeft,
  ChevronRight, ExternalLink, Mail, Phone, Linkedin, Tag, X, CheckSquare
} from 'lucide-react';

export default function LeadsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    search: '', country: 'all', platform: 'all', industry: 'all',
    status: 'all', minScore: '', maxScore: '',
    sortBy: 'created_at', sortOrder: 'DESC', page: 1, limit: 20,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadsApi.list(filters),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: leadsApi.bulkDelete,
    onSuccess: () => {
      toast.success(`Deleted ${selected.size} lead(s)`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateFilter = useCallback((key: string, value: string | number) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  }, []);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === data?.leads?.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data?.leads?.map((l: Lead) => l.id) || []));
    }
  };

  const leads: Lead[] = data?.leads || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold">Lead Database</h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              {total.toLocaleString()} leads total {isFetching && '· refreshing...'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <>
                <span className="text-sm text-muted-foreground">{selected.size} selected</span>
                <button
                  onClick={() => deleteMutation.mutate(Array.from(selected))}
                  className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}
            <button
              onClick={() => exportApi.csv({
                ...(filters.country !== 'all' && { country: filters.country }),
                ...(filters.platform !== 'all' && { platform: filters.platform }),
              })}
              className="flex items-center gap-1.5 text-sm border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={() => setShowFilters(f => !f)}
              className="flex items-center gap-1.5 text-sm border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by company, website, email…"
            value={filters.search}
            onChange={e => updateFilter('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {filters.search && (
            <button onClick={() => updateFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { key: 'country', label: 'Country', options: [{ value: 'all', label: 'All Countries' }, ...COUNTRIES.map(c => ({ value: c.value, label: `${c.flag} ${c.label}` }))] },
              { key: 'platform', label: 'Platform', options: [{ value: 'all', label: 'All Platforms' }, ...PLATFORMS.map(p => ({ value: p.value, label: p.label }))] },
              { key: 'industry', label: 'Industry', options: [{ value: 'all', label: 'All Industries' }, ...INDUSTRIES.map(i => ({ value: i, label: capitalizeFirst(i) }))] },
              { key: 'status', label: 'Status', options: [{ value: 'all', label: 'All Statuses' }, ...LEAD_STATUSES.map(s => ({ value: s.value, label: s.label }))] },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <select
                  value={(filters as any)[f.key]}
                  onChange={e => updateFilter(f.key, e.target.value)}
                  className="w-full border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min Score</label>
              <input type="number" min={0} max={100} placeholder="0"
                value={filters.minScore}
                onChange={e => updateFilter('minScore', e.target.value)}
                className="w-full border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sort by</label>
              <select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={e => {
                  const [by, order] = e.target.value.split('_');
                  setFilters(f => ({ ...f, sortBy: by, sortOrder: order as 'ASC' | 'DESC' }));
                }}
                className="w-full border border-input rounded-lg px-2 py-1.5 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="created_at_DESC">Newest first</option>
                <option value="score_DESC">Score: High to Low</option>
                <option value="score_ASC">Score: Low to High</option>
                <option value="company_name_ASC">Name A-Z</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <TableSkeleton />
        ) : leads.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b border-border z-10">
              <tr>
                <th className="w-10 px-3 py-2.5 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === leads.length && leads.length > 0}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs">Company</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs">Platform</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs hidden md:table-cell">Country</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs hidden lg:table-cell">Industry</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs">Contact</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs">Score</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs hidden xl:table-cell">Status</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs hidden xl:table-cell">Added</th>
                <th className="w-16 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  selected={selected.has(lead.id)}
                  onToggle={() => toggleSelect(lead.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="px-6 py-3 border-t border-border bg-background flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            Page {filters.page} of {pages} · {total} total leads
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
              disabled={filters.page <= 1}
              className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const pg = Math.max(1, Math.min(pages - 4, filters.page - 2)) + i;
              return (
                <button
                  key={pg}
                  onClick={() => setFilters(f => ({ ...f, page: pg }))}
                  className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                    pg === filters.page
                      ? 'bg-blue-600 text-white'
                      : 'border border-border hover:bg-muted'
                  }`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setFilters(f => ({ ...f, page: Math.min(pages, f.page + 1) }))}
              disabled={filters.page >= pages}
              className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadRow({ lead, selected, onToggle }: { lead: Lead; selected: boolean; onToggle: () => void }) {
  const statusObj = LEAD_STATUSES.find(s => s.value === lead.status);
  return (
    <tr className={`hover:bg-muted/30 transition-colors ${selected ? 'bg-blue-50/50' : ''}`}>
      <td className="px-3 py-3">
        <input type="checkbox" checked={selected} onChange={onToggle} className="rounded" />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
            {(lead.company_name || lead.website || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link href={`/leads/${lead.id}`} className="font-medium text-sm hover:text-blue-600 transition-colors truncate block max-w-[160px]">
              {lead.company_name || formatDomain(lead.website)}
            </Link>
            <a href={lead.website} target="_blank" rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-blue-500 flex items-center gap-1 truncate max-w-[160px]"
            >
              {formatDomain(lead.website)} <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border font-medium ${getPlatformColor(lead.platform || '')}`}>
          {getPlatformIcon(lead.platform || '')} {lead.platform || 'Unknown'}
        </span>
      </td>
      <td className="px-3 py-3 hidden md:table-cell">
        <span className="text-sm">
          {getCountryFlag(lead.country || '')} <span className="capitalize text-muted-foreground text-xs">{lead.country || '—'}</span>
        </span>
      </td>
      <td className="px-3 py-3 hidden lg:table-cell">
        <span className="text-xs text-muted-foreground capitalize">{lead.industry?.replace(/-/g, ' ') || '—'}</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          {lead.email && (
            <a href={`mailto:${lead.email}`} title={lead.email}
              className="text-muted-foreground hover:text-blue-600 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} title={lead.phone}
              className="text-muted-foreground hover:text-green-600 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          )}
          {lead.linkedin_url && (
            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-blue-700 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          )}
          {!lead.email && !lead.phone && !lead.linkedin_url && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-col gap-0.5">
          <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border w-fit ${getScoreColor(lead.score)}`}>
            {lead.score}
          </span>
          <span className="text-xs text-muted-foreground">{getScoreLabel(lead.score)}</span>
        </div>
      </td>
      <td className="px-3 py-3 hidden xl:table-cell">
        {statusObj && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusObj.color}`}>
            {statusObj.label}
          </span>
        )}
      </td>
      <td className="px-3 py-3 hidden xl:table-cell text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(lead.created_at)}
      </td>
      <td className="px-3 py-3">
        <Link href={`/leads/${lead.id}`}
          className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
        >
          View →
        </Link>
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-2">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-14 bg-muted rounded-lg shimmer" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-muted-foreground opacity-40" />
      </div>
      <h3 className="font-semibold text-lg mb-1">No leads found</h3>
      <p className="text-muted-foreground text-sm mb-4 max-w-sm">
        Try adjusting your filters, or go find some new leads!
      </p>
      <Link href="/search"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Find Leads →
      </Link>
    </div>
  );
}
