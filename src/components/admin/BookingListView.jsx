import React from 'react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, X, Eye, Home, Waves, Mail, MailCheck, Copy, CheckCheck, Loader2, Trash2, Inbox, Send, Package, PartyPopper, ShieldCheck, AlertTriangle, Banknote, Wallet } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { generateTimeSlots } from '@/lib/timeSlots';

const surfProposalTimeSlots = generateTimeSlots(6, 21);

function buildContactBodyPreview(mode, proposedDate, proposedTime, customMessage) {
  if (mode === 'proposal') {
    const dateLabel = proposedDate ? format(new Date(proposedDate), 'dd/MM/yyyy') : '-';
    return `Para a tua aula de surf, proponho o seguinte horário:\n\nData: ${dateLabel}\nHora: ${proposedTime || '-'}\n\nEste horário funciona para ti? Responde a este email a confirmar ou para combinarmos uma alternativa.`;
  }
  return customMessage;
}

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = { pending: 'Pendente', confirmed: 'Confirmada', rejected: 'Rejeitada' };
const surfLevelLabels = { beginner: 'Iniciante', intermediate: 'Intermédio', advanced: 'Avançado' };

const documentTypeSibaLabels = { cc: 'CARTÃO DE CIDADÃO', passport: 'PASSAPORTE', other: 'OUTRO' };

const sibaDate = (dateStr) => (dateStr ? format(new Date(dateStr), 'dd-MM-yyyy') : '-');

// Agrupado nas mesmas linhas/pares que o formulário do SIBA, para ficar visualmente igual
function sibaRows(guest, checkIn, checkOut) {
  return [
    [{ label: 'Nome Completo', value: guest.full_name || '-' }],
    [
      { label: 'Data de Nascimento', value: sibaDate(guest.date_of_birth) },
      { label: 'Local Nascimento', value: guest.place_of_birth || '-' },
    ],
    [{ label: 'Nacionalidade', value: guest.nationality || '-' }],
    [
      { label: 'Local Residência', value: guest.address || guest.country_of_residence || '-' },
      { label: 'País Residência', value: guest.country_of_residence || '-' },
    ],
    [
      { label: 'Número Documento', value: guest.id_number || '-' },
      { label: 'Tipo Documento', value: documentTypeSibaLabels[guest.document_type] || guest.document_type || '-' },
    ],
    [{ label: 'País Emissor Documento', value: guest.document_issuing_country || '-' }],
    [
      { label: 'Data de Check-in', value: sibaDate(checkIn) },
      { label: 'Data de Check-out', value: sibaDate(checkOut) },
    ],
  ];
}

function SibaFieldChip({ field, onCopy, compact }) {
  return (
    <div className={`flex items-center justify-between gap-1.5 rounded-lg ${compact ? 'bg-background px-2 py-1' : 'bg-primary/5 px-2.5 py-1.5'}`}>
      <div className="min-w-0">
        <p className={`text-muted-foreground leading-tight ${compact ? 'text-[10px]' : 'text-[11px]'}`}>{field.label}</p>
        <p className={`font-medium truncate ${compact ? 'text-xs' : ''}`}>{field.value}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onCopy(field.label, field.value)}
        className={compact ? 'h-6 w-6 shrink-0' : 'h-6 w-6 shrink-0'}
        title={`Copiar ${field.label}`}
      >
        <Copy className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </Button>
    </div>
  );
}

function SibaFieldsGrid({ guest, checkIn, checkOut, onCopy, compact }) {
  return (
    <div className="space-y-2">
      {sibaRows(guest, checkIn, checkOut).map((row, i) => (
        <div key={i} className={`grid gap-2 ${row.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {row.map((f) => (
            <SibaFieldChip key={f.label} field={f} onCopy={onCopy} compact={compact} />
          ))}
        </div>
      ))}
    </div>
  );
}

const accommodationRejectionReasons = [
  'As datas pedidas já não estão disponíveis',
  'A casa está em manutenção nesse período',
  'Não cumpre os requisitos mínimos (nº de hóspedes/estadia mínima)',
  'Outro motivo',
];

const surfRejectionReasons = [
  'As condições do mar não são favoráveis nesta data',
  'O instrutor não está disponível nesta data',
  'Não cumpre os requisitos mínimos (nº de pessoas)',
  'Outro motivo',
];

const packageRejectionReasons = [
  'Pacote já esgotado',
  'Fora de época para aulas de surf',
  'Outro motivo',
];

export default function BookingListView({ bookings, onApprove, onReject, onDelete }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = React.useState(null);
  const [checkInBooking, setCheckInBooking] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const [sendingEmail, setSendingEmail] = React.useState(false);
  const [welcomeBooking, setWelcomeBooking] = React.useState(null);
  const [sendingWelcome, setSendingWelcome] = React.useState(false);
  const [rejectBooking, setRejectBooking] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState(accommodationRejectionReasons[0]);
  const [customReason, setCustomReason] = React.useState('');
  const [sendingRejection, setSendingRejection] = React.useState(false);
  const [contactBooking, setContactBooking] = React.useState(null);
  const [contactViewMode, setContactViewMode] = React.useState('compose');
  const [contactMode, setContactMode] = React.useState('proposal');
  const [instructorName, setInstructorName] = React.useState('');
  const [proposedDate, setProposedDate] = React.useState('');
  const [proposedTime, setProposedTime] = React.useState('');
  const [customMessage, setCustomMessage] = React.useState('');
  const [sendingContact, setSendingContact] = React.useState(false);
  const [showAllPast, setShowAllPast] = React.useState(false);
  const [approveBooking, setApproveBooking] = React.useState(null);
  const [approveAttachment, setApproveAttachment] = React.useState(null);
  const [deleteBooking, setDeleteBooking] = React.useState(null);
  const [paymentAction, setPaymentAction] = React.useState(null);
  const [paymentAttachment, setPaymentAttachment] = React.useState(null);
  const [sendingPaymentAction, setSendingPaymentAction] = React.useState(false);
  const [balanceRequestBooking, setBalanceRequestBooking] = React.useState(null);
  const [balanceAttachment, setBalanceAttachment] = React.useState(null);
  const [sendingBalanceRequest, setSendingBalanceRequest] = React.useState(false);

  const { data: siteSettings } = useQuery({
    queryKey: ['site-settings-deposit'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('deposit_percent').eq('id', 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const depositPercent = siteSettings?.deposit_percent || 30;

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const buildAttachment = async (file) => {
    if (!file) return undefined;
    const contentBase64 = await fileToBase64(file);
    return { filename: file.name, contentType: file.type || 'application/pdf', contentBase64 };
  };

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ b, data }) => {
      const { error } = await supabase.from(b._table).update(data).eq('id', b.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-package-purchases'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar pagamento:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o estado do pagamento.' });
    },
  });

  const isPastOrExhausted = (b) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (b.type === 'accommodation') return b.check_out ? new Date(b.check_out) < today : false;
    if (b.type === 'surf') return b.surf_date ? new Date(b.surf_date) < today : false;
    if (b.type === 'surf_package') return b.lessons_used >= b.lessons_total;
    return false;
  };
  const activeItems = bookings.filter((b) => !isPastOrExhausted(b));
  const pastItems = bookings.filter((b) => isPastOrExhausted(b));
  const PAST_PREVIEW_COUNT = 3;
  const visiblePastItems = showAllPast ? pastItems : pastItems.slice(0, PAST_PREVIEW_COUNT);

  const renderPackageSourceBadge = (b) => {
    if (b.type !== 'surf' || !b.package_purchase_id) return null;
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-normal">
        <Package className="w-3 h-3 mr-1" /> Pacote (pago)
      </Badge>
    );
  };

  // Alojamento tem sinal (30%) + saldo (no check-in); surf e pacotes só têm um pagamento único.
  const tracksPayment = (b) =>
    b.status === 'confirmed' &&
    (b.type === 'accommodation' || b.type === 'surf_package' || (b.type === 'surf' && !b.package_purchase_id));

  const paymentState = (b) => {
    if (b.payment_received_at) return 'full';
    if (b.deposit_paid_at) return 'deposit';
    return 'unpaid';
  };

  const paymentStyles = {
    unpaid: 'bg-amber-50 text-amber-700',
    deposit: 'bg-blue-50 text-blue-700',
    full: 'bg-emerald-50 text-emerald-700',
  };

  const computePaymentData = (b, value) => {
    // A coluna deposit_paid_at só existe na tabela bookings (alojamento) - nunca a enviar para surf_package_purchases.
    const now = new Date().toISOString();
    if (value === 'unpaid') {
      return b.type === 'accommodation' ? { deposit_paid_at: null, payment_received_at: null } : { payment_received_at: null };
    }
    if (value === 'deposit') {
      return { deposit_paid_at: now, payment_received_at: null };
    }
    return b.type === 'accommodation' ? { deposit_paid_at: b.deposit_paid_at || now, payment_received_at: now } : { payment_received_at: now };
  };

  const computeDepositAmount = (b) => (b.price_total != null ? Number(b.price_total) * depositPercent / 100 : undefined);
  const computeBalanceAmount = (b) => (b.price_total != null ? Number(b.price_total) * (100 - depositPercent) / 100 : undefined);

  const patchSelected = (b, data) => {
    setSelected((prev) => (prev && prev.id === b.id && prev._table === b._table ? { ...prev, ...data } : prev));
  };

  const handlePaymentChange = (b, value) => {
    if (value === 'unpaid') {
      const data = computePaymentData(b, value);
      updatePaymentMutation.mutate({ b, data });
      patchSelected(b, data);
      return;
    }
    setPaymentAction({ booking: b, value });
    setPaymentAttachment(null);
  };

  const confirmPaymentAction = async () => {
    const { booking: b, value } = paymentAction;
    setSendingPaymentAction(true);
    try {
      const attachment = await buildAttachment(paymentAttachment);
      const data = computePaymentData(b, value);
      updatePaymentMutation.mutate({ b, data });
      patchSelected(b, data);

      const res = await fetch('/api/send-payment-received-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: b.guest_email,
          guestName: b.guest_name,
          type: b.type,
          lang: b.lang || 'pt',
          stage: value === 'deposit' ? 'deposit' : 'full',
          checkIn: b.check_in,
          checkOut: b.check_out,
          surfDate: b.surf_date,
          packageName: b.package_name,
          packageNameEn: b.package_name_en,
          priceTotal: b.price_total,
          depositAmount: value === 'deposit' ? computeDepositAmount(b) : undefined,
          depositPercent: value === 'deposit' ? depositPercent : undefined,
          attachment,
        }),
      });
      if (!res.ok) throw new Error('Falha no envio');
      toast({ title: 'Pagamento marcado e hóspede notificado por email.' });
    } catch (error) {
      console.error('Erro ao enviar email de pagamento recebido:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Pagamento marcado, mas não foi possível enviar o email ao hóspede.' });
    } finally {
      setSendingPaymentAction(false);
      setPaymentAction(null);
      setPaymentAttachment(null);
    }
  };

  const openBalanceRequestModal = (b) => {
    setBalanceRequestBooking(b);
    setBalanceAttachment(null);
  };

  const handleSendBalanceRequest = async () => {
    const b = balanceRequestBooking;
    setSendingBalanceRequest(true);
    try {
      const attachment = await buildAttachment(balanceAttachment);
      const res = await fetch('/api/send-balance-request-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: b.guest_email,
          guestName: b.guest_name,
          lang: b.lang || 'pt',
          checkIn: b.check_in,
          checkOut: b.check_out,
          balanceAmount: computeBalanceAmount(b),
          balancePercent: 100 - depositPercent,
          attachment,
        }),
      });
      if (!res.ok) throw new Error('Falha no envio');

      const sentAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ balance_request_sent_at: sentAt })
        .eq('id', b.id);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      patchSelected(b, { balance_request_sent_at: sentAt });
      setBalanceRequestBooking((prev) => (prev ? { ...prev, balance_request_sent_at: sentAt } : prev));
      toast({ title: 'Pedido de saldo enviado!' });
    } catch (error) {
      console.error('Erro ao enviar pedido de saldo:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar o email.' });
    } finally {
      setSendingBalanceRequest(false);
    }
  };

  const buildTimeline = (b) => {
    const events = [
      { label: 'Pedido recebido', date: b.created_at },
      b.confirmed_at && { label: 'Reserva confirmada', date: b.confirmed_at },
      b.rejected_at && { label: 'Reserva rejeitada', date: b.rejected_at },
      b.deposit_paid_at && { label: 'Sinal pago', date: b.deposit_paid_at },
      b.balance_request_sent_at && { label: 'Pedido de saldo enviado', date: b.balance_request_sent_at },
      b.payment_received_at && { label: b.type === 'accommodation' ? 'Saldo pago (pago na totalidade)' : 'Pago', date: b.payment_received_at },
      b.checkin_email_sent_at && { label: 'Email de check-in enviado', date: b.checkin_email_sent_at },
      b.welcome_sent_at && { label: 'Boas-vindas enviadas', date: b.welcome_sent_at },
      b.surf_contact_sent_at && { label: 'Aluno contactado', date: b.surf_contact_sent_at },
    ].filter(Boolean);
    return events.sort((a, e) => new Date(a.date) - new Date(e.date));
  };

  const renderRow = (b, dimmed) => (
    <TableRow
      key={`${b._table}-${b.id}`}
      className={`cursor-pointer hover:bg-muted/50 ${dimmed ? 'opacity-60' : ''}`}
      onClick={() => setSelected(b)}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          {b.type === 'accommodation' ? <Home className="w-4 h-4 text-primary" /> : b.type === 'surf_package' ? <Package className="w-4 h-4 text-secondary" /> : <Waves className="w-4 h-4 text-secondary" />}
          <span className="text-sm capitalize">
            {b.type === 'accommodation'
              ? 'Alojamento'
              : b.type === 'surf_package'
                ? `Pacote de Surf${b.lesson_type === 'private' ? ' (Privada)' : ''}`
                : b.is_private ? 'Surf (Privada)' : 'Surf'}
          </span>
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
          : b.type === 'surf_package'
            ? b.package_name
            : b.surf_date ? format(new Date(b.surf_date), 'dd/MM/yyyy') : '-'}
        {b.surf_time && ` (${b.surf_time})`}
      </TableCell>
      <TableCell className="text-sm">{b.type === 'surf_package' ? `${b.lessons_used}/${b.lessons_total} aulas` : (b.guests_count || '-')}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`${statusColors[b.status]} border text-xs`}>
            {statusLabels[b.status]}
          </Badge>
          {renderPackageSourceBadge(b)}
          {b.type === 'surf_package' && b.expires_at && new Date(b.expires_at) < new Date() && b.lessons_used < b.lessons_total && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-normal">
              Expirado
            </Badge>
          )}
          {tracksPayment(b) && (
            <div onClick={(e) => e.stopPropagation()}>
              <Select value={paymentState(b)} onValueChange={(value) => handlePaymentChange(b, value)}>
                <SelectTrigger className={`h-6 w-auto gap-1 px-2 text-[10px] border-0 ${paymentStyles[paymentState(b)]}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="unpaid">Por pagar</SelectItem>
                  {b.type === 'accommodation' && <SelectItem value="deposit">Sinal pago</SelectItem>}
                  <SelectItem value="full">{b.type === 'accommodation' ? 'Pago (total)' : 'Pago'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
          {b.status === 'pending' && (
            <>
              <Button size="icon" variant="ghost" onClick={() => setApproveBooking(b)} className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" title="Aprovar">
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => openRejectModal(b)} className="h-8 w-8 text-red-500 hover:bg-red-50" title="Rejeitar">
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          {b.status === 'confirmed' && b.type === 'accommodation' && !b.checkin_completed && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setCheckInBooking(b)}
              className={`h-8 w-8 hover:bg-primary/10 ${b.checkin_email_sent_at ? 'text-emerald-600' : 'text-primary'}`}
              title={b.checkin_email_sent_at ? `Check-in enviado em ${format(new Date(b.checkin_email_sent_at), "dd/MM/yyyy 'às' HH:mm")}` : 'Enviar check-in'}
            >
              {b.checkin_email_sent_at ? <MailCheck className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            </Button>
          )}
          {b.status === 'confirmed' && b.type === 'accommodation' && b.checkin_completed && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setWelcomeBooking(b)}
              className={`h-8 w-8 hover:bg-primary/10 ${b.welcome_sent_at ? 'text-emerald-600' : 'text-primary'}`}
              title={b.welcome_sent_at ? `Boas-vindas enviadas em ${format(new Date(b.welcome_sent_at), "dd/MM/yyyy 'às' HH:mm")}` : 'Enviar boas-vindas'}
            >
              <PartyPopper className="w-4 h-4" />
            </Button>
          )}
          {b.status === 'confirmed' && b.type === 'surf' && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openContactModal(b)}
              className={`h-8 w-8 hover:bg-primary/10 ${b.surf_contact_sent_at ? 'text-emerald-600' : 'text-primary'}`}
              title={b.surf_contact_sent_at ? `Contactado em ${format(new Date(b.surf_contact_sent_at), "dd/MM/yyyy 'às' HH:mm")}` : 'Contactar aluno'}
            >
              {b.surf_contact_sent_at ? <CheckCheck className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </Button>
          )}
          {b.status === 'confirmed' && b.type === 'accommodation' && paymentState(b) !== 'full' && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openBalanceRequestModal(b)}
              className={`h-8 w-8 hover:bg-primary/10 ${b.balance_request_sent_at ? 'text-emerald-600' : 'text-primary'}`}
              title={b.balance_request_sent_at ? `Saldo pedido em ${format(new Date(b.balance_request_sent_at), "dd/MM/yyyy 'às' HH:mm")}` : 'Pedir saldo restante'}
            >
              {b.balance_request_sent_at ? <Wallet className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => setSelected(b)} className="h-8 w-8" title="Ver detalhes">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setDeleteBooking(b)} className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50" title="Apagar">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const activeRejectionReasons = rejectBooking?.type === 'surf_package'
    ? packageRejectionReasons
    : rejectBooking?.type === 'surf'
      ? surfRejectionReasons
      : accommodationRejectionReasons;

  const copyField = (label, value) => {
    navigator.clipboard.writeText(String(value));
    toast({ title: `${label} copiado!` });
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
    setRejectReason(
      booking.type === 'surf_package'
        ? packageRejectionReasons[0]
        : booking.type === 'surf'
          ? surfRejectionReasons[0]
          : accommodationRejectionReasons[0]
    );
    setCustomReason('');
  };

  const openContactModal = (booking) => {
    setContactBooking(booking);
    setContactViewMode(booking.surf_contact_sent_at ? 'view' : 'compose');
    setContactMode('proposal');
    setInstructorName(booking.surf_contact_instructor || '');
    setProposedDate(booking.surf_date || '');
    setProposedTime('');
    setCustomMessage('');
  };

  const startNewContact = () => {
    setContactViewMode('compose');
    setContactMode('proposal');
    setProposedDate(contactBooking?.surf_date || '');
    setProposedTime('');
    setCustomMessage('');
  };

  const handleSendContact = async () => {
    if (!instructorName.trim()) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Escreve o nome do instrutor.' });
      return;
    }
    if (contactMode === 'proposal' && (!proposedDate || !proposedTime)) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Escolhe a data e a hora propostas.' });
      return;
    }
    if (contactMode === 'custom' && !customMessage.trim()) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Escreve a mensagem.' });
      return;
    }

    setSendingContact(true);
    try {
      const res = await fetch('/api/send-surf-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contactBooking.guest_email,
          guestName: contactBooking.guest_name,
          instructorName: instructorName.trim(),
          mode: contactMode,
          proposedDate: contactMode === 'proposal' ? proposedDate : undefined,
          proposedTime: contactMode === 'proposal' ? proposedTime : undefined,
          message: contactMode === 'custom' ? customMessage.trim() : undefined,
        }),
      });
      if (!res.ok) throw new Error('Falha no envio');

      const sentAt = new Date().toISOString();
      const messageBody = buildContactBodyPreview(contactMode, proposedDate, proposedTime, customMessage);
      const sentByInstructor = instructorName.trim();
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          surf_contact_sent_at: sentAt,
          surf_contact_message: messageBody,
          surf_contact_instructor: sentByInstructor,
        })
        .eq('id', contactBooking.id);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      setContactBooking((prev) => (prev ? {
        ...prev,
        surf_contact_sent_at: sentAt,
        surf_contact_message: messageBody,
        surf_contact_instructor: sentByInstructor,
      } : prev));
      setContactViewMode('view');
      toast({ title: 'Email enviado ao aluno!' });
    } catch (error) {
      console.error('Erro ao contactar aluno:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar o email.' });
    } finally {
      setSendingContact(false);
    }
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
          type: rejectBooking.type,
          lang: rejectBooking.lang || 'pt',
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
    ? `${window.location.origin}/checkin?booking=${checkInBooking.id}&lang=${checkInBooking.lang || 'pt'}`
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
          lang: checkInBooking.lang || 'pt',
        }),
      });
      if (!res.ok) throw new Error('Falha no envio');

      const sentAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ checkin_email_sent_at: sentAt })
        .eq('id', checkInBooking.id);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      setCheckInBooking((prev) => (prev ? { ...prev, checkin_email_sent_at: sentAt } : prev));
      toast({ title: 'Email enviado com sucesso!' });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar o email.' });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWelcome = async () => {
    setSendingWelcome(true);
    try {
      const res = await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: welcomeBooking.guest_email,
          guestName: welcomeBooking.guest_name,
          lang: welcomeBooking.lang || 'pt',
        }),
      });
      if (!res.ok) throw new Error('Falha no envio');

      const sentAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ welcome_sent_at: sentAt })
        .eq('id', welcomeBooking.id);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      setWelcomeBooking((prev) => (prev ? { ...prev, welcome_sent_at: sentAt } : prev));
      toast({ title: 'Boas-vindas enviadas com sucesso!' });
    } catch (error) {
      console.error('Erro ao enviar boas-vindas:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível enviar o email.' });
    } finally {
      setSendingWelcome(false);
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
            {activeItems.map((b) => renderRow(b))}
            {pastItems.length > 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-2 bg-muted/40">
                  <p className="text-xs font-medium text-muted-foreground">Passadas / Esgotadas ({pastItems.length})</p>
                </TableCell>
              </TableRow>
            )}
            {visiblePastItems.map((b) => renderRow(b, true))}
            {pastItems.length > PAST_PREVIEW_COUNT && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setShowAllPast((v) => !v)} className="text-xs text-muted-foreground">
                    {showAllPast ? 'Ver menos' : `Ver todas (${pastItems.length})`}
                  </Button>
                </TableCell>
              </TableRow>
            )}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground text-xs">Tipo</p><p className="font-medium capitalize">{selected.type === 'accommodation' ? 'Alojamento' : selected.type === 'surf_package' ? 'Pacote de Surf' : 'Surf'}</p></div>
                <div><p className="text-muted-foreground text-xs">Estado</p><Badge variant="outline" className={`${statusColors[selected.status]} border text-xs`}>{statusLabels[selected.status]}</Badge></div>
                <div><p className="text-muted-foreground text-xs">Nome</p><p className="font-medium">{selected.guest_name}</p></div>
                <div><p className="text-muted-foreground text-xs">Email</p><p>{selected.guest_email}</p></div>
                <div><p className="text-muted-foreground text-xs">Telefone</p><p>{selected.guest_phone || '-'}</p></div>
                {selected.type !== 'surf_package' && (
                  <div><p className="text-muted-foreground text-xs">Hóspedes</p><p>{selected.guests_count || '-'}</p></div>
                )}
                {selected.type === 'accommodation' && (
                  <>
                    <div><p className="text-muted-foreground text-xs">Check-in</p><p>{selected.check_in ? format(new Date(selected.check_in), 'dd/MM/yyyy') : '-'}</p></div>
                    <div><p className="text-muted-foreground text-xs">Check-out</p><p>{selected.check_out ? format(new Date(selected.check_out), 'dd/MM/yyyy') : '-'}</p></div>
                  </>
                )}
                {selected.type === 'surf' && (
                  <>
                    <div><p className="text-muted-foreground text-xs">Tipo de aula</p><p>{selected.is_private ? 'Privada' : 'Grupo'}</p></div>
                    <div><p className="text-muted-foreground text-xs">Nível</p><p>{surfLevelLabels[selected.surf_level] || '-'}</p></div>
                    <div><p className="text-muted-foreground text-xs">Data</p><p>{selected.surf_date ? format(new Date(selected.surf_date), 'dd/MM/yyyy') : '-'}</p></div>
                    <div><p className="text-muted-foreground text-xs">Hora</p><p>{selected.surf_time || '-'}</p></div>
                  </>
                )}
                {selected.type === 'surf_package' && (
                  <>
                    <div><p className="text-muted-foreground text-xs">Pacote</p><p>{selected.package_name}</p></div>
                    <div><p className="text-muted-foreground text-xs">Aulas</p><p>{selected.lessons_used}/{selected.lessons_total} usadas</p></div>
                    <div><p className="text-muted-foreground text-xs">Valor</p><p>€{selected.price_total}</p></div>
                    {selected.expires_at && (
                      <div>
                        <p className="text-muted-foreground text-xs">Válido até</p>
                        <p className={new Date(selected.expires_at) < new Date() ? 'text-destructive font-medium' : ''}>
                          {format(new Date(selected.expires_at), 'dd/MM/yyyy')}
                          {new Date(selected.expires_at) < new Date() && ' (expirado)'}
                        </p>
                      </div>
                    )}
                  </>
                )}
                {selected.type === 'surf' && selected.package_purchase_id && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Pagamento</p>
                    <p className="font-medium">Aula do pacote (já paga, sem custo adicional)</p>
                  </div>
                )}
                {(selected.type === 'accommodation' || selected.type === 'surf_package' || (selected.type === 'surf' && !selected.package_purchase_id)) && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs mb-1.5">Pagamento</p>
                    {selected.status !== 'confirmed' ? (
                      <p className="font-medium">€{selected.price_total ?? '-'} (por confirmar)</p>
                    ) : (
                      <Select
                        value={paymentState(selected)}
                        onValueChange={(value) => handlePaymentChange(selected, value)}
                      >
                        <SelectTrigger className={`h-8 w-auto gap-1.5 px-3 text-xs border-0 ${paymentStyles[paymentState(selected)]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="unpaid">Por pagar</SelectItem>
                          {selected.type === 'accommodation' && <SelectItem value="deposit">Sinal pago</SelectItem>}
                          <SelectItem value="full">{selected.type === 'accommodation' ? 'Pago (total)' : 'Pago'}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
              {selected.notes && (
                <div><p className="text-muted-foreground text-xs mb-1">Notas</p><p className="bg-muted p-3 rounded-lg">{selected.notes}</p></div>
              )}
              {buildTimeline(selected).length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Histórico</p>
                  <div className="space-y-2">
                    {buildTimeline(selected).map((event, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-foreground">{event.label}</span>
                        <span className="text-muted-foreground">{format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm")}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                        <div>
                          <SibaFieldsGrid guest={checkInData} checkIn={selected.check_in} checkOut={selected.check_out} onCopy={copyField} />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
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
                          <div className="space-y-3">
                            {checkInData.additional_guests.map((guest, i) => (
                              <div key={i} className="bg-muted p-3 rounded-lg">
                                <p className="font-medium text-xs mb-2">{guest.full_name || `Hóspede ${i + 2}`}</p>
                                {selected.type === 'accommodation' ? (
                                  <SibaFieldsGrid guest={guest} checkIn={selected.check_in} checkOut={selected.check_out} onCopy={copyField} compact />
                                ) : (
                                  <p className="text-muted-foreground text-xs">
                                    {guest.date_of_birth ? format(new Date(guest.date_of_birth), 'dd/MM/yyyy') : '-'} · {guest.place_of_birth || '-'} · {guest.nationality || '-'}
                                  </p>
                                )}
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

              {(selected.status === 'confirmed') && (
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  {selected.type === 'accommodation' && !selected.checkin_completed && (
                    <Button variant="outline" size="sm" onClick={() => { setCheckInBooking(selected); setSelected(null); }}>
                      <Mail className="w-3.5 h-3.5 mr-1.5" /> Enviar check-in
                    </Button>
                  )}
                  {selected.type === 'accommodation' && selected.checkin_completed && (
                    <Button variant="outline" size="sm" onClick={() => { setWelcomeBooking(selected); setSelected(null); }}>
                      <PartyPopper className="w-3.5 h-3.5 mr-1.5" /> Enviar boas-vindas
                    </Button>
                  )}
                  {selected.type === 'surf' && (
                    <Button variant="outline" size="sm" onClick={() => { openContactModal(selected); setSelected(null); }}>
                      <Send className="w-3.5 h-3.5 mr-1.5" /> Contactar aluno
                    </Button>
                  )}
                  {selected.type === 'accommodation' && paymentState(selected) !== 'full' && (
                    <Button variant="outline" size="sm" onClick={() => { openBalanceRequestModal(selected); setSelected(null); }}>
                      <Banknote className="w-3.5 h-3.5 mr-1.5" /> Pedir saldo
                    </Button>
                  )}
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => { setDeleteBooking(selected); setSelected(null); }}
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

              {checkInBooking.checkin_email_sent_at && (
                <div className="flex items-center gap-2 text-emerald-700 text-xs bg-emerald-50 px-3 py-2 rounded-lg">
                  <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Já enviado em {format(new Date(checkInBooking.checkin_email_sent_at), "dd/MM/yyyy 'às' HH:mm")}</span>
                </div>
              )}

              <Button className="w-full" onClick={handleSendEmail} disabled={sendingEmail}>
                {sendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                {checkInBooking.checkin_email_sent_at ? 'Enviar novamente' : 'Enviar por email'}
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

      <Dialog open={!!welcomeBooking} onOpenChange={(open) => !open && setWelcomeBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Enviar Boas-vindas</DialogTitle>
          </DialogHeader>
          {welcomeBooking && (
            <div className="space-y-5 text-sm">
              <p className="text-muted-foreground">
                Para <span className="font-medium text-foreground">{welcomeBooking.guest_name}</span> ({welcomeBooking.guest_email})
              </p>
              <p className="text-muted-foreground text-xs">
                Envia as informações da casa: contactos, Wi-Fi, equipamentos de segurança, regras da casa e check-out.
              </p>

              {welcomeBooking.welcome_sent_at && (
                <div className="flex items-center gap-2 text-emerald-700 text-xs bg-emerald-50 px-3 py-2 rounded-lg">
                  <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Já enviado em {format(new Date(welcomeBooking.welcome_sent_at), "dd/MM/yyyy 'às' HH:mm")}</span>
                </div>
              )}

              <Button className="w-full" onClick={handleSendWelcome} disabled={sendingWelcome}>
                {sendingWelcome ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PartyPopper className="w-4 h-4 mr-2" />}
                {welcomeBooking.welcome_sent_at ? 'Enviar novamente' : 'Enviar por email'}
              </Button>
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
                  {activeRejectionReasons.map((reason) => (
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

      <AlertDialog open={!!approveBooking} onOpenChange={(open) => { if (!open) { setApproveBooking(null); setApproveAttachment(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              {approveBooking?.type === 'surf_package' ? 'Confirmar pacote?' : 'Confirmar reserva?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vai ser enviado um email a <strong>{approveBooking?.guest_name}</strong> a confirmar {approveBooking?.type === 'surf_package' ? 'o pacote' : 'a reserva'}. Tens a certeza?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {approveBooking?.type === 'accommodation' && (
            <div className="space-y-1.5 text-sm">
              <Label className="text-xs text-muted-foreground">Fatura do sinal (opcional)</Label>
              <Input type="file" accept="application/pdf,image/*" onChange={(e) => setApproveAttachment(e.target.files?.[0] || null)} />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const attachment = await buildAttachment(approveAttachment);
                onApprove(approveBooking, attachment);
                setApproveBooking(null);
                setApproveAttachment(null);
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Sim, confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!paymentAction} onOpenChange={(open) => { if (!open) { setPaymentAction(null); setPaymentAttachment(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {paymentAction?.value === 'deposit' ? 'Confirmar sinal pago?' : 'Confirmar pagamento total?'}
            </DialogTitle>
          </DialogHeader>
          {paymentAction && (
            <div className="space-y-5 text-sm">
              <p className="text-muted-foreground">
                Vai ser enviado um email a <span className="font-medium text-foreground">{paymentAction.booking.guest_name}</span> a confirmar o pagamento.
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Recibo (opcional)</Label>
                <Input type="file" accept="application/pdf,image/*" onChange={(e) => setPaymentAttachment(e.target.files?.[0] || null)} />
              </div>
              <Button className="w-full" onClick={confirmPaymentAction} disabled={sendingPaymentAction}>
                {sendingPaymentAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Confirmar e notificar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!balanceRequestBooking} onOpenChange={(open) => { if (!open) { setBalanceRequestBooking(null); setBalanceAttachment(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Pedir saldo restante</DialogTitle>
          </DialogHeader>
          {balanceRequestBooking && (
            <div className="space-y-5 text-sm">
              <p className="text-muted-foreground">
                Para <span className="font-medium text-foreground">{balanceRequestBooking.guest_name}</span> ({balanceRequestBooking.guest_email})
              </p>
              {computeBalanceAmount(balanceRequestBooking) != null && (
                <p className="text-xs text-muted-foreground">
                  Saldo restante ({100 - depositPercent}%): <span className="font-medium text-foreground">€{computeBalanceAmount(balanceRequestBooking).toFixed(2)}</span>
                </p>
              )}

              {balanceRequestBooking.balance_request_sent_at && (
                <div className="flex items-center gap-2 text-emerald-700 text-xs bg-emerald-50 px-3 py-2 rounded-lg">
                  <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Já pedido em {format(new Date(balanceRequestBooking.balance_request_sent_at), "dd/MM/yyyy 'às' HH:mm")}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Fatura do saldo (opcional)</Label>
                <Input type="file" accept="application/pdf,image/*" onChange={(e) => setBalanceAttachment(e.target.files?.[0] || null)} />
              </div>

              <Button className="w-full" onClick={handleSendBalanceRequest} disabled={sendingBalanceRequest}>
                {sendingBalanceRequest ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />}
                {balanceRequestBooking.balance_request_sent_at ? 'Enviar novamente' : 'Enviar pedido'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteBooking} onOpenChange={(open) => !open && setDeleteBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              {deleteBooking?.type === 'surf_package' ? 'Apagar pedido?' : 'Apagar reserva?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isto move {deleteBooking?.type === 'surf_package' ? 'o pedido' : 'a reserva'} de <strong>{deleteBooking?.guest_name}</strong> para o lixo. Podes desfazer a seguir, se precisares.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(deleteBooking); setDeleteBooking(null); }}
              className="bg-red-600 hover:bg-red-700"
            >
              Sim, apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!contactBooking} onOpenChange={(open) => !open && setContactBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Contactar Aluno</DialogTitle>
          </DialogHeader>
          {contactBooking && (
            <div className="space-y-5 text-sm">
              <p className="text-muted-foreground">
                Para <span className="font-medium text-foreground">{contactBooking.guest_name}</span> ({contactBooking.guest_email})
                {contactBooking.surf_date && <> · aula de {format(new Date(contactBooking.surf_date), 'dd/MM/yyyy')}</>}
              </p>

              {contactViewMode === 'view' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs">
                      <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Enviado em {format(new Date(contactBooking.surf_contact_sent_at), "dd/MM/yyyy 'às' HH:mm")}
                        {contactBooking.surf_contact_instructor && <> por {contactBooking.surf_contact_instructor}</>}
                      </span>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={startNewContact} className="rounded-full shrink-0">
                      <Send className="w-3.5 h-3.5 mr-1.5" /> Contactar novamente
                    </Button>
                  </div>
                  <div className="bg-muted rounded-xl p-4 whitespace-pre-line">
                    {contactBooking.surf_contact_message || '(Sem conteúdo guardado para este envio.)'}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="text-sm block">Escrever email do zero</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Desligado: propor uma data/hora. Ligado: escreves a mensagem toda.</p>
                    </div>
                    <Switch
                      checked={contactMode === 'custom'}
                      onCheckedChange={(checked) => setContactMode(checked ? 'custom' : 'proposal')}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">O teu nome (para a assinatura)</Label>
                    <Input value={instructorName} onChange={(e) => setInstructorName(e.target.value)} placeholder="Nome do instrutor" />
                  </div>

                  {contactMode === 'proposal' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Data proposta</Label>
                        <Input type="date" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Hora proposta</Label>
                        <Select value={proposedTime} onValueChange={setProposedTime}>
                          <SelectTrigger><SelectValue placeholder="Escolhe a hora" /></SelectTrigger>
                          <SelectContent>
                            {surfProposalTimeSlots.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Mensagem</Label>
                      <Textarea rows={6} value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder="Escreve a mensagem para o aluno..." />
                    </div>
                  )}

                  <Button className="w-full" onClick={handleSendContact} disabled={sendingContact}>
                    {sendingContact ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    Enviar email
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}