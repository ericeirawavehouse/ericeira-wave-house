import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { List, CalendarDays, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
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
        .order('created_at', { ascending: false }); // No Supabase usamos created_at
      
      if (error) throw error;
      return data;
    },
  });

  // 3. MUTATION PARA ATUALIZAR STATUS (Aprovar/Rejeitar)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from('bookings')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }),
  });

  const filteredBookings = bookings.filter((b) => {
    if (typeFilter !== 'all' && b.type !== typeFilter) return false;
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    return true;
  });

  const handleApprove = async (booking) => {
    updateMutation.mutate({ id: booking.id, data: { status: 'confirmed' } });
    toast({ title: 'Reserva confirmada!' });

    // Nota: O envio de email via base44.integrations não funcionará no Vercel.
    // Podes implementar EmailJS aqui mais tarde.
    console.log(`Link de Check-in para o cliente: ${window.location.origin}/checkin?booking=${booking.id}`);
  };

  const handleReject = (booking) => {
    updateMutation.mutate({ id: booking.id, data: { status: 'rejected' } });
    toast({ title: 'Reserva rejeitada.' });
  };

  const handleSendCheckIn = (booking) => {
    const checkInUrl = `${window.location.origin}/checkin?booking=${booking.id}`;
    // Sugestão: Copiar para a área de transferência ou usar mailto:
    navigator.clipboard.writeText(checkInUrl);
    toast({ title: 'Link de check-in copiado para a área de transferência!' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ... (O JSX permanece igual ao que tinhas)
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-2xl font-semibold">Reservas</h1>
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
          onSendCheckIn={handleSendCheckIn} 
        />
      ) : (
        <BookingCalendarView bookings={filteredBookings} />
      )}
    </div>
  );
}