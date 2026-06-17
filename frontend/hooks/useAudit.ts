import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auditApi } from '@/lib/api';
import { AuditResult } from '@/types';
import toast from 'react-hot-toast';

export function useAudit() {
  const qc = useQueryClient();
  const [result, setResult] = useState<AuditResult | null>(null);

  const mutation = useMutation({
    mutationFn: ({ url, leadId }: { url: string; leadId?: string }) =>
      auditApi.run(url, leadId),
    onSuccess: (data, { leadId }) => {
      setResult(data);
      if (leadId) {
        qc.invalidateQueries({ queryKey: ['lead', leadId] });
        qc.invalidateQueries({ queryKey: ['leads'] });
      }
      toast.success('Audit complete!');
    },
    onError: (e: any) => toast.error(e.message || 'Audit failed'),
  });

  return {
    runAudit: (url: string, leadId?: string) => mutation.mutate({ url, leadId }),
    result,
    clearResult: () => setResult(null),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
