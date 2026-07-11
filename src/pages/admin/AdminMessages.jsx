import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Mail, MailOpen, Trash2, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';

export default function AdminMessages() {
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-messages'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, deletedAt }) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ deleted_at: deletedAt })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-messages'] }),
  });

  const openMessage = (msg) => {
    setSelected(msg);
    if (!msg.read) markReadMutation.mutate(msg.id);
  };

  const handleDelete = (msg) => {
    deleteMutation.mutate({ id: msg.id, deletedAt: new Date().toISOString() });
    toast({
      title: 'Mensagem movida para o lixo.',
      action: (
        <ToastAction altText="Desfazer" onClick={() => deleteMutation.mutate({ id: msg.id, deletedAt: null })}>
          Desfazer
        </ToastAction>
      ),
    });
    setSelected(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Mensagens</h1>
          <p className="text-sm text-muted-foreground mt-1">{messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-primary text-primary-foreground">{unreadCount} novas</Badge>
        )}
      </div>

      <div className="space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => openMessage(msg)}
            className={`group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors border ${
              msg.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'
            } hover:bg-muted/50`}
          >
            <div className="shrink-0">
              {msg.read ? <MailOpen className="w-5 h-5 text-muted-foreground" /> : <Mail className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm truncate ${msg.read ? '' : 'font-semibold'}`}>{msg.name}</p>
                {msg.subject && <span className="text-xs text-muted-foreground truncate">- {msg.subject}</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{msg.message}</p>
            </div>
            <p className="text-xs text-muted-foreground shrink-0">
              {msg.created_at ? format(new Date(msg.created_at), 'dd/MM HH:mm') : ''}
            </p>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); handleDelete(msg); }}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Sem mensagens</p>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{selected?.subject || 'Mensagem'}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{selected.name}</p></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p>{selected.email}</p></div>
                {selected.phone && <div><p className="text-xs text-muted-foreground">Telefone</p><p>{selected.phone}</p></div>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Mensagem</p>
                <p className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">{selected.message}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleDelete(selected)}
                className="text-red-500 hover:bg-red-50 hover:text-red-600 -ml-2"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Apagar mensagem
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
