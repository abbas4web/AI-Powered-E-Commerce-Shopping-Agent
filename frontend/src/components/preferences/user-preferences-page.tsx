'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { UserPreferences, UpdatePreferencesRequest } from '@smartshop/shared';

export function UserPreferencesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => apiClient.get<UserPreferences>('/preferences'),
  });

  const { register, handleSubmit, reset } = useForm<UpdatePreferencesRequest>();

  useEffect(() => {
    if (data) {
      reset({
        budgetMin: data.budgetMin ?? undefined,
        budgetMax: data.budgetMax ?? undefined,
        performancePreference: data.performancePreference ?? undefined,
        batteryPreference: data.batteryPreference ?? undefined,
        cameraPreference: data.cameraPreference ?? undefined,
        designPreference: data.designPreference ?? undefined,
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: UpdatePreferencesRequest) =>
      apiClient.put<UserPreferences>('/preferences', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast({ title: 'Preferences saved' });
    },
    onError: (err: Error) => {
      toast({ variant: 'destructive', title: 'Failed to save', description: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Preferences</h1>
        <p className="text-sm text-muted-foreground">
          These help the AI personalise recommendations for you.
        </p>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
        {/* Budget */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Default budget (₹)</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="budgetMin">Minimum</Label>
              <Input
                id="budgetMin"
                type="number"
                placeholder="e.g. 20000"
                {...register('budgetMin', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budgetMax">Maximum</Label>
              <Input
                id="budgetMax"
                type="number"
                placeholder="e.g. 80000"
                {...register('budgetMax', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Preference sliders — rendered as number inputs for Phase 1 */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Priority ratings (1 = low, 5 = high)</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'performancePreference', label: 'Performance' },
              { id: 'batteryPreference', label: 'Battery life' },
              { id: 'cameraPreference', label: 'Camera quality' },
              { id: 'designPreference', label: 'Design / Build' },
            ].map(({ id, label }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={id}>{label}</Label>
                <Input
                  id={id}
                  type="number"
                  min={1}
                  max={5}
                  placeholder="1–5"
                  {...register(id as keyof UpdatePreferencesRequest, { valueAsNumber: true })}
                />
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save preferences
        </Button>
      </form>
    </div>
  );
}
