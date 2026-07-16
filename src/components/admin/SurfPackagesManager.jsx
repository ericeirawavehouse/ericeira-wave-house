import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Loader2, Plus, Package, Check, X, Inbox } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};
const statusLabels = { pending: 'Pendente', confirmed: 'Confirmado', rejected: 'Rejeitado' };

const packageRejectionReasons = [
  'Pacote já esgotado',
  'Fora de época para aulas de surf',
  'Outro motivo',
];

export default function SurfPackagesManager() {
  const queryClient = useQueryClient();
  const [newPackage, setNewPackage] = useState({ name: '', lessons_count: '', price_total: '' });
  const [rejectPurchase, setRejectPurchase] = useState(null);
  const [rejectReason, setRejectReason] = useState(packageRejectionReasons[0]);
  const [customReason, setCustomReason] = useState('');
  const [sendingRejection, setSendingRejection] = useState(false);

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

  const { data: purchases = [], isLoading: loadingPurchases } = useQuery({
    queryKey: ['surf-package-purchases'],
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

  const addPackageMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('surf_packages').insert([{
        name: newPackage.name,
        lessons_count: parseInt(newPackage.lessons_count) || 0,
        price_total: parseFloat(newPackage.price_total) || 0,
        active: true,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surf-packages'] });
      setNewPackage({ name: '', lessons_count: '', price_total: '' });
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

  const updatePurchaseMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase.from('surf_package_purchases').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['surf-package-purchases'] }),
  });

  const handleAddPackage = () => {
    if (!newPackage.name || !newPackage.lessons_count || !newPackage.price_total) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Preenche todos os campos do pacote.' });
      return;
    }
    addPackageMutation.mutate();
  };

  const handleApprove = async (purchase) => {
    updatePurchaseMutation.mutate({ id: purchase.id, data: { status: 'confirmed' } });
    toast({ title: 'Pacote confirmado!' });

    fetch('/api/send-booking-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: purchase.guest_email,
        guestName: purchase.guest_name,
        type: 'surf_package',
        packageName: purchase.package_name,
        lessonsTotal: purchase.lessons_total,
        priceTotal: purchase.price_total,
      }),
    }).catch((err) => console.error('Erro ao enviar email de confirmação:', err));
  };

  const openRejectModal = (purchase) => {
    setRejectPurchase(purchase);
    setRejectReason(packageRejectionReasons[0]);
    setCustomReason('');
  };

  const handleConfirmReject = async () => {
    const finalReason = rejectReason === 'Outro motivo' ? customReason.trim() : rejectReason;
    if (!finalReason) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Escreve o motivo antes de continuar.' });
      return;
    }

    setSendingRejection(true);
    try {
      updatePurchaseMutation.mutate({ id: rejectPurchase.id, data: { status: 'rejected' } });
      const res = await fetch('/api/send-rejection-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: rejectPurchase.guest_email,
          guestName: rejectPurchase.guest_name,
          reason: finalReason,
          type: 'surf_package',
        }),
      });
      if (!res.ok) throw new Error('Falha no envio');
      toast({ title: 'Pedido rejeitado e hóspede notificado.' });
      setRejectPurchase(null);
    } catch (error) {
      console.error('Erro ao enviar email de rejeição:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Pedido rejeitado, mas não foi possível enviar o email ao hóspede.' });
    } finally {
      setSendingRejection(false);
    }
  };

  const handleDeletePurchase = (purchase) => {
    updatePurchaseMutation.mutate({ id: purchase.id, data: { deleted_at: new Date().toISOString() } });
    toast({ title: 'Pedido movido para o lixo.' });
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-heading text-lg font-semibold mb-1">Pacotes de Aulas</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Define pacotes de várias aulas com desconto. Aparecem na página pública de Surf para os hóspedes pedirem.
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
            <div key={pkg.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
              <Package className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pkg.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pkg.lessons_count} aulas · €{pkg.price_total}
                  {savingsPercent > 0 && <span className="text-emerald-600"> · poupa {savingsPercent}%</span>}
                </p>
              </div>
              <Switch
                checked={pkg.active}
                onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: pkg.id, active: checked })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => deletePackageMutation.mutate(pkg.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 mb-10">
        <p className="text-sm font-medium mb-4">Novo pacote</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome</Label>
            <Input placeholder="Pacote 5 Aulas" value={newPackage.name} onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nº de aulas</Label>
            <Input type="number" min="1" step="1" value={newPackage.lessons_count} onChange={(e) => setNewPackage({ ...newPackage, lessons_count: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Preço total (€)</Label>
            <Input type="number" min="0" step="0.01" value={newPackage.price_total} onChange={(e) => setNewPackage({ ...newPackage, price_total: e.target.value })} />
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

      <h2 className="font-heading text-lg font-semibold mb-1">Pedidos de Pacotes</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Pedidos feitos pelos hóspedes na página de Surf. Ao confirmares, o hóspede fica com os créditos de aulas disponíveis para marcar através do formulário de reserva.
      </p>

      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {loadingPurchases && <p className="text-sm text-muted-foreground p-6">A carregar...</p>}
        {!loadingPurchases && purchases.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <Inbox className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Sem pedidos de pacotes.</p>
          </div>
        )}
        {purchases.map((purchase) => (
          <div key={purchase.id} className="flex items-center gap-3 p-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{purchase.guest_name} · {purchase.package_name}</p>
              <p className="text-xs text-muted-foreground">
                {purchase.guest_email} · {purchase.lessons_used}/{purchase.lessons_total} aulas usadas · €{purchase.price_total}
              </p>
              <p className="text-xs text-muted-foreground">{format(new Date(purchase.created_at), 'dd/MM/yyyy')}</p>
            </div>
            <Badge variant="outline" className={`${statusColors[purchase.status]} border text-xs shrink-0`}>
              {statusLabels[purchase.status]}
            </Badge>
            {purchase.status === 'pending' && (
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => handleApprove(purchase)} className="h-8 w-8 text-emerald-600 hover:bg-emerald-50">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openRejectModal(purchase)} className="h-8 w-8 text-red-500 hover:bg-red-50">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {purchase.status !== 'pending' && (
              <Button size="icon" variant="ghost" onClick={() => handleDeletePurchase(purchase)} className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!rejectPurchase} onOpenChange={(open) => !open && setRejectPurchase(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Rejeitar Pedido de Pacote</DialogTitle>
          </DialogHeader>
          {rejectPurchase && (
            <div className="space-y-5 text-sm">
              <p className="text-muted-foreground">
                Para <span className="font-medium text-foreground">{rejectPurchase.guest_name}</span> ({rejectPurchase.guest_email})
              </p>

              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Motivo da rejeição</Label>
                <RadioGroup value={rejectReason} onValueChange={setRejectReason}>
                  {packageRejectionReasons.map((reason) => (
                    <div key={reason} className="flex items-center gap-2">
                      <RadioGroupItem value={reason} id={`pkg-${reason}`} />
                      <Label htmlFor={`pkg-${reason}`} className="font-normal cursor-pointer">{reason}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {rejectReason === 'Outro motivo' && (
                  <Textarea
                    placeholder="Escreve o motivo..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={3}
                  />
                )}
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleConfirmReject}
                disabled={sendingRejection}
              >
                {sendingRejection ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                Rejeitar e notificar hóspede
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
