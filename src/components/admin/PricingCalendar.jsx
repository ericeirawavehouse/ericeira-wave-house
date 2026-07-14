import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { priceForDate, findSingleDayOverride } from '@/lib/pricing';

export default function PricingCalendar({ settings, periods }) {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingDay, setEditingDay] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const padDays = startDay === 0 ? 6 : startDay - 1;

  const { data: confirmedBookings = [] } = useQuery({
    queryKey: ['confirmed-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('type', 'accommodation')
        .eq('status', 'confirmed')
        .is('deleted_at', null);
      if (error) throw error;
      return data;
    },
  });

  const { data: externalBlocks = [] } = useQuery({
    queryKey: ['external-calendar-blocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_calendar_blocks')
        .select('id, source, start_date, end_date');
      if (error) throw error;
      return data;
    },
  });

  const bookedDates = new Set(
    confirmedBookings.flatMap((b) => {
      if (!b.check_in || !b.check_out) return [];
      return eachDayOfInterval({ start: parseISO(b.check_in), end: parseISO(b.check_out) }).map((d) => format(d, 'yyyy-MM-dd'));
    })
  );

  const blockMutation = useMutation({
    mutationFn: async (block) => {
      const dateStr = format(editingDay, 'yyyy-MM-dd');
      if (block) {
        const { error } = await supabase.from('external_calendar_blocks').insert([{
          source: 'manual', uid: `manual-${dateStr}`, start_date: dateStr, end_date: dateStr,
        }]);
        if (error) throw error;
      } else {
        const manualBlock = externalBlocks.find((b) => b.source === 'manual' && b.start_date === dateStr && b.end_date === dateStr);
        if (!manualBlock) return;
        const { error } = await supabase.from('external_calendar_blocks').delete().eq('id', manualBlock.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, block) => {
      queryClient.invalidateQueries({ queryKey: ['external-calendar-blocks'] });
      toast({ title: block ? 'Data bloqueada!' : 'Data desbloqueada!' });
    },
    onError: (error) => {
      console.error('Erro ao bloquear/desbloquear data:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o bloqueio.' });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const dateStr = format(editingDay, 'yyyy-MM-dd');
      const existing = findSingleDayOverride(editingDay, periods);
      const price = parseFloat(editPrice) || 0;

      if (existing) {
        const { error } = await supabase
          .from('pricing_periods')
          .update({ price_per_night: price })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pricing_periods')
          .insert([{ name: `Preço diário ${dateStr}`, start_date: dateStr, end_date: dateStr, price_per_night: price }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-periods'] });
      toast({ title: 'Preço do dia guardado!' });
      setEditingDay(null);
    },
    onError: (error) => {
      console.error('Erro ao guardar preço do dia:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível guardar.' });
    },
  });

  const removeOverrideMutation = useMutation({
    mutationFn: async () => {
      const existing = findSingleDayOverride(editingDay, periods);
      if (!existing) return;
      const { error } = await supabase.from('pricing_periods').delete().eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-periods'] });
      toast({ title: 'Preço personalizado removido.' });
      setEditingDay(null);
    },
  });

  const openDay = (day) => {
    setEditingDay(day);
    setEditPrice(String(priceForDate(day, settings, periods)));
  };

  const existingOverride = editingDay ? findSingleDayOverride(editingDay, periods) : null;
  const editingDayStr = editingDay ? format(editingDay, 'yyyy-MM-dd') : null;
  const isEditingDayBooked = editingDayStr ? bookedDates.has(editingDayStr) : false;
  const editingDayManualBlock = editingDayStr
    ? externalBlocks.find((b) => b.source === 'manual' && b.start_date === editingDayStr && b.end_date === editingDayStr)
    : null;
  const editingDayAirbnbBlock = editingDayStr
    ? externalBlocks.find((b) => b.source === 'airbnb' && editingDayStr >= b.start_date && editingDayStr <= b.end_date)
    : null;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-heading text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: pt })}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
        {Array(padDays).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const price = priceForDate(day, settings, periods);
          const hasOverride = !!findSingleDayOverride(day, periods);
          const isToday = isSameDay(day, new Date());
          const dayStr = format(day, 'yyyy-MM-dd');
          const isBooked = bookedDates.has(dayStr);
          const manualBlock = externalBlocks.find((b) => b.start_date === dayStr && b.end_date === dayStr && b.source === 'manual');
          const airbnbBlock = externalBlocks.find((b) => b.source === 'airbnb' && dayStr >= b.start_date && dayStr <= b.end_date);
          const isBlocked = !!manualBlock || !!airbnbBlock;
          return (
            <button
              key={day.toISOString()}
              onClick={() => openDay(day)}
              className={`relative min-h-[64px] p-2 rounded-xl border text-left transition-colors hover:border-primary ${
                isToday ? 'border-primary' : 'border-border'
              } ${isBooked ? 'bg-red-50' : isBlocked ? 'bg-amber-50' : hasOverride ? 'bg-primary/5' : 'bg-transparent'}`}
            >
              {(isBooked || isBlocked) && (
                <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${isBooked ? 'bg-red-500' : 'bg-amber-500'}`} />
              )}
              <p className="text-xs font-medium text-foreground/70">{format(day, 'd')}</p>
              <p className={`text-xs mt-1 font-semibold ${hasOverride ? 'text-primary' : 'text-muted-foreground'}`}>
                €{price}
              </p>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Reservado</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Bloqueado</span>
      </div>

      <Dialog open={!!editingDay} onOpenChange={(open) => !open && setEditingDay(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingDay && format(editingDay, "d 'de' MMMM yyyy", { locale: pt })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Preço por noite (€)</Label>
              <Input type="number" min="0" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full rounded-full">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Guardar preço deste dia
            </Button>
            {existingOverride && (
              <Button
                variant="ghost"
                onClick={() => removeOverrideMutation.mutate()}
                disabled={removeOverrideMutation.isPending}
                className="w-full text-muted-foreground"
              >
                Remover preço personalizado (voltar ao padrão)
              </Button>
            )}

            <div className="border-t border-border pt-4">
              {isEditingDayBooked ? (
                <p className="text-xs text-muted-foreground">Este dia já está reservado por um hóspede, não pode ser bloqueado/desbloqueado aqui.</p>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm block">Bloquear esta data</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {editingDayAirbnbBlock
                        ? 'Também está bloqueado pelo calendário do Airbnb.'
                        : 'Impede novas reservas neste dia, sem precisar de uma reserva.'}
                    </p>
                  </div>
                  <Switch
                    checked={!!editingDayManualBlock}
                    disabled={blockMutation.isPending}
                    onCheckedChange={(checked) => blockMutation.mutate(checked)}
                  />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
