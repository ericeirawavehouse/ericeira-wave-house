import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { LayoutDashboard, CalendarCheck, MessageSquare, Trash2, Home, LogOut, Menu, X, Waves } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const { data: counts } = useQuery({
    queryKey: ['admin-nav-counts'],
    queryFn: async () => {
      const [pending, pendingPackages, unread] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('deleted_at', null),
        supabase.from('surf_package_purchases').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('deleted_at', null),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('read', false).is('deleted_at', null),
      ]);
      return { pending: (pending.count || 0) + (pendingPackages.count || 0), unread: unread.count || 0 };
    },
    refetchInterval: 60000,
  });

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Visão Geral', exact: true },
    { path: '/admin/bookings', icon: CalendarCheck, label: 'Reservas', badge: counts?.pending },
    { path: '/admin/messages', icon: MessageSquare, label: 'Mensagens', badge: counts?.unread },
    { path: '/admin/pricing/accommodation', icon: Home, label: 'Alojamento' },
    { path: '/admin/pricing/surf', icon: Waves, label: 'Surf' },
    { path: '/admin/trash', icon: Trash2, label: 'Lixo' },
  ];

  const isActive = (item) => (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path));

  const NavLinks = ({ onNavigate }) => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isActive(item)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <item.icon className="w-4 h-4" />
            {item.label}
          </span>
          {!!item.badge && (
            <span
              className={`text-[11px] font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center ${
                isActive(item) ? 'bg-white/25 text-white' : 'bg-primary text-primary-foreground'
              }`}
            >
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-card border-r border-border p-5">
        <div className="mb-8">
          <Link to="/" className="font-heading text-lg font-semibold leading-tight block">Ericeira Wave House</Link>
          <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium inline-block mt-2">Admin</span>
        </div>
        <nav className="flex-1 space-y-1">
          <NavLinks />
        </nav>
        <div className="pt-4 mt-4 border-t border-border space-y-1">
          <Link to="/" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Home className="w-4 h-4" /> Ver site
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="md:hidden bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="font-heading text-base font-semibold">Ericeira Wave House</Link>
        <button onClick={() => setMobileOpen((o) => !o)} className="p-2 -mr-2 text-muted-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>
      {mobileOpen && (
        <nav className="md:hidden bg-card border-b border-border px-4 py-3 space-y-1 sticky top-[57px] z-40">
          <NavLinks onNavigate={() => setMobileOpen(false)} />
          <div className="pt-2 mt-2 border-t border-border space-y-1">
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted">
              <Home className="w-4 h-4" /> Ver site
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </nav>
      )}

      <main className="flex-1 p-5 md:p-8 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
