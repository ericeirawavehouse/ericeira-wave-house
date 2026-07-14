import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, Clock, CalendarOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function SurfSlotsManager() {
  const queryClient = useQueryClient();
  const [newSlot, setNewSlot] = useState({ day_of_week: '1', label: '', start_time: '09:00', end_time: '12:00', price: '' });
  const [newBlock, setNewBlock] = useState({ date: '', reason: '' });

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['surf-slots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surf_slots')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('surf_slots').insert([{
        day_of_week: parseInt(newSlot.day_of_week),
        label: newSlot.label || 'Aula',
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        price: newSlot.price === '' ? null : parseFloat(newSlot.price),
        active: true,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surf-slots'] });
      setNewSlot({ day_of_week: '1', label: '', start_time: '09:00', end_time: '12:00', price: '' });
      toast({ title: 'Horário adicionado!' });
    },
    onError: (error) => {
      console.error('Erro ao adicionar horário:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar o horário.' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (slot) => {
      const { error } = await supabase.from('surf_slots').update({ active: !slot.active }).eq('id', slot.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surf-slots'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('surf_slots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surf-slots'] });
      toast({ title: 'Horário removido.' });
    },
  });

  const { data: blockedDates = [], isLoading: loadingBlocked } = useQuery({
    queryKey: ['surf-blocked-dates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surf_blocked_dates')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addBlockMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('surf_blocked_dates').insert([{
        date: newBlock.date,
        reason: newBlock.reason || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surf-blocked-dates'] });
      setNewBlock({ date: '', reason: '' });
      toast({ title: 'Data bloqueada!' });
    },
    onError: (error) => {
      console.error('Erro ao bloquear data:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível bloquear a data. Já deves ter bloqueado esta data antes.' });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('surf_blocked_dates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surf-blocked-dates'] });
      toast({ title: 'Data desbloqueada.' });
    },
  });

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold mb-1">Horários disponíveis</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Define em que dias da semana e horas há aulas de surf disponíveis. Podes definir um preço diferente do preço base para um horário específico (ex: aulas ao fim de semana mais caras). Se não definires nenhum horário, o site mostra sempre "Manhã" e "Tarde" como opções fixas.
      </p>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-3 mb-6">
        {isLoading && <p className="text-sm text-muted-foreground">A carregar...</p>}
        {!isLoading && slots.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não definiste nenhum horário.</p>
        )}
        {DAY_NAMES.map((dayName, dayIndex) => {
          const daySlots = slots.filter((s) => s.day_of_week === dayIndex);
          if (daySlots.length === 0) return null;
          return (
            <div key={dayIndex} className="border-b border-border last:border-0 pb-3 last:pb-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{dayName}</p>
              <div className="space-y-2">
                {daySlots.map((slot) => (
                  <div key={slot.id} className={`flex items-center gap-3 p-3 rounded-xl border ${slot.active ? 'border-border bg-background' : 'border-border/50 bg-muted/50 opacity-60'}`}>
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{slot.label} · {slot.start_time} - {slot.end_time}</p>
                      <p className="text-xs text-muted-foreground">{slot.price != null ? `€${slot.price} por pessoa` : 'Preço base'}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => toggleActiveMutation.mutate(slot)}
                    >
                      {slot.active ? 'Ativo' : 'Inativo'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(slot.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-sm font-medium mb-4">Adicionar horário</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="col-span-2 md:col-span-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Dia da semana</Label>
            <Select value={newSlot.day_of_week} onValueChange={(v) => setNewSlot({ ...newSlot, day_of_week: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAY_NAMES.map((name, i) => (
                  <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome</Label>
            <Input placeholder="Manhã" value={newSlot.label} onChange={(e) => setNewSlot({ ...newSlot, label: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Início</Label>
            <Input type="time" value={newSlot.start_time} onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Fim</Label>
            <Input type="time" value={newSlot.end_time} onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Preço (€, opcional)</Label>
            <Input type="number" min="0" step="0.01" placeholder="Preço base" value={newSlot.price} onChange={(e) => setNewSlot({ ...newSlot, price: e.target.value })} />
          </div>
        </div>
        <Button
          type="button"
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending || !newSlot.start_time || !newSlot.end_time}
          className="w-full rounded-full mt-4"
        >
          {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Adicionar horário
        </Button>
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-lg font-semibold mb-1">Bloquear datas específicas</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Para quando o instrutor não pode num dia em concreto, mesmo que esse dia da semana tenha normalmente horários disponíveis. A data fica completamente indisponível para reservas de surf.
        </p>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-3 mb-6">
          {loadingBlocked && <p className="text-sm text-muted-foreground">A carregar...</p>}
          {!loadingBlocked && blockedDates.length === 0 && (
            <p className="text-sm text-muted-foreground">Ainda não bloqueaste nenhuma data.</p>
          )}
          {blockedDates.map((block) => (
            <div key={block.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
              <CalendarOff className="w-4 h-4 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">{format(parseISO(block.date), "d 'de' MMMM yyyy", { locale: pt })}</p>
                {block.reason && <p className="text-xs text-muted-foreground">{block.reason}</p>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteBlockMutation.mutate(block.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium mb-4">Bloquear data</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Data</Label>
              <Input type="date" value={newBlock.date} onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Motivo (opcional)</Label>
              <Input placeholder="Instrutor indisponível" value={newBlock.reason} onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })} />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => addBlockMutation.mutate()}
            disabled={addBlockMutation.isPending || !newBlock.date}
            className="w-full rounded-full mt-4"
          >
            {addBlockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CalendarOff className="w-4 h-4 mr-2" />}
            Bloquear data
          </Button>
        </div>
      </div>
    </div>
  );
}
