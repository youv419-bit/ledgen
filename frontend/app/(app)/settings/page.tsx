'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Settings, Shield, Database, Globe, Key, Info,
  ExternalLink, CheckCircle, RefreshCw, Trash2, Download
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(API_URL);
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [scraperApiKey, setScraperApiKey] = useState('');
  const [serpApiKey, setSerpApiKey] = useState('');

  const checkApiHealth = async () => {
    setApiStatus('checking');
    try {
      const res = await fetch(`${apiUrl}/health`);
      if (res.ok) {
        setApiStatus('ok');
        toast.success('API is healthy!');
      } else {
        setApiStatus('error');
        toast.error('API returned an error');
      }
    } catch {
      setApiStatus('error');
      toast.error('Cannot reach API server');
    }
  };

  const sections = [
    {
      id: 'connection',
      title: 'API Connection',
      icon: <Globe className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Backend API URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={checkApiHealth}
                className="flex items-center gap-1.5 border border-border px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
              >
                {apiStatus === 'checking' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : apiStatus === 'ok' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Test
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Set <code className="bg-muted px-1 rounded">NEXT_PUBLIC_API_URL</code> in your .env.local file
            </p>
          </div>
          <StatusIndicator
            label="API Status"
            status={apiStatus === 'ok' ? 'connected' : apiStatus === 'error' ? 'error' : 'unknown'}
          />
        </div>
      ),
    },
    {
      id: 'apikeys',
      title: 'Search API Keys (Optional)',
      icon: <Key className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <Info className="w-4 h-4 inline mr-1.5 mb-0.5" />
            These keys enable real-time web search for leads. Without them, demo data is used.
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">SerpAPI Key</label>
            <input
              type="password"
              value={scraperApiKey}
              onChange={e => setScraperApiKey(e.target.value)}
              placeholder="Enter your SerpAPI key"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get a key at <a href="https://serpapi.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">serpapi.com <ExternalLink className="w-2.5 h-2.5" /></a>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">ScraperAPI Key</label>
            <input
              type="password"
              value={serpApiKey}
              onChange={e => setSerpApiKey(e.target.value)}
              placeholder="Enter your ScraperAPI key"
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get a key at <a href="https://scraperapi.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">scraperapi.com <ExternalLink className="w-2.5 h-2.5" /></a>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            ⚠️ Store API keys in your backend <code className="bg-muted px-1 rounded">.env</code> file, not in the frontend.
          </p>
        </div>
      ),
    },
    {
      id: 'compliance',
      title: 'GDPR & Compliance',
      icon: <Shield className="w-4 h-4" />,
      content: (
        <div className="space-y-3">
          {[
            { label: 'robots.txt Compliance', status: true, desc: 'All crawls check and respect robots.txt' },
            { label: 'Public Data Only', status: true, desc: 'Only publicly accessible information is collected' },
            { label: 'No Private Scraping', status: true, desc: 'No authentication bypass or private data access' },
            { label: 'Data Retention', status: true, desc: 'Leads stored locally in your SQLite database' },
            { label: 'GDPR Notice', status: true, desc: 'Compliance notice shown at /api/compliance endpoint' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-border">
            <a
              href={`${API_URL}/api/compliance`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View compliance notice <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 'database',
      title: 'Database',
      icon: <Database className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted rounded-lg p-3">
              <div className="text-muted-foreground text-xs mb-1">Database Type</div>
              <div className="font-medium">SQLite (better-sqlite3)</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-muted-foreground text-xs mb-1">Location</div>
              <div className="font-medium font-mono text-xs">./data/commercelead.db</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`${API_URL}/api/export/csv`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm border border-border px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" /> Export All Leads CSV
            </a>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <strong>⚠️ Backup:</strong> Regularly backup your <code>data/commercelead.db</code> file to avoid data loss.
          </div>
        </div>
      ),
    },
    {
      id: 'deployment',
      title: 'Deployment Guide',
      icon: <Globe className="w-4 h-4" />,
      content: (
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Frontend → Vercel</h4>
            <ol className="space-y-1.5 text-muted-foreground list-decimal ml-4">
              <li>Push frontend folder to GitHub</li>
              <li>Import project in Vercel dashboard</li>
              <li>Set root directory to <code className="bg-muted px-1 rounded">frontend</code></li>
              <li>Add env variable: <code className="bg-muted px-1 rounded">NEXT_PUBLIC_API_URL=https://your-backend.onrender.com</code></li>
              <li>Deploy!</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Backend → Render (Free Tier)</h4>
            <ol className="space-y-1.5 text-muted-foreground list-decimal ml-4">
              <li>Push backend folder to GitHub</li>
              <li>Create new Web Service in Render</li>
              <li>Set build command: <code className="bg-muted px-1 rounded">npm install</code></li>
              <li>Set start command: <code className="bg-muted px-1 rounded">npm start</code></li>
              <li>Add env variables from <code className="bg-muted px-1 rounded">.env.example</code></li>
              <li>Set FRONTEND_URL to your Vercel URL</li>
            </ol>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> On Render free tier, the server sleeps after inactivity. Use UptimeRobot to keep it awake with free monitoring pings.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Configure CommerceLead Finder</p>
      </div>

      {sections.map(section => (
        <div key={section.id} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/30">
            <span className="text-muted-foreground">{section.icon}</span>
            <h2 className="font-semibold text-sm">{section.title}</h2>
          </div>
          <div className="p-5">
            {section.content}
          </div>
        </div>
      ))}

      {/* Version info */}
      <div className="text-center text-xs text-muted-foreground py-3 border-t border-border">
        CommerceLead Finder v1.0.0 &nbsp;·&nbsp; Built with Next.js, Express.js, SQLite
        &nbsp;·&nbsp; 100% Free Stack
      </div>
    </div>
  );
}

function StatusIndicator({ label, status }: { label: string; status: 'connected' | 'error' | 'unknown' }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
        status === 'connected' ? 'bg-green-500' :
        status === 'error' ? 'bg-red-500' :
        'bg-gray-400'
      }`} />
      <span>{label}:</span>
      <span className={`font-medium ${
        status === 'connected' ? 'text-green-600' :
        status === 'error' ? 'text-red-600' :
        'text-muted-foreground'
      }`}>
        {status === 'connected' ? 'Connected' : status === 'error' ? 'Error' : 'Unknown'}
      </span>
    </div>
  );
}
