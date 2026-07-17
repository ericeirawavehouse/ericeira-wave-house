import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2, RotateCcw, Home, Waves, Package, Mail, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

export default function AdminTrash() {
  const queryClient = useQueryClient();
  const [confirmTarget, setConfirmTarget] = useState(null); // { table, id, label } or { bulk: [...items] }
  const [selectedBookingKeys, setSelectedBookingKeys] = useState(new Set());
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['trash-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: packagePurchases = [], isLoading: loadingPackages } = useQuery({
    queryKey: ['trash-package-purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surf_package_purchases')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['trash-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const normalizedBookings = bookings.map((b) => ({ ...b, _table: 'bookings', _key: `bookings-${b.id}` }));
  const normalizedPackages = packagePurchases.map((p) => ({
    id: p.id,
    _table: 'surf_package_purchases',
    _key: `surf_package_purchases-${p.id}`,
    type: 'surf_package',
    guest_name: p.guest_name,
    guest_email: p.guest_email,
    package_name: p.package_name,
    deleted_at: p.deleted_at,
  }));
  const trashItems = [...normalizedBookings, ...normalizedPackages].sort(
    (a, b) => new Date(b.deleted_at) - new Date(a.deleted_at)
  );

  const restoreMutation = useMutation({
    mutationFn: async ({ table, id }) => {
      const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { table }) => {
      invalidateForTable(table);
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async ({ table, id }) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { table }) => {
      invalidateForTable(table);
    },
  });

  const invalidateForTable = (table) => {
    if (table === 'bookings') {
      queryClient.invalidateQueries({ queryKey: ['trash-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    } else if (table === 'surf_package_purchases') {
      queryClient.invalidateQueries({ queryKey: ['trash-package-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['admin-package-purchases'] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['trash-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    }
    queryClient.invalidateQueries({ queryKey: ['admin-nav-counts'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const handleRestore = (table, item, label) => {
    restoreMutation.mutate({ table, id: item.id });
    toast({ title: `${label} restaurada(o) com sucesso.` });
  };

  const handleConfirmPermanentDelete = async () => {
    if (!confirmTarget) return;
    if (confirmTarget.bulk) {
      for (const item of confirmTarget.bulk) {
        await permanentDeleteMutation.mutateAsync({ table: item._table, id: item.id });
      }
      toast({ title: `${confirmTarget.bulk.length} item(ns) apagado(s) definitivamente.` });
      setSelectedBookingKeys(new Set());
      setSelectedMessageIds(new Set());
    } else {
      permanentDeleteMutation.mutate({ table: confirmTarget.table, id: confirmTarget.id });
      toast({ title: 'Apagado definitivamente.' });
    }
    setConfirmTarget(null);
  };

  const toggleBookingSelection = (key) => {
    setSelectedBookingKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleAllBookings = (checked) => {
    setSelectedBookingKeys(checked ? new Set(trashItems.map((i) => i._key)) : new Set());
  };

  const toggleMessageSelection = (id) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllMessages = (checked) => {
    setSelectedMessageIds(checked ? new Set(messages.map((m) => m.id)) : new Set());
  };

  const selectedBookingItems = trashItems.filter((i) => selectedBookingKeys.has(i._key));
  const selectedMessageItems = messages
    .filter((m) => selectedMessageIds.has(m.id))
    .map((m) => ({ id: m.id, _table: 'contact_messages' }));

  const isLoading = loadingBookings || loadingPackages || loadingMessages;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold">Lixo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reservas, pedidos de pacotes e mensagens apagadas. Podes restaurar ou apagar definitivamente.
        </p>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList className="bg-muted p-1.5 rounded-full mb-8 flex-wrap h-auto border border-border/60 inline-flex w-auto">
          <TabsTrigger value="bookings" className="rounded-full px-6">Reservas ({trashItems.length})</TabsTrigger>
          <TabsTrigger value="messages" className="rounded-full px-6">Mensagens ({messages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          {trashItems.length === 0 ? (
            <EmptyState label="Sem reservas no lixo" />
          ) : (
            <div className="space-y-3">
              <SelectionToolbar
                allChecked={selectedBookingKeys.size > 0 && selectedBookingKeys.size === trashItems.length}
                someChecked={selectedBookingKeys.size > 0}
                onToggleAll={toggleAllBookings}
                selectedCount={selectedBookingKeys.size}
                onDeleteSelected={() => setConfirmTarget({ bulk: selectedBookingItems })}
              />
              <div className="space-y-2">
                {trashItems.map((b) => (
                  <div key={b._key} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                    <Checkbox
                      checked={selectedBookingKeys.has(b._key)}
                      onCheckedChange={() => toggleBookingSelection(b._key)}
                    />
                    {b.type === 'accommodation' ? <Home className="w-4 h-4 text-primary shrink-0" /> : b.type === 'surf_package' ? <Package className="w-4 h-4 text-secondary shrink-0" /> : <Waves className="w-4 h-4 text-secondary shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.guest_name}{b.type === 'surf_package' && b.package_name ? ` · ${b.package_name}` : ''}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Apagada em {b.deleted_at ? format(new Date(b.deleted_at), 'dd/MM/yyyy HH:mm') : '-'}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleRestore(b._table, b, b.type === 'surf_package' ? 'Pedido' : 'Reserva')} className="shrink-0">
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restaurar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirmTarget({ table: b._table, id: b.id, label: b.type === 'surf_package' ? `o pedido de pacote de ${b.guest_name}` : `a reserva de ${b.guest_name}` })}
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages">
          {messages.length === 0 ? (
            <EmptyState label="Sem mensagens no lixo" />
          ) : (
            <div className="space-y-3">
              <SelectionToolbar
                allChecked={selectedMessageIds.size > 0 && selectedMessageIds.size === messages.length}
                someChecked={selectedMessageIds.size > 0}
                onToggleAll={toggleAllMessages}
                selectedCount={selectedMessageIds.size}
                onDeleteSelected={() => setConfirmTarget({ bulk: selectedMessageItems })}
              />
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                    <Checkbox
                      checked={selectedMessageIds.has(m.id)}
                      onCheckedChange={() => toggleMessageSelection(m.id)}
                    />
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}{m.subject ? ` - ${m.subject}` : ''}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Apagada em {m.deleted_at ? format(new Date(m.deleted_at), 'dd/MM/yyyy HH:mm') : '-'}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleRestore('contact_messages', m, 'Mensagem')} className="shrink-0">
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restaurar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirmTarget({ table: 'contact_messages', id: m.id, label: `a mensagem de ${m.name}` })}
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.bulk
                ? `Vais apagar ${confirmTarget.bulk.length} item(ns) para sempre. Esta ação não pode ser desfeita.`
                : `Vais apagar ${confirmTarget?.label} para sempre. Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SelectionToolbar({ allChecked, someChecked, onToggleAll, selectedCount, onDeleteSelected }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <Checkbox checked={allChecked} onCheckedChange={(checked) => onToggleAll(checked === true)} />
      <span className="text-xs text-muted-foreground">
        {someChecked ? `${selectedCount} selecionado(s)` : 'Selecionar tudo'}
      </span>
      {someChecked && (
        <Button size="sm" variant="destructive" onClick={onDeleteSelected} className="ml-auto">
          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Apagar selecionados
        </Button>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Inbox className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
