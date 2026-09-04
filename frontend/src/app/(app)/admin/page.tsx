import type { Metadata } from 'next';
import { AdminDashboardPage } from '@/components/admin/admin-dashboard-page';

export const metadata: Metadata = { title: 'Admin Dashboard' };

export default function AdminRoute() {
  return <AdminDashboardPage />;
}
