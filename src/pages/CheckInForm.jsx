import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import FadeInView from '../components/shared/FadeInView';
import CountryInput from '../components/shared/CountryInput';

const MAX_ADDITIONAL_GUESTS = 4;

const arrivalTimeSlots = [];
for (let h = 15; h <= 23; h++) {
  for (let m = 0; m < 60; m += 15) {
    if (h === 23 && m > 0) break;
    arrivalTimeSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

export default function CheckInForm() {
  const { lang } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking');

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: '', id_number: '', document_type: '', document_issuing_country: '',
    nationality: '', date_of_birth: '', place_of_birth: '',
    address: '', country_of_residence: '', phone: '', email: '', arrival_time: '', special_requests: '',
  });
  const [additionalGuests, setAdditionalGuests] = useState([]);

  useEffect(() => {
    if (!bookingId) return;

    supabase
      .from('bookings')
      .select('guest_name, guest_email, guest_phone, guests_count')
      .eq('id', bookingId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return;

        setForm((f) => ({
          ...f,
          full_name: data.guest_name || f.full_name,
          email: data.guest_email || f.email,
          phone: data.guest_phone || f.phone,
        }));

        if (data.guests_count > 1) {
          setAdditionalGuests(
            Array.from({ length: Math.min(data.guests_count - 1, MAX_ADDITIONAL_GUESTS) }, () => ({
              full_name: '', id_number: '', document_type: '', document_issuing_country: '',
              nationality: '', date_of_birth: '', place_of_birth: '', country_of_residence: '',
            }))
          );
        }
      });
  }, [bookingId]);

  const labels = lang === 'pt' ? {
    title: 'Check-in Online',
    subtitle: 'Preenche os teus dados antes da chegada para agilizar o check-in.',
    fullName: 'Nome completo',
    documentType: 'Tipo de documento',
    documentTypeOptions: { cc: 'Cartão de Cidadão / BI', passport: 'Passaporte', other: 'Outro' },
    idNumber: 'Nº do documento',
    documentIssuingCountry: 'País emissor do doc.',
    nationality: 'Nacionalidade',
    dob: 'Data de nascimento',
    placeOfBirth: 'Local de nascimento',
    address: 'Morada',
    countryOfResidence: 'País de residência',
    phone: 'Telefone',
    email: 'Email',
    arrivalTime: 'Hora prevista de chegada',
    requests: 'Pedidos especiais',
    addGuest: 'Adicionar hóspede',
    submit: 'Submeter Check-in',
    success: 'Check-in concluído com sucesso!',
  } : {
    title: 'Online Check-in',
    subtitle: 'Fill in your details before arrival to speed up check-in.',
    fullName: 'Full name',
    documentType: 'Document type',
    documentTypeOptions: { cc: 'National ID card', passport: 'Passport', other: 'Other' },
    idNumber: 'Document number',
    documentIssuingCountry: 'Document issuing country',
    nationality: 'Nationality',
    dob: 'Date of birth',
    placeOfBirth: 'Place of birth',
    address: 'Address',
    countryOfResidence: 'Country of residence',
    phone: 'Phone',
    email: 'Email',
    arrivalTime: 'Expected arrival time',
    requests: 'Special requests',
    addGuest: 'Add guest',
    submit: 'Submit Check-in',
    success: 'Check-in completed successfully!',
  };

  const addGuest = () => {
    if (additionalGuests.length >= MAX_ADDITIONAL_GUESTS) return;
    setAdditionalGuests([...additionalGuests, {
      full_name: '', id_number: '', document_type: '', document_issuing_country: '',
      nationality: '', date_of_birth: '', place_of_birth: '', country_of_residence: '',
    }]);
  };

  const removeGuest = (index) => {
    setAdditionalGuests(additionalGuests.filter((_, i) => i !== index));
  };

  const updateGuest = (index, field, value) => {
    setAdditionalGuests(additionalGuests.map((guest, i) => (i === index ? { ...guest, [field]: value } : guest)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      // 2. Gravar os dados do Check-in no Supabase
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert([{
          ...form,
          booking_id: bookingId,
          additional_guests: additionalGuests, // O Supabase aceita JSONB diretamente
        }]);

      if (checkInError) throw checkInError;

      // 3. Se houver um ID de reserva, atualizamos o estado da mesma
      if (bookingId) {
        const { error: bookingUpdateError } = await supabase
          .from('bookings')
          .update({ checkin_completed: true })
          .eq('id', bookingId);
        
        if (bookingUpdateError) throw bookingUpdateError;
      }

      setDone(true);
      toast({ title: lang === 'pt' ? 'Check-in concluído!' : 'Check-in completed!' });

      fetch('/api/notify-checkin-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: form.full_name }),
      }).catch((err) => console.error('Erro ao notificar check-in concluído:', err));
    } catch (error) {
      console.error('Erro no check-in:', error);
      toast({ 
        variant: "destructive", 
        title: "Erro", 
        description: lang === 'pt' ? 'Falha ao guardar check-in.' : 'Failed to save check-in.' 
      });
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center px-6">
        <FadeInView>
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-semibold mb-2">{labels.success}</h2>
            <Link
              to="/"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide rounded-full hover:bg-primary/90 transition-all duration-300 mt-4"
            >
              {lang === 'pt' ? 'Voltar à página principal' : 'Back to home'}
            </Link>
          </div>
        </FadeInView>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen pb-24">
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-2">{labels.title}</h1>
            <p className="text-muted-foreground">{labels.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-2 block">{labels.fullName} *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div>
                <Label className="text-sm mb-2 block">{labels.dob} *</Label>
                <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-2 block">{labels.placeOfBirth} *</Label>
                <Input value={form.place_of_birth} onChange={(e) => setForm({ ...form, place_of_birth: e.target.value })} required />
              </div>
              <div>
                <Label className="text-sm mb-2 block">{labels.nationality} *</Label>
                <CountryInput value={form.nationality} onChange={(v) => setForm({ ...form, nationality: v })} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm mb-2 block">{labels.documentType} *</Label>
                <Select value={form.document_type} onValueChange={(v) => setForm({ ...form, document_type: v })} name="document_type" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cc">{labels.documentTypeOptions.cc}</SelectItem>
                    <SelectItem value="passport">{labels.documentTypeOptions.passport}</SelectItem>
                    <SelectItem value="other">{labels.documentTypeOptions.other}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-2 block">{labels.idNumber} *</Label>
                <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} required />
              </div>
              <div>
                <Label className="text-sm mb-2 block">{labels.documentIssuingCountry} *</Label>
                <CountryInput value={form.document_issuing_country} onChange={(v) => setForm({ ...form, document_issuing_country: v })} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-2 block">{labels.address} *</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              </div>
              <div>
                <Label className="text-sm mb-2 block">{labels.countryOfResidence} *</Label>
                <CountryInput value={form.country_of_residence} onChange={(v) => setForm({ ...form, country_of_residence: v })} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-2 block">{labels.phone} *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div>
                <Label className="text-sm mb-2 block">{labels.email} *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">{labels.arrivalTime} *</Label>
              <Select value={form.arrival_time} onValueChange={(v) => setForm({ ...form, arrival_time: v })} name="arrival_time" required>
                <SelectTrigger>
                  <SelectValue placeholder="15:00 - 23:00" />
                </SelectTrigger>
                <SelectContent>
                  {arrivalTimeSlots.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-2 block">{labels.requests}</Label>
              <Textarea rows={3} value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} />
            </div>

            {/* Additional guests */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-sm">{lang === 'pt' ? 'Hóspedes adicionais' : 'Additional guests'}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'pt' ? `Máximo ${MAX_ADDITIONAL_GUESTS} (além do hóspede principal)` : `Max ${MAX_ADDITIONAL_GUESTS} (besides the main guest)`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGuest}
                  disabled={additionalGuests.length >= MAX_ADDITIONAL_GUESTS}
                  className="rounded-full"
                >
                  <Plus className="w-3 h-3 mr-1" /> {labels.addGuest}
                </Button>
              </div>
              {additionalGuests.map((guest, i) => (
                <div key={i} className="mb-4 p-4 bg-muted rounded-xl relative">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {lang === 'pt' ? `Hóspede ${i + 2}` : `Guest ${i + 2}`}
                    </p>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeGuest(i)} className="h-7 w-7 shrink-0">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1.5 block">{labels.fullName} *</Label>
                      <Input value={guest.full_name} onChange={(e) => updateGuest(i, 'full_name', e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">{labels.dob} *</Label>
                      <Input type="date" value={guest.date_of_birth} onChange={(e) => updateGuest(i, 'date_of_birth', e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">{labels.placeOfBirth} *</Label>
                      <Input value={guest.place_of_birth} onChange={(e) => updateGuest(i, 'place_of_birth', e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">{labels.nationality} *</Label>
                      <CountryInput value={guest.nationality} onChange={(v) => updateGuest(i, 'nationality', v)} required />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">{labels.documentType} *</Label>
                      <Select value={guest.document_type} onValueChange={(v) => updateGuest(i, 'document_type', v)} required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cc">{labels.documentTypeOptions.cc}</SelectItem>
                          <SelectItem value="passport">{labels.documentTypeOptions.passport}</SelectItem>
                          <SelectItem value="other">{labels.documentTypeOptions.other}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">{labels.idNumber} *</Label>
                      <Input value={guest.id_number} onChange={(e) => updateGuest(i, 'id_number', e.target.value)} required />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">{labels.documentIssuingCountry} *</Label>
                      <CountryInput value={guest.document_issuing_country} onChange={(v) => updateGuest(i, 'document_issuing_country', v)} required />
                    </div>
                    <div>
                      <Label className="text-xs mb-1.5 block">{labels.countryOfResidence} *</Label>
                      <CountryInput value={guest.country_of_residence} onChange={(v) => updateGuest(i, 'country_of_residence', v)} required />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={sending} className="w-full rounded-full py-3 h-auto">
              {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {labels.submit}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}