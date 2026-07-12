import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Home, Waves, Plus, Trash2, CalendarRange, CalendarDays, Percent, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function AdminPricing() {
  const queryClient = useQueryClient();
  const [accommodationPrice, setAccommodationPrice] = useState('');
  const [surfPrice, setSurfPrice] = useState('');
  const [weekendPrice, setWeekendPrice] = useState('');
  const [weeklyDiscount, setWeeklyDiscount] = useState('');
  const [monthlyDiscount, setMonthlyDiscount] = useState('');
  const [minNights, setMinNights] = useState('');
  const [maxNights, setMaxNights] = useState('');
  const [advanceNoticeDays, setAdvanceNoticeDays] = useState('');
  const [newPeriod, setNewPeriod] = useState({ name: '', start_date: '', end_date: '', price_per_night: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: periods = [], isLoading: loadingPeriods } = useQuery({
    queryKey: ['pricing-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_periods')
        .select('*')
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setAccommodationPrice(String(data.accommodation_price_per_night ?? ''));
      setSurfPrice(String(data.surf_lesson_price ?? ''));
      setWeekendPrice(data.weekend_price_per_night != null ? String(data.weekend_price_per_night) : '');
      setWeeklyDiscount(String(data.weekly_discount_percent ?? 0));
      setMonthlyDiscount(String(data.monthly_discount_percent ?? 0));
      setMinNights(String(data.min_nights ?? 1));
      setMaxNights(String(data.max_nights ?? 30));
      setAdvanceNoticeDays(String(data.advance_notice_days ?? 0));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('site_settings')
        .update({
          accommodation_price_per_night: parseFloat(accommodationPrice) || 0,
          surf_lesson_price: parseFloat(surfPrice) || 0,
          weekend_price_per_night: weekendPrice === '' ? null : parseFloat(weekendPrice) || 0,
          weekly_discount_percent: parseFloat(weeklyDiscount) || 0,
          monthly_discount_percent: parseFloat(monthlyDiscount) || 0,
          min_nights: parseInt(minNights) || 1,
          max_nights: parseInt(maxNights) || 30,
          advance_notice_days: parseInt(advanceNoticeDays) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Preços guardados com sucesso!' });
    },
    onError: (error) => {
      console.error('Erro ao guardar preços:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível guardar os preços.' });
    },
  });

  const addPeriodMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('pricing_periods').insert([{
        name: newPeriod.name,
        start_date: newPeriod.start_date,
        end_date: newPeriod.end_date,
        price_per_night: parseFloat(newPeriod.price_per_night) || 0,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-periods'] });
      setNewPeriod({ name: '', start_date: '', end_date: '', price_per_night: '' });
      toast({ title: 'Período adicionado!' });
    },
    onError: (error) => {
      console.error('Erro ao adicionar período:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar o período.' });
    },
  });

  const deletePeriodMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('pricing_periods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-periods'] });
      toast({ title: 'Período removido.' });
    },
  });

  const handleAddPeriod = () => {
    if (!newPeriod.name || !newPeriod.start_date || !newPeriod.end_date || !newPeriod.price_per_night) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Preenche todos os campos do período.' });
      return;
    }
    if (newPeriod.start_date > newPeriod.end_date) {
      toast({ variant: 'destructive', title: 'Erro', description: 'A data de início tem de ser antes da data de fim.' });
      return;
    }
    addPeriodMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-2xl font-semibold mb-1">Preços</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Estes valores aparecem automaticamente no site quando alguém escolhe datas na página de Reservar.
      </p>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <Label className="text-sm mb-2 block">Preço base por noite — Alojamento (€)</Label>
            <p className="text-xs text-muted-foreground mb-2">Usado em qualquer noite que não esteja dentro de um período especial definido em baixo.</p>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={accommodationPrice}
              onChange={(e) => setAccommodationPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <Label className="text-sm mb-2 block">Preço de fim de semana — Alojamento (€)</Label>
            <p className="text-xs text-muted-foreground mb-2">Aplicado a sexta e sábado à noite. Deixa em branco para usar sempre o preço base.</p>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Igual ao preço base"
              value={weekendPrice}
              onChange={(e) => setWeekendPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Waves className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <Label className="text-sm mb-2 block">Preço por aula — Surf (€)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={surfPrice}
              onChange={(e) => setSurfPrice(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full rounded-full"
        >
          {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Guardar preços
        </Button>
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold mb-1">Períodos especiais</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Define preços diferentes por intervalo de datas (ex: época alta, Natal, Ano Novo) — tal como no Airbnb. Tem sempre prioridade sobre o preço base.
        </p>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Nome</Label>
              <Input placeholder="Época Alta" value={newPeriod.name} onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Data início</Label>
              <Input type="date" value={newPeriod.start_date} onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Data fim</Label>
              <Input type="date" value={newPeriod.end_date} onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Preço/noite (€)</Label>
              <Input type="number" min="0" step="0.01" value={newPeriod.price_per_night} onChange={(e) => setNewPeriod({ ...newPeriod, price_per_night: e.target.value })} />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleAddPeriod}
            disabled={addPeriodMutation.isPending}
            className="rounded-full"
          >
            {addPeriodMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Adicionar período
          </Button>
        </div>

        {loadingPeriods ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : periods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-card border border-border rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <CalendarRange className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Sem períodos especiais definidos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {periods.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarRange className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.start_date), 'dd/MM/yyyy')} — {format(new Date(p.end_date), 'dd/MM/yyyy')}
                  </p>
                </div>
                <p className="text-sm font-semibold shrink-0">€{p.price_per_night}/noite</p>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deletePeriodMutation.mutate(p.id)}
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold mb-1">Descontos</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Descontos automáticos por duração da estadia, aplicados ao total do Alojamento.
        </p>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <Label className="text-sm mb-2 block">Desconto semanal (%) — para 7 ou mais noites</Label>
              <Input type="number" min="0" max="100" step="1" value={weeklyDiscount} onChange={(e) => setWeeklyDiscount(e.target.value)} />
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <Label className="text-sm mb-2 block">Desconto mensal (%) — para 28 ou mais noites</Label>
              <Input type="number" min="0" max="100" step="1" value={monthlyDiscount} onChange={(e) => setMonthlyDiscount(e.target.value)} />
            </div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full rounded-full">
            {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Guardar preços
          </Button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold mb-1">Disponibilidade</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Regras aplicadas a todas as reservas de Alojamento.
        </p>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarRange className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <Label className="text-sm mb-2 block">Mínimo de noites</Label>
              <Input type="number" min="1" step="1" value={minNights} onChange={(e) => setMinNights(e.target.value)} />
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarRange className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <Label className="text-sm mb-2 block">Máximo de noites</Label>
              <Input type="number" min="1" step="1" value={maxNights} onChange={(e) => setMaxNights(e.target.value)} />
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <Label className="text-sm mb-2 block">Aviso prévio (dias)</Label>
              <p className="text-xs text-muted-foreground mb-2">Não permite reservas para menos do que este número de dias a partir de hoje.</p>
              <Input type="number" min="0" step="1" value={advanceNoticeDays} onChange={(e) => setAdvanceNoticeDays(e.target.value)} />
            </div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full rounded-full">
            {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Guardar preços
          </Button>
        </div>
      </div>
    </div>
  );
}
