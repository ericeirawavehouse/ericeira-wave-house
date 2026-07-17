import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Loader2, Plus, Package } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function SurfPackagesManager() {
  const queryClient = useQueryClient();
  const [newPackage, setNewPackage] = useState({ name: '', name_en: '', lessons_count: '', price_total: '', validity_days: '' });

  const { data: pricing } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const surfPricePerPerson = pricing?.surf_lesson_price || 0;

  const { data: packages = [], isLoading: loadingPackages } = useQuery({
    queryKey: ['surf-packages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('surf_packages').select('*').order('lessons_count', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addPackageMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('surf_packages').insert([{
        name: newPackage.name,
        name_en: newPackage.name_en || null,
        lessons_count: parseInt(newPackage.lessons_count) || 0,
        price_total: parseFloat(newPackage.price_total) || 0,
        validity_days: newPackage.validity_days ? parseInt(newPackage.validity_days) : null,
        active: true,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surf-packages'] });
      setNewPackage({ name: '', name_en: '', lessons_count: '', price_total: '', validity_days: '' });
      toast({ title: 'Pacote criado!' });
    },
    onError: (error) => {
      console.error('Erro ao criar pacote:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar o pacote.' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }) => {
      const { error } = await supabase.from('surf_packages').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surf-packages'] }),
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('surf_packages').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surf-packages'] }),
    onError: (error) => {
      console.error('Erro ao atualizar pacote:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível guardar a alteração.' });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('surf_packages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surf-packages'] });
      toast({ title: 'Pacote removido.' });
    },
  });

  const handleAddPackage = () => {
    if (!newPackage.name || !newPackage.lessons_count || !newPackage.price_total) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Preenche todos os campos do pacote.' });
      return;
    }
    addPackageMutation.mutate();
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-heading text-lg font-semibold mb-1">Pacotes de Aulas</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Define pacotes de várias aulas com desconto. Aparecem na página pública de Surf para os hóspedes pedirem. Os pedidos feitos pelos hóspedes são geridos em Reservas, filtrando por "Surf".
      </p>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-3 mb-6">
        {loadingPackages && <p className="text-sm text-muted-foreground">A carregar...</p>}
        {!loadingPackages && packages.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não criaste nenhum pacote.</p>
        )}
        {packages.map((pkg) => {
          const regularPrice = surfPricePerPerson * pkg.lessons_count;
          const savingsPercent = regularPrice > 0 ? Math.round((1 - pkg.price_total / regularPrice) * 100) : 0;
          return (
            <div key={pkg.id} className="p-3 rounded-xl border border-border bg-background space-y-2">
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                  <Input
                    key={`${pkg.id}-name`}
                    defaultValue={pkg.name}
                    placeholder="Nome (PT)"
                    className="h-8 text-sm"
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== pkg.name) {
                        updatePackageMutation.mutate({ id: pkg.id, data: { name: e.target.value.trim() } });
                      }
                    }}
                  />
                  <Input
                    key={`${pkg.id}-name_en`}
                    defaultValue={pkg.name_en || ''}
                    placeholder="Nome (EN) - opcional"
                    className="h-8 text-sm"
                    onBlur={(e) => {
                      if (e.target.value !== (pkg.name_en || '')) {
                        updatePackageMutation.mutate({ id: pkg.id, data: { name_en: e.target.value.trim() || null } });
                      }
                    }}
                  />
                </div>
                <Switch
                  checked={pkg.active}
                  onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: pkg.id, active: checked })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => deletePackageMutation.mutate(pkg.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3 pl-7">
                <p className="text-xs text-muted-foreground">
                  {pkg.lessons_count} aulas · €{pkg.price_total}
                  {savingsPercent > 0 && <span className="text-emerald-600"> · poupa {savingsPercent}%</span>}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Label className="text-xs text-muted-foreground">Válido</Label>
                  <Input
                    key={`${pkg.id}-validity`}
                    type="number"
                    min="0"
                    defaultValue={pkg.validity_days || ''}
                    placeholder="dias"
                    className="h-7 w-20 text-xs"
                    onBlur={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : null;
                      if (value !== (pkg.validity_days || null)) {
                        updatePackageMutation.mutate({ id: pkg.id, data: { validity_days: value } });
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">dias</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-sm font-medium mb-4">Novo pacote</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome (PT)</Label>
            <Input placeholder="Pacote 5 Aulas" value={newPackage.name} onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome (EN) - opcional</Label>
            <Input placeholder="5 Lesson Package" value={newPackage.name_en} onChange={(e) => setNewPackage({ ...newPackage, name_en: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nº de aulas</Label>
            <Input type="number" min="1" step="1" value={newPackage.lessons_count} onChange={(e) => setNewPackage({ ...newPackage, lessons_count: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Preço total (€)</Label>
            <Input type="number" min="0" step="0.01" value={newPackage.price_total} onChange={(e) => setNewPackage({ ...newPackage, price_total: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Validade (dias) - opcional</Label>
            <Input type="number" min="0" step="1" placeholder="ex: 180" value={newPackage.validity_days} onChange={(e) => setNewPackage({ ...newPackage, validity_days: e.target.value })} />
          </div>
        </div>
        <Button
          type="button"
          onClick={handleAddPackage}
          disabled={addPackageMutation.isPending}
          className="w-full rounded-full mt-4"
        >
          {addPackageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Adicionar pacote
        </Button>
      </div>
    </div>
  );
}
