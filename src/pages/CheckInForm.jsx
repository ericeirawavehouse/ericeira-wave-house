import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import FadeInView from '../components/shared/FadeInView';

export default function CheckInForm() {
  const { lang } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking');

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: '', id_number: '', nationality: '', date_of_birth: '',
    address: '', phone: '', email: '', arrival_time: '', special_requests: '',
  });
  const [additionalGuests, setAdditionalGuests] = useState([]);

  const addGuest = () => {
    setAdditionalGuests([...additionalGuests, { full_name: '', id_number: '', nationality: '', date_of_birth: '' }]);
  };

  const removeGuest = (index) => {
    setAdditionalGuests(additionalGuests.filter((_, i) => i !== index));
  };

  const updateGuest = (index, field, value) => {
    const updated = [...additionalGuests];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalGuests(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await base44.entities.CheckIn.create({
      ...form,
      booking_id: bookingId,
      additional_guests: additionalGuests,
    });
    if (bookingId) {
      await base44.entities.Booking.update(bookingId, { checkin_completed: true });
    }
    setSending(false);
    setDone(true);
    toast({ title: lang === 'pt' ? 'Check-in concluído!' : 'Check-in completed!' });
  };

  const labels = lang === 'pt'
    ? { title: 'Formulário de Check-in', subtitle: 'Preencha os dados para o check-in', fullName: 'Nome completo', idNumber: 'Nº Documento/Passaporte', nationality: 'Nacionalidade', dob: 'Data de nascimento', address: 'Morada', phone: 'Telefone', email: 'Email', arrivalTime: 'Hora prevista de chegada', requests: 'Pedidos especiais', submit: 'Submeter Check-in', addGuest: 'Adicionar hóspede', success: 'Check-in concluído com sucesso! Obrigado.' }
    : { title: 'Check-in Form', subtitle: 'Fill in your details for check-in', fullName: 'Full name', idNumber: 'ID/Passport number', nationality: 'Nationality', dob: 'Date of birth', address: 'Address', phone: 'Phone', email: 'Email', arrivalTime: 'Expected arrival time', requests: 'Special requests', submit: 'Submit Check-in', addGuest: 'Add guest', success: 'Check-in completed successfully! Thank you.' };

  if (done) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center px-6">
        <FadeInView>
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-semibold mb-2">{labels.success}</h2>
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
                <Label className="text-sm mb-2 block">{labels.idNumber} *</Label>
                <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-2 block">{labels.nationality}</Label>
                <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
              </div>
              <div>
                <Label className="text-sm mb-2 block">{labels.dob}</Label>
                <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">{labels.address}</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-2 block">{labels.phone}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label className="text-sm mb-2 block">{labels.email}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">{labels.arrivalTime}</Label>
              <Input type="time" value={form.arrival_time} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })} />
            </div>
            <div>
              <Label className="text-sm mb-2 block">{labels.requests}</Label>
              <Textarea rows={3} value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} />
            </div>

            {/* Additional guests */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm">{lang === 'pt' ? 'Hóspedes adicionais' : 'Additional guests'}</h3>
                <Button type="button" variant="outline" size="sm" onClick={addGuest} className="rounded-full">
                  <Plus className="w-3 h-3 mr-1" /> {labels.addGuest}
                </Button>
              </div>
              {additionalGuests.map((guest, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-muted rounded-xl relative">
                  <Input placeholder={labels.fullName} value={guest.full_name} onChange={(e) => updateGuest(i, 'full_name', e.target.value)} />
                  <Input placeholder={labels.idNumber} value={guest.id_number} onChange={(e) => updateGuest(i, 'id_number', e.target.value)} />
                  <Input placeholder={labels.nationality} value={guest.nationality} onChange={(e) => updateGuest(i, 'nationality', e.target.value)} />
                  <div className="flex gap-2">
                    <Input type="date" value={guest.date_of_birth} onChange={(e) => updateGuest(i, 'date_of_birth', e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeGuest(i)} className="shrink-0">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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