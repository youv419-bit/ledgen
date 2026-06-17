import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-red-600 bg-red-50 border-red-200';
  if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (score >= 20) return 'text-blue-600 bg-blue-50 border-blue-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Hot Lead';
  if (score >= 60) return 'Warm Lead';
  if (score >= 40) return 'Potential';
  if (score >= 20) return 'Cold Lead';
  return 'Low Priority';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-red-500';
  if (score >= 60) return 'bg-orange-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-blue-500';
  return 'bg-gray-400';
}

export function getPlatformColor(platform: string): string {
  switch (platform?.toLowerCase()) {
    case 'shopify': return 'bg-green-100 text-green-700 border-green-200';
    case 'wordpress': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'woocommerce': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export function getPlatformIcon(platform: string): string {
  switch (platform?.toLowerCase()) {
    case 'shopify': return '🛍️';
    case 'wordpress': return '📝';
    case 'woocommerce': return '🛒';
    default: return '🌐';
  }
}

export function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    usa: '🇺🇸', uk: '🇬🇧', germany: '🇩🇪', australia: '🇦🇺', canada: '🇨🇦',
  };
  return flags[country?.toLowerCase()] || '🌍';
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-600 bg-red-50';
    case 'warning': return 'text-orange-600 bg-orange-50';
    case 'info': return 'text-blue-600 bg-blue-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical': return '🔴';
    case 'warning': return '🟡';
    case 'info': return '🔵';
    default: return '⚪';
  }
}

export function formatDate(date: string): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });
}

export function formatDomain(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}
