import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Loader2, CalendarOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function SurfSlotsManager() {
  const queryClient = useQueryClient();
  const [newBlock, setNewBlock] = useState({ date: '', reason: '' });

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['surf-slots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surf_slots')
        .select('*')
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const toggleDayMutation = useMutation({
    mutationFn: async ({ dayIndex, active }) => {
      const existing = slots.find((s) => s.day_of_week === dayIndex);
      if (existing) {
        const { error } = await supabase.from('surf_slots').update({ active }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('surf_slots').insert([{
          day_of_week: dayIndex,
          label: 'Aula de Surf',
          start_time: '00:00',
          end_time: '23:59',
          price: null,
          active,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surf-slots'] }),
    onError: (error) => {
      console.error('Erro ao atualizar dia:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar este dia.' });
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
      const description = error?.code === '23505'
        ? 'Esta data já está bloqueada.'
        : 'Não foi possível bloquear a data.';
      toast({ variant: 'destructive', title: 'Erro', description });
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
      <h2 className="font-heading text-lg font-semibold mb-1">Dias disponíveis</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Escolhe em que dias da semana há aulas de surf. A hora exata é combinada diretamente com o instrutor consoante as condições do mar, por isso não é definida aqui. Se não ativares nenhum dia, o site permite marcar qualquer dia.
      </p>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-2 mb-10">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">A carregar...</p>
        ) : (
          DAY_NAMES.map((dayName, dayIndex) => {
            const slot = slots.find((s) => s.day_of_week === dayIndex);
            const active = !!slot?.active;
            return (
              <div key={dayIndex} className="flex items-center justify-between p-3 rounded-xl border border-border">
                <p className="text-sm font-medium">{dayName}</p>
                <Switch
                  checked={active}
                  disabled={toggleDayMutation.isPending}
                  onCheckedChange={(checked) => toggleDayMutation.mutate({ dayIndex, active: checked })}
                />
              </div>
            );
          })
        )}
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold mb-1">Bloquear datas específicas</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Para quando o instrutor não pode num dia em concreto, mesmo que esse dia da semana esteja normalmente disponível. A data fica completamente indisponível para reservas de surf.
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
