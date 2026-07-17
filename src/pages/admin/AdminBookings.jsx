import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { List, CalendarDays, Loader2 } from 'lucide-react';
import { differenceInCalendarDays, parseISO, addDays } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import BookingListView from '../../components/admin/BookingListView';
import BookingCalendarView from '../../components/admin/BookingCalendarView';

export default function AdminBookings() {
  const [view, setView] = useState('list');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  // 2. BUSCA DE RESERVAS NO SUPABASE
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }); // No Supabase usamos created_at

      if (error) throw error;
      return data;
    },
  });

  // Pedidos de pacotes de surf - tratados como "reservas" de Surf, junto com as aulas
  const { data: packagePurchases = [], isLoading: isLoadingPackages } = useQuery({
    queryKey: ['admin-package-purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surf_package_purchases')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // 3. MUTATION PARA ATUALIZAR STATUS (Aprovar/Rejeitar)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, table }) => {
      const { error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-package-purchases'] });
    },
  });

  const normalizedPackages = packagePurchases.map((p) => ({
    id: p.id,
    _table: 'surf_package_purchases',
    type: 'surf_package',
    guest_name: p.guest_name,
    guest_email: p.guest_email,
    guest_phone: p.guest_phone,
    status: p.status,
    created_at: p.created_at,
    deleted_at: p.deleted_at,
    package_name: p.package_name,
    package_name_en: p.package_name_en,
    lessons_total: p.lessons_total,
    lessons_used: p.lessons_used,
    price_total: p.price_total,
    payment_received_at: p.payment_received_at,
    confirmed_at: p.confirmed_at,
    rejected_at: p.rejected_at,
    lang: p.lang,
    validity_days: p.validity_days,
    expires_at: p.expires_at,
  }));
  const normalizedBookings = bookings.map((b) => ({ ...b, _table: 'bookings' }));
  const allItems = [...normalizedBookings, ...normalizedPackages].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const filteredBookings = allItems.filter((b) => {
    if (typeFilter === 'accommodation' && b.type !== 'accommodation') return false;
    if (typeFilter === 'surf' && b.type !== 'surf' && b.type !== 'surf_package') return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    return true;
  });

  const handleApprove = async (booking) => {
    const now = new Date();
    const confirmData = { status: 'confirmed', confirmed_at: now.toISOString() };
    if (booking.type === 'surf_package' && booking.validity_days) {
      confirmData.expires_at = addDays(now, booking.validity_days).toISOString();
    }
    updateMutation.mutate({ id: booking.id, table: booking._table, data: confirmData });

    if (booking.type === 'surf_package') {
      toast({ title: 'Pacote confirmado!' });
      fetch('/api/send-booking-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: booking.guest_email,
          guestName: booking.guest_name,
          type: 'surf_package',
          packageName: booking.package_name,
          packageNameEn: booking.package_name_en,
          lessonsTotal: booking.lessons_total,
          priceTotal: booking.price_total,
          expiresAt: confirmData.expires_at,
          lang: booking.lang || 'pt',
        }),
      }).catch((err) => console.error('Erro ao enviar email de confirmação:', err));
      return;
    }

    toast({ title: 'Reserva confirmada!' });

    const nights = booking.check_in && booking.check_out
      ? differenceInCalendarDays(parseISO(booking.check_out), parseISO(booking.check_in))
      : null;

    fetch('/api/send-booking-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: booking.guest_email,
        guestName: booking.guest_name,
        type: booking.type,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        nights,
        surfDate: booking.surf_date,
        isPrivate: booking.is_private,
        guestsCount: booking.guests_count,
        childrenCount: booking.children_count,
        priceSubtotal: booking.price_subtotal,
        discountAmount: booking.discount_amount,
        discountLabel: booking.discount_label,
        priceTotal: booking.price_total,
        lang: booking.lang || 'pt',
      }),
    }).catch((err) => console.error('Erro ao enviar email de confirmação:', err));
  };

  const handleReject = (booking) => {
    updateMutation.mutate({ id: booking.id, table: booking._table, data: { status: 'rejected', rejected_at: new Date().toISOString() } });
    toast({ title: booking.type === 'surf_package' ? 'Pedido de pacote rejeitado.' : 'Reserva rejeitada.' });
  };

  const handleDelete = (booking) => {
    updateMutation.mutate({ id: booking.id, table: booking._table, data: { deleted_at: new Date().toISOString() } });
    toast({
      title: booking.type === 'surf_package' ? 'Pedido movido para o lixo.' : 'Reserva movida para o lixo.',
      action: (
        <ToastAction altText="Desfazer" onClick={() => updateMutation.mutate({ id: booking.id, table: booking._table, data: { deleted_at: null } })}>
          Desfazer
        </ToastAction>
      ),
    });
  };

  if (isLoading || isLoadingPackages) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Reservas</h1>
          <p className="text-sm text-muted-foreground mt-1">{filteredBookings.length} {filteredBookings.length === 1 ? 'reserva' : 'reservas'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="accommodation">Alojamento</SelectItem>
              <SelectItem value="surf">Surf</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="rejected">Rejeitadas</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex bg-muted rounded-lg p-1">
            <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('list')}>
              <List className="w-4 h-4 mr-1" /> Lista
            </Button>
            <Button variant={view === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setView('calendar')}>
              <CalendarDays className="w-4 h-4 mr-1" /> Calendário
            </Button>
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <BookingListView
          bookings={filteredBookings}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
        />
      ) : (
        <BookingCalendarView bookings={filteredBookings} />
      )}
    </div>
  );
}