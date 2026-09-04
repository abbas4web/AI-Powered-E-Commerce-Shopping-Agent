import type { Metadata } from 'next';
import { UserPreferencesPage } from '@/components/preferences/user-preferences-page';

export const metadata: Metadata = { title: 'Preferences' };

export default function PreferencesRoute() {
  return <UserPreferencesPage />;
}
