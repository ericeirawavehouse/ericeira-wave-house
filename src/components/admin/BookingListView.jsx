import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, Eye, Home, Waves, Mail } from 'lucide-react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = { pending: 'Pendente', confirmed: 'Confirmada', rejected: 'Rejeitada' };

export default function BookingListView({ bookings, onApprove, onReject, onSendCheckIn }) {
  const [selected, setSelected] = React.useState(null);

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Hóspede</TableHead>
              <TableHead>Datas</TableHead>
              <TableHead>Hóspedes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(b)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {b.type === 'accommodation' ? <Home className="w-4 h-4 text-primary" /> : <Waves className="w-4 h-4 text-secondary" />}
                    <span className="text-sm capitalize">{b.type === 'accommodation' ? 'Alojamento' : 'Surf'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{b.guest_name}</p>
                    <p className="text-xs text-muted-foreground">{b.guest_email}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {b.type === 'accommodation'
                    ? `${b.check_in ? format(new Date(b.check_in), 'dd/MM') : '-'} → ${b.check_out ? format(new Date(b.check_out), 'dd/MM') : '-'}`
                    : b.surf_date ? format(new Date(b.surf_date), 'dd/MM/yyyy') : '-'}
                  {b.surf_time && ` (${b.surf_time})`}
                </TableCell>
                <TableCell className="text-sm">{b.guests_count || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${statusColors[b.status]} border text-xs`}>
                    {statusLabels[b.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                    {b.status === 'pending' && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => onApprove(b)} className="h-8 w-8 text-emerald-600 hover:bg-emerald-50">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onReject(b)} className="h-8 w-8 text-red-500 hover:bg-red-50">
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {b.status === 'confirmed' && b.type === 'accommodation' && !b.checkin_completed && (
                      <Button size="icon" variant="ghost" onClick={() => onSendCheckIn(b)} className="h-8 w-8 text-primary hover:bg-primary/10" title="Enviar check-in">
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => setSelected(b)} className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Sem reservas</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground text-xs">Tipo</p><p className="font-medium capitalize">{selected.type === 'accommodation' ? 'Alojamento' : 'Surf'}</p></div>
                <div><p className="text-muted-foreground text-xs">Estado</p><Badge variant="outline" className={`${statusColors[selected.status]} border text-xs`}>{statusLabels[selected.status]}</Badge></div>
                <div><p className="text-muted-foreground text-xs">Nome</p><p className="font-medium">{selected.guest_name}</p></div>
                <div><p className="text-muted-foreground text-xs">Email</p><p>{selected.guest_email}</p></div>
                <div><p className="text-muted-foreground text-xs">Telefone</p><p>{selected.guest_phone || '-'}</p></div>
                <div><p className="text-muted-foreground text-xs">Hóspedes</p><p>{selected.guests_count || '-'}</p></div>
                {selected.type === 'accommodation' && (
                  <>
                    <div><p className="text-muted-foreground text-xs">Check-in</p><p>{selected.check_in ? format(new Date(selected.check_in), 'dd/MM/yyyy') : '-'}</p></div>
                    <div><p className="text-muted-foreground text-xs">Check-out</p><p>{selected.check_out ? format(new Date(selected.check_out), 'dd/MM/yyyy') : '-'}</p></div>
                  </>
                )}
                {selected.type === 'surf' && (
                  <>
                    <div><p className="text-muted-foreground text-xs">Data</p><p>{selected.surf_date ? format(new Date(selected.surf_date), 'dd/MM/yyyy') : '-'}</p></div>
                    <div><p className="text-muted-foreground text-xs">Hora</p><p>{selected.surf_time || '-'}</p></div>
                  </>
                )}
              </div>
              {selected.notes && (
                <div><p className="text-muted-foreground text-xs mb-1">Notas</p><p className="bg-muted p-3 rounded-lg">{selected.notes}</p></div>
              )}
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground text-xs">Check-in preenchido:</p>
                <Badge variant="outline" className={selected.checkin_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}>
                  {selected.checkin_completed ? 'Sim' : 'Não'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}