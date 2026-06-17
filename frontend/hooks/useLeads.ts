import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { SearchFilters, Lead } from '@/types';
import toast from 'react-hot-toast';

export function useLeads(initialFilters?: Partial<SearchFilters>) {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    country: 'all',
    platform: 'all',
    industry: 'all',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'DESC',
    page: 1,
    limit: 20,
    ...initialFilters,
  });

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadsApi.list(filters),
    placeholderData: (prev: any) => prev,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      leadsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => leadsApi.bulkDelete(ids),
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      toast.success(`Deleted ${ids.length} lead(s)`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key !== 'page' ? 1 : (value as number) }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '', country: 'all', platform: 'all', industry: 'all',
      status: 'all', sortBy: 'created_at', sortOrder: 'DESC', page: 1, limit: 20,
    });
  }, []);

  return {
    leads: (data?.leads || []) as Lead[],
    total: data?.total || 0,
    pages: data?.pages || 1,
    isLoading,
    isFetching,
    error,
    filters,
    updateFilter,
    resetFilters,
    updateLead: (id: string, data: Partial<Lead>) => updateMutation.mutate({ id, data }),
    deleteLeads: (ids: string[]) => deleteMutation.mutate(ids),
    isDeleting: deleteMutation.isPending,
  };
}

export function useLead(id: string) {
  return useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(id),
    enabled: !!id,
  });
}
