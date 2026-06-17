'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Search, Database, BarChart2,
  Mail, Settings, Target, Zap, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Lead Database', icon: Database },
  { href: '/search', label: 'Find Leads', icon: Search },
  { href: '/audit', label: 'Website Audit', icon: BarChart2 },
  { href: '/outreach', label: 'Outreach', icon: Mail },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white',
        'flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-none">CommerceLead</div>
            <div className="text-slate-400 text-xs mt-0.5">Finder Pro</div>
          </div>
          <button 
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {item.href === '/leads' && (
                  <span className="ml-auto bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                    DB
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom notice */}
        <div className="px-4 py-3 border-t border-slate-700">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-semibold text-white">GDPR Compliant</span>
            </div>
            <p className="text-xs text-slate-400 leading-tight">
              Only publicly available data is collected.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-background flex items-center px-4 gap-3 flex-shrink-0">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground p-1 rounded"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="hidden sm:inline">API Connected</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
