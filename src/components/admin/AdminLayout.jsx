import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { CalendarDays, List, MessageSquare, Home } from 'lucide-react';

const navItems = [
  { path: '/admin', icon: List, label: 'Reservas' },
  { path: '/admin/messages', icon: MessageSquare, label: 'Mensagens' },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-heading text-lg font-semibold">Ericeira Wave House</Link>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Admin</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
          <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted ml-2">
            <Home className="w-4 h-4" /> Site
          </Link>
        </nav>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}