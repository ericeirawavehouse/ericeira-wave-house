import React, { useState } from 'react';
// 1. Importa o cliente do Supabase
import { supabase } from '@/lib/supabaseClient'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Mail, MailOpen } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminMessages() {
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  // 2. BUSCA DE MENSAGENS (SUPABASE)
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // 3. MUTATION PARA MARCAR COMO LIDA
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

  const openMessage = (msg) => {
    setSelected(msg);
    if (!msg.read) markReadMutation.mutate(msg.id);
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold">Mensagens</h1>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground">{unreadCount} novas</Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => openMessage(msg)}
            className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors border ${
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
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Sem mensagens</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}