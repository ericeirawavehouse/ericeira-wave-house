import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { format, startOfMonth } from 'date-fns';
import { CalendarCheck, MessageSquare, Trash2, Clock, Home, Waves, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      const [pending, unread, confirmedThisMonth, trashCount, recentBookings] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('deleted_at', null),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('read', false).is('deleted_at', null),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').gte('created_at', monthStart).is('deleted_at', null),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).not('deleted_at', 'is', null),
        supabase.from('bookings').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
      ]);

      return {
        pending: pending.count || 0,
        unread: unread.count || 0,
        confirmedThisMonth: confirmedThisMonth.count || 0,
        trashCount: trashCount.count || 0,
        recentBookings: recentBookings.data || [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
  };
  const statusLabels = { pending: 'Pendente', confirmed: 'Confirmada', rejected: 'Rejeitada' };

  const cards = [
    { label: 'Reservas pendentes', value: data.pending, icon: Clock, to: '/admin/bookings', tint: 'text-amber-600 bg-amber-50' },
    { label: 'Mensagens novas', value: data.unread, icon: MessageSquare, to: '/admin/messages', tint: 'text-primary bg-primary/10' },
    { label: 'Confirmadas este mês', value: data.confirmedThisMonth, icon: CalendarCheck, to: '/admin/bookings', tint: 'text-emerald-600 bg-emerald-50' },
    { label: 'No lixo', value: data.trashCount, icon: Trash2, to: '/admin/trash', tint: 'text-muted-foreground bg-muted' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-heading text-2xl font-semibold mb-1">Visão Geral</h1>
      <p className="text-sm text-muted-foreground mb-8">Resumo rápido da atividade da Ericeira Wave House</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${card.tint}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-heading font-semibold">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-heading text-base font-semibold">Reservas recentes</h2>
          <Link to="/admin/bookings" className="text-sm text-primary hover:underline">Ver todas</Link>
        </div>
        {data.recentBookings.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">Ainda sem reservas</p>
        ) : (
          <div className="divide-y divide-border">
            {data.recentBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-6 py-3.5">
                {b.type === 'accommodation' ? <Home className="w-4 h-4 text-primary shrink-0" /> : <Waves className="w-4 h-4 text-secondary shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.guest_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.guest_email}</p>
                </div>
                <span className={`text-xs border rounded-full px-2.5 py-0.5 shrink-0 ${statusColors[b.status]}`}>
                  {statusLabels[b.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
