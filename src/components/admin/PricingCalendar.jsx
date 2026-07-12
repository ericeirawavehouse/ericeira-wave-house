import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
          return (
            <button
              key={day.toISOString()}
              onClick={() => openDay(day)}
              className={`min-h-[64px] p-2 rounded-xl border text-left transition-colors hover:border-primary ${
                isToday ? 'border-primary' : 'border-border'
              } ${hasOverride ? 'bg-primary/5' : 'bg-transparent'}`}
            >
              <p className="text-xs font-medium text-foreground/70">{format(day, 'd')}</p>
              <p className={`text-xs mt-1 font-semibold ${hasOverride ? 'text-primary' : 'text-muted-foreground'}`}>
                €{price}
              </p>
            </button>
          );
        })}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
