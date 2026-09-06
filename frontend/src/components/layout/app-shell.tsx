'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Search,
  Heart,
  Star,
  MessageSquare,
  Settings,
  LayoutDashboard,
  GitCompare,
  Moon,
  Sun,
  LogOut,
  User,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api-client';

const navItems = [
  { href: '/assistant', label: 'AI Assistant', icon: Sparkles },
  { href: '/products', label: 'Products', icon: Search },
  { href: '/recommendations', label: 'Recommendations', icon: Star },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/conversations', label: 'Conversations', icon: MessageSquare },
];

const bottomNavItems = [
  { href: '/preferences', label: 'Preferences', icon: Settings },
  { href: '/admin', label: 'Admin', icon: LayoutDashboard, adminOnly: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore errors — clear state regardless
    }
    logout();
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '??';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-card shrink-0">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 px-4 border-b">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <span className="font-semibold text-base">SmartShop AI</span>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <Separator />

        {/* Bottom nav */}
        <div className="px-2 py-3 space-y-0.5">
          {bottomNavItems.map(({ href, label, icon: Icon, adminOnly }) => {
            if (adminOnly && user?.role !== 'ADMIN') return null;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>

        <Separator />

        {/* User section */}
        <div className="p-3 space-y-1">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Profile"
              asChild
            >
              <Link href="/preferences">
                <User className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-auto"
              aria-label="Sign out"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex h-14 items-center border-b px-4 gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">SmartShop AI</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
