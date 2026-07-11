import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle2, Clock, Mail, Home, Waves, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const [pending, unread] = await Promise.all([
        supabase.from('bookings').select('*').eq('status', 'pending').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('contact_messages').select('*').eq('read', false).is('deleted_at', null).order('created_at', { ascending: false }),
      ]);

      return {
        pendingBookings: pending.data || [],
        unreadMessages: unread.data || [],
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

  const { pendingBookings, unreadMessages } = data;
  const allClear = pendingBookings.length === 0 && unreadMessages.length === 0;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-heading text-2xl font-semibold mb-8">Visão Geral</h1>

      {allClear ? (
        <div className="flex flex-col items-center justify-center text-center py-24 bg-card border border-border rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="font-heading text-lg font-semibold">Tudo em ordem</p>
          <p className="text-sm text-muted-foreground mt-1">Sem reservas pendentes nem mensagens por ler.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pendingBookings.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Reservas pendentes ({pendingBookings.length})
              </h2>
              <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
                {pendingBookings.map((b) => (
                  <Link
                    key={b.id}
                    to="/admin/bookings"
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                      {b.type === 'accommodation' ? <Home className="w-4 h-4 text-amber-600" /> : <Waves className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.guest_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {b.type === 'accommodation'
                          ? `${b.check_in ? format(new Date(b.check_in), 'dd/MM') : '?'} → ${b.check_out ? format(new Date(b.check_out), 'dd/MM') : '?'}`
                          : b.surf_date ? format(new Date(b.surf_date), 'dd/MM/yyyy') : 'Aula de surf'}
                      </p>
                    </div>
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {unreadMessages.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Mensagens novas ({unreadMessages.length})
              </h2>
              <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
                {unreadMessages.map((m) => (
                  <Link
                    key={m.id}
                    to="/admin/messages"
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.subject || m.message}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
