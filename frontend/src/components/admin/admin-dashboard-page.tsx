'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Users,
  MessageSquare,
  Star,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

interface AdminStats {
  totalProducts: number;
  totalUsers: number;
  totalConversations: number;
  totalRecommendations: number;
}

export function AdminDashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient.get<AdminStats>('/admin/stats'),
    enabled: user?.role === 'ADMIN',
    retry: false,
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-6 py-20 text-center space-y-3">
        <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <h2 className="text-lg font-semibold">Access restricted</h2>
        <p className="text-sm text-muted-foreground">
          You need admin privileges to view this page.
        </p>
      </div>
    );
  }

  const stats = [
    { label: 'Products', value: data?.totalProducts, icon: Package },
    { label: 'Users', value: data?.totalUsers, icon: Users },
    { label: 'Conversations', value: data?.totalConversations, icon: MessageSquare },
    { label: 'Recommendations', value: data?.totalRecommendations, icon: Star },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and management</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {value?.toLocaleString() ?? '—'}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder sections for Phase 15 */}
      <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
        <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto" />
        <p className="text-sm text-muted-foreground">
          Detailed analytics, product management, and user management panels will be built in Phase 15.
        </p>
      </div>
    </div>
  );
}
