import React from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, Eye, Home, Waves, Mail, Copy, CheckCheck, Loader2, Trash2, Inbox } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = { pending: 'Pendente', confirmed: 'Confirmada', rejected: 'Rejeitada' };

const documentTypeLabels = { cc: 'Cartão de Cidadão / BI', passport: 'Passaporte', other: 'Outro' };
const documentTypeSibaLabels = { cc: 'CARTÃO DE CIDADÃO', passport: 'PASSAPORTE', other: 'OUTRO' };

const sibaDate = (dateStr) => (dateStr ? format(new Date(dateStr), 'dd-MM-yyyy') : '-');

function buildSibaText(guest, checkIn, checkOut) {
  return [
    `Nome Completo: ${guest.full_name || '-'}`,
    `Data de Nascimento: ${sibaDate(guest.date_of_birth)}`,
    `Local Nascimento: ${guest.place_of_birth || '-'}`,
    `Nacionalidade: ${guest.nationality || '-'}`,
    `Local Residência: ${guest.address || guest.country_of_residence || '-'}`,
    `País Residência: ${guest.country_of_residence || '-'}`,
    `Número Documento: ${guest.id_number || '-'}`,
    `Tipo Documento: ${documentTypeSibaLabels[guest.document_type] || guest.document_type || '-'}`,
    `País Emissor Documento: ${guest.document_issuing_country || '-'}`,
    `Data de Check-in: ${sibaDate(checkIn)}`,
    `Data de Check-out: ${sibaDate(checkOut)}`,
  ].join('\n');
}

const rejectionReasons = [
  'As datas pedidas já não estão disponíveis',
  'A casa está em manutenção nesse período',
  'Não cumpre os requisitos mínimos (nº de hóspedes/estadia mínima)',
  'Outro motivo',
];

export default function BookingListView({ bookings, onApprove, onReject, onDelete }) {
  const [selected, setSelected] = React.useState(null);
  const [checkInBooking, setCheckInBooking] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const [sendingEmail, setSendingEmail] = React.useState(false);
  const [rejectBooking, setRejectBooking] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState(rejectionReasons[0]);
  const [customReason, setCustomReason] = React.useState('');
  const [sendingRejection, setSendingRejection] = React.useState(false);

  const copySibaData = (guest, checkIn, checkOut) => {
    navigator.clipboard.writeText(buildSibaText(guest, checkIn, checkOut));
    toast({ title: 'Dados copiados! Cola no SIBA.' });
  };

  const { data: checkInData, isLoading: loadingCheckIn } = useQuery({
    queryKey: ['checkin-data', selected?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*')
        .eq('booking_id', selected.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selected?.checkin_completed,
  });

  const openRejectModal = (booking) => {
    setRejectBooking(booking);
    setRejectReason(rejectionReasons[0]);
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
      onReject(rejectBooking);
      const res = await fetch('/api/send-rejection-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: rejectBooking.guest_email,
          guestName: rejectBooking.guest_name,
          reason: finalReason,
        }),
      });
      if (!res.ok) throw new Error('Falha no envio');
      toast({ title: 'Reserva rejeitada e hóspede notificado.' });
      setRejectBooking(null);
    } catch (error) {
      console.error('Erro ao enviar email de rejeição:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Reserva rejeitada, mas não foi possível enviar o email ao hóspede.' });
    } finally {
      setSendingRejection(false);
    }
  };

  const checkInUrl = checkInBooking
    ? `${window.location.origin}/checkin?booking=${checkInBooking.id}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(checkInUrl);
    setCopied(true);
    toast({ title: 'Link copiado para a área de transferência!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch('/api/send-checkin-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: checkInBooking.guest_email,
          guestName: checkInBooking.guest_name,
          checkInUrl,
        }),
      });
      if (!res.ok) throw new Error('Falha no envio');
      toast({ title: 'Email enviado com sucesso!' });
      setCheckInBooking(null);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar o email.' });
    } finally {
      setSendingEmail(false);
    }
  };

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
                        <Button size="icon" variant="ghost" onClick={() => openRejectModal(b)} className="h-8 w-8 text-red-500 hover:bg-red-50">
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {b.status === 'confirmed' && b.type === 'accommodation' && !b.checkin_completed && (
                      <Button size="icon" variant="ghost" onClick={() => setCheckInBooking(b)} className="h-8 w-8 text-primary hover:bg-primary/10" title="Enviar check-in">
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => setSelected(b)} className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(b)} className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Inbox className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">Sem reservas</p>
                  </div>
                </TableCell>
              </TableRow>
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

              {selected.checkin_completed && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Dados do check-in</p>
                  {loadingCheckIn ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : checkInData ? (
                    <div className="space-y-4">
                      {selected.type === 'accommodation' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copySibaData(checkInData, selected.check_in, selected.check_out)}
                          className="rounded-full"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar dados para o SIBA
                        </Button>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-muted-foreground text-xs">Nome completo</p><p className="font-medium">{checkInData.full_name || '-'}</p></div>
                        <div><p className="text-muted-foreground text-xs">Data de nascimento</p><p>{checkInData.date_of_birth ? format(new Date(checkInData.date_of_birth), 'dd/MM/yyyy') : '-'}</p></div>
                        <div><p className="text-muted-foreground text-xs">Local de nascimento</p><p>{checkInData.place_of_birth || '-'}</p></div>
                        <div><p className="text-muted-foreground text-xs">Nacionalidade</p><p>{checkInData.nationality || '-'}</p></div>
                        <div><p className="text-muted-foreground text-xs">Tipo de documento</p><p className="capitalize">{documentTypeLabels[checkInData.document_type] || checkInData.document_type || '-'}</p></div>
                        <div><p className="text-muted-foreground text-xs">Nº documento</p><p>{checkInData.id_number || '-'}</p></div>
                        <div><p className="text-muted-foreground text-xs">País emissor do documento</p><p>{checkInData.document_issuing_country || '-'}</p></div>
                        <div><p className="text-muted-foreground text-xs">Morada</p><p>{checkInData.address || '-'}</p></div>
                        <div><p className="text-muted-foreground text-xs">País de residência</p><p>{checkInData.country_of_residence || '-'}</p></div>
                        <div><p className="text-muted-foreground text-xs">Telefone</p><p>{checkInData.phone || '-'}</p></div>
                        <div><p className="text-muted-foreground text-xs">Email</p><p>{checkInData.email || '-'}</p></div>
                        <div><p className="text-muted-foreground text-xs">Hora de chegada</p><p>{checkInData.arrival_time || '-'}</p></div>
                      </div>
                      {checkInData.special_requests && (
                        <div><p className="text-muted-foreground text-xs mb-1">Pedidos especiais</p><p className="bg-muted p-3 rounded-lg">{checkInData.special_requests}</p></div>
                      )}
                      {Array.isArray(checkInData.additional_guests) && checkInData.additional_guests.length > 0 && (
                        <div>
                          <p className="text-muted-foreground text-xs mb-2">Hóspedes adicionais</p>
                          <div className="space-y-2">
                            {checkInData.additional_guests.map((guest, i) => (
                              <div key={i} className="bg-muted p-3 rounded-lg text-xs space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium">{guest.full_name || '-'}</p>
                                    <p className="text-muted-foreground">Nascimento: {guest.date_of_birth ? format(new Date(guest.date_of_birth), 'dd/MM/yyyy') : '-'} · {guest.place_of_birth || '-'} · {guest.nationality || '-'}</p>
                                    <p className="text-muted-foreground">{documentTypeLabels[guest.document_type] || guest.document_type || '-'}: {guest.id_number || '-'} ({guest.document_issuing_country || '-'})</p>
                                    <p className="text-muted-foreground">Residência: {guest.country_of_residence || '-'}</p>
                                  </div>
                                  {selected.type === 'accommodation' && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => copySibaData(guest, selected.check_in, selected.check_out)}
                                      className="h-7 w-7 shrink-0"
                                      title="Copiar dados para o SIBA"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">Sem dados de check-in encontrados.</p>
                  )}
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => { onDelete(selected); setSelected(null); }}
                className="text-red-500 hover:bg-red-50 hover:text-red-600 -ml-2"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Apagar reserva
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!checkInBooking} onOpenChange={(open) => !open && setCheckInBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Enviar Check-in</DialogTitle>
          </DialogHeader>
          {checkInBooking && (
            <div className="space-y-5 text-sm">
              <p className="text-muted-foreground">
                Para <span className="font-medium text-foreground">{checkInBooking.guest_name}</span> ({checkInBooking.guest_email})
              </p>

              <Button className="w-full" onClick={handleSendEmail} disabled={sendingEmail}>
                {sendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Enviar por email
              </Button>

              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">Ou copia o link diretamente</p>
                <div className="flex items-center gap-2">
                  <Input readOnly value={checkInUrl} className="text-xs" />
                  <Button size="icon" variant="outline" onClick={handleCopyLink} className="shrink-0">
                    {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectBooking} onOpenChange={(open) => !open && setRejectBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Rejeitar Reserva</DialogTitle>
          </DialogHeader>
          {rejectBooking && (
            <div className="space-y-5 text-sm">
              <p className="text-muted-foreground">
                Para <span className="font-medium text-foreground">{rejectBooking.guest_name}</span> ({rejectBooking.guest_email})
              </p>

              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Motivo da rejeição</Label>
                <RadioGroup value={rejectReason} onValueChange={setRejectReason}>
                  {rejectionReasons.map((reason) => (
                    <div key={reason} className="flex items-center gap-2">
                      <RadioGroupItem value={reason} id={reason} />
                      <Label htmlFor={reason} className="font-normal cursor-pointer">{reason}</Label>
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
    </>
  );
}