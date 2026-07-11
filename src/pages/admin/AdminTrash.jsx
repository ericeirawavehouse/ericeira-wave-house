import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2, RotateCcw, Home, Waves, Mail, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

export default function AdminTrash() {
  const queryClient = useQueryClient();
  const [confirmTarget, setConfirmTarget] = useState(null); // { table, id, label }

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

  const restoreMutation = useMutation({
    mutationFn: async ({ table, id }) => {
      const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { table }) => {
      queryClient.invalidateQueries({ queryKey: [table === 'bookings' ? 'trash-bookings' : 'trash-messages'] });
      queryClient.invalidateQueries({ queryKey: [table === 'bookings' ? 'admin-bookings' : 'admin-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-nav-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async ({ table, id }) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { table }) => {
      queryClient.invalidateQueries({ queryKey: [table === 'bookings' ? 'trash-bookings' : 'trash-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const handleRestore = (table, item, label) => {
    restoreMutation.mutate({ table, id: item.id });
    toast({ title: `${label} restaurada(o) com sucesso.` });
  };

  const handleConfirmPermanentDelete = () => {
    if (!confirmTarget) return;
    permanentDeleteMutation.mutate({ table: confirmTarget.table, id: confirmTarget.id });
    toast({ title: 'Apagado definitivamente.' });
    setConfirmTarget(null);
  };

  const isLoading = loadingBookings || loadingMessages;

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
          Reservas e mensagens apagadas. Podes restaurar ou apagar definitivamente.
        </p>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList className="bg-muted p-1.5 rounded-full mb-8 flex-wrap h-auto border border-border/60 inline-flex w-auto">
          <TabsTrigger value="bookings" className="rounded-full px-6">Reservas ({bookings.length})</TabsTrigger>
          <TabsTrigger value="messages" className="rounded-full px-6">Mensagens ({messages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          {bookings.length === 0 ? (
            <EmptyState label="Sem reservas no lixo" />
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                  {b.type === 'accommodation' ? <Home className="w-4 h-4 text-primary shrink-0" /> : <Waves className="w-4 h-4 text-secondary shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.guest_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Apagada em {b.deleted_at ? format(new Date(b.deleted_at), 'dd/MM/yyyy HH:mm') : '-'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleRestore('bookings', b, 'Reserva')} className="shrink-0">
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restaurar
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setConfirmTarget({ table: 'bookings', id: b.id, label: `a reserva de ${b.guest_name}` })}
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages">
          {messages.length === 0 ? (
            <EmptyState label="Sem mensagens no lixo" />
          ) : (
            <div className="space-y-2">
              {messages.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
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
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Vais apagar {confirmTarget?.label} para sempre. Esta ação não pode ser desfeita.
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
