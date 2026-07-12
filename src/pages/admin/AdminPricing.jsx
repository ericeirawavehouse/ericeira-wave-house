import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Home, Waves } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function AdminPricing() {
  const queryClient = useQueryClient();
  const [accommodationPrice, setAccommodationPrice] = useState('');
  const [surfPrice, setSurfPrice] = useState('');

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

  useEffect(() => {
    if (data) {
      setAccommodationPrice(String(data.accommodation_price_per_night ?? ''));
      setSurfPrice(String(data.surf_lesson_price ?? ''));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('site_settings')
        .update({
          accommodation_price_per_night: parseFloat(accommodationPrice) || 0,
          surf_lesson_price: parseFloat(surfPrice) || 0,
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
            <Label className="text-sm mb-2 block">Preço por noite — Alojamento (€)</Label>
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
    </div>
  );
}
