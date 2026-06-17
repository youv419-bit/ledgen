'use client';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/lib/api';
import { StatsOverview } from '@/types';
import { 
  BarChart2, Target, TrendingUp, Globe, 
  Zap, ArrowUpRight, Users, CheckCircle 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import Link from 'next/link';
import { formatDate, getCountryFlag, getPlatformIcon, capitalizeFirst } from '@/lib/utils';

const SCORE_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#94a3b8'];
const PLATFORM_COLORS: Record<string, string> = {
  shopify: '#10b981',
  wordpress: '#3b82f6',
  woocommerce: '#8b5cf6',
  unknown: '#94a3b8',
};

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery<StatsOverview>({
    queryKey: ['stats'],
    queryFn: statsApi.overview,
    refetchInterval: 30000,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error || !stats) return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">Unable to load dashboard. Make sure the backend is running.</p>
      <p className="text-sm text-muted-foreground mt-1">Backend: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</p>
    </div>
  );

  const kpis = [
    { label: 'Total Leads', value: stats.totals.totalLeads, icon: Target, color: 'text-blue-600 bg-blue-50', change: '+12%' },
    { label: 'Hot Leads (70+)', value: stats.totals.hotLeads, icon: Zap, color: 'text-red-600 bg-red-50', change: '+8%' },
    { label: 'Shopify Stores', value: stats.totals.shopifyLeads, icon: Globe, color: 'text-green-600 bg-green-50', change: '+15%' },
    { label: 'Contacted', value: stats.totals.contactedLeads, icon: Users, color: 'text-purple-600 bg-purple-50', change: '+5%' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track your lead generation pipeline
          </p>
        </div>
        <Link 
          href="/search"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Find Leads
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  {kpi.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">{kpi.value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            Lead Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.scoreDistribution}>
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.scoreDistribution.map((_, i) => (
                  <Cell key={i} fill={SCORE_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            Platform Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={stats.byPlatform}
                dataKey="count"
                nameKey="platform"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {stats.byPlatform.map((entry, i) => (
                  <Cell 
                    key={i} 
                    fill={PLATFORM_COLORS[entry.platform] || '#94a3b8'} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value, name) => [value, capitalizeFirst(name as string)]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {stats.byPlatform.map(item => (
              <div key={item.platform} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{getPlatformIcon(item.platform)}</span>
                <span className="capitalize">{item.platform}</span>
                <span className="font-medium text-foreground">({item.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Country breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            Leads by Country
          </h3>
          <div className="space-y-2.5">
            {stats.byCountry.map((item) => {
              const maxCount = Math.max(...stats.byCountry.map(c => c.count));
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.country}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-1.5">
                      <span>{getCountryFlag(item.country)}</span>
                      <span className="capitalize text-foreground">{item.country}</span>
                    </span>
                    <span className="font-medium text-foreground">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {stats.byCountry.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent leads + Industries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Recent Leads</h3>
            <Link href="/leads" className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No leads yet. <Link href="/search" className="text-blue-600 hover:underline">Find some!</Link></p>
              </div>
            ) : (
              stats.recentLeads.map((lead: any) => (
                <Link 
                  key={lead.id} 
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-3 hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(lead.company_name || lead.website || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {lead.company_name || lead.website}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>{getCountryFlag(lead.country)}</span>
                      <span className="capitalize">{lead.platform || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <ScoreBadge score={lead.score} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top Industries */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Top Industries</h3>
          <div className="space-y-3">
            {stats.byIndustry.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No industry data yet</p>
            ) : (
              stats.byIndustry.map((item, idx) => (
                <div key={item.industry} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">
                    {getIndustryEmoji(item.industry)}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium capitalize">{item.industry?.replace(/-/g, ' ')}</span>
                      <span className="text-muted-foreground">{item.count} leads</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                        style={{ width: `${Math.max(10, (item.count / (stats.byIndustry[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick actions */}
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3 font-medium">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/search" className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium">
                <Zap className="w-3 h-3" />
                Find Leads
              </Link>
              <Link href="/audit" className="flex items-center gap-2 text-xs bg-orange-50 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors font-medium">
                <BarChart2 className="w-3 h-3" />
                Audit Site
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Avg score card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-blue-100 text-sm font-medium">Average Lead Score</div>
            <div className="text-5xl font-bold mt-1">{stats.avgScore}</div>
            <div className="text-blue-200 text-sm mt-1">out of 100 — Higher = More Need for Services</div>
          </div>
          <div className="text-right">
            <TrendingUp className="w-12 h-12 text-blue-300 mb-2" />
            <div className="text-sm text-blue-100">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              {stats.totals.hotLeads} hot leads ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-red-100 text-red-700' :
                score >= 60 ? 'bg-orange-100 text-orange-700' :
                score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700';
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {score}
    </span>
  );
}

function getIndustryEmoji(industry: string): string {
  const map: Record<string, string> = {
    fashion: '👗', jewelry: '💎', beauty: '💄', health: '💊',
    electronics: '📱', 'home-decor': '🏠', furniture: '🪑',
    food: '🍕', sports: '⚽', automotive: '🚗',
  };
  return map[industry] || '🏪';
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-muted rounded shimmer" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl shimmer" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-56 bg-muted rounded-xl shimmer" />
        ))}
      </div>
    </div>
  );
}
