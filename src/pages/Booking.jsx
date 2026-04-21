import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Home, Waves, Loader2, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import FadeInView from '../components/shared/FadeInView';
import SectionHeading from '../components/shared/SectionHeading';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function Booking() {
  const { t, lang } = useLanguage();
  const [type, setType] = useState('accommodation');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [surfDate, setSurfDate] = useState(undefined);
  const [form, setForm] = useState({
    guest_name: '', guest_email: '', guest_phone: '', guests_count: 2, surf_time: '', notes: '',
  });

  // 2. BUSCA DE DATAS OCUPADAS (SUPABASE)
  const { data: confirmedBookings = [] } = useQuery({
    queryKey: ['confirmed-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('type', 'accommodation')
        .eq('status', 'confirmed');
      
      if (error) throw error;
      return data;
    },
  });

  const disabledDates = confirmedBookings.flatMap((b) => {
    if (!b.check_in || !b.check_out) return [];
    return eachDayOfInterval({ start: parseISO(b.check_in), end: parseISO(b.check_out) });
  });

  // 3. SUBMISSÃO DA RESERVA (SUPABASE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    const dataToInsert = {
      ...form,
      type,
      status: 'pending',
    };

    if (type === 'accommodation' && dateRange.from) {
      dataToInsert.check_in = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange.to) dataToInsert.check_out = format(dateRange.to, 'yyyy-MM-dd');
    }

    if (type === 'surf' && surfDate) {
      dataToInsert.surf_date = format(surfDate, 'yyyy-MM-dd');
    }

    const { error } = await supabase
      .from('bookings')
      .insert([dataToInsert]);

    setSending(false);
    
    if (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível enviar a reserva." });
    } else {
      setSuccess(true);
      toast({ title: t('booking.success') });
    }
  };

  if (success) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center px-6">
        <FadeInView>
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-semibold mb-3">{t('booking.success')}</h2>

            <Link
              to="/"
              className="inline-block bg-primary text-primary-foreground px-10 py-3.5 text-sm font-medium tracking-wide rounded-full hover:bg-primary/90 transition-all duration-300"
            >
              {t('booking.returnHome')}
            </Link>
          </div>
        </FadeInView>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <SectionHeading title={t('booking.title')} subtitle={t('booking.subtitle')} />

          {/* Type selection */}
          <FadeInView>
            <div className="flex gap-4 justify-center mb-12">
              <button
                onClick={() => setType('accommodation')}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl border-2 transition-all duration-300 ${
                  type === 'accommodation'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium text-sm">{t('booking.accommodationType')}</span>
              </button>
              <button
                onClick={() => setType('surf')}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl border-2 transition-all duration-300 ${
                  type === 'surf'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                <Waves className="w-5 h-5" />
                <span className="font-medium text-sm">{t('booking.surfType')}</span>
              </button>
            </div>
          </FadeInView>

          {/* Form */}
          <FadeInView delay={0.1}>
            <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border rounded-2xl p-8 md:p-12">
              {/* Calendar */}
              <div className="flex justify-center">
                {type === 'accommodation' ? (
                  <div>
                    <p className="text-sm font-medium text-center mb-4">{t('booking.checkIn')} → {t('booking.checkOut')}</p>
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      disabled={(date) =>
                        date < new Date() ||
                        disabledDates.some((d) => d.toDateString() === date.toDateString())
                      }
                      locale={lang === 'pt' ? pt : undefined}
                      className="rounded-xl"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-center mb-4">{t('booking.surfDate')}</p>
                    <Calendar
                      mode="single"
                      selected={surfDate}
                      onSelect={setSurfDate}
                      disabled={(date) => date < new Date()}
                      locale={lang === 'pt' ? pt : undefined}
                      className="rounded-xl"
                    />
                  </div>
                )}
              </div>

              {type === 'surf' && (
                <div>
                  <Label className="text-sm mb-2 block">{t('booking.surfTime')}</Label>
                  <Select value={form.surf_time} onValueChange={(v) => setForm({ ...form, surf_time: v })}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">{t('booking.morning')}</SelectItem>
                      <SelectItem value="afternoon">{t('booking.afternoon')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Guest info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-2 block">{t('booking.guestName')}</Label>
                  <Input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} required className="rounded-lg" />
                </div>
                <div>
                  <Label className="text-sm mb-2 block">{t('booking.guestEmail')}</Label>
                  <Input type="email" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} required className="rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-2 block">{t('booking.guestPhone')}</Label>
                  <Input value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} className="rounded-lg" />
                </div>
                <div>
                  <Label className="text-sm mb-2 block">{t('booking.guests')}</Label>
                  <Input type="number" min={1} max={10} value={form.guests_count} onChange={(e) => setForm({ ...form, guests_count: parseInt(e.target.value) })} className="rounded-lg" />
                </div>
              </div>
              <div>
                <Label className="text-sm mb-2 block">{t('booking.notes')}</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-lg" />
              </div>

              <Button type="submit" disabled={sending} className="w-full rounded-full py-3 h-auto text-sm font-medium tracking-wide">
                {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t('booking.submit')}
              </Button>
            </form>
          </FadeInView>
        </div>
      </section>
    </div>
  );
}