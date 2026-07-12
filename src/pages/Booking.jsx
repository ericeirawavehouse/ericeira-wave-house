import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Home, Waves, Loader2, CheckCircle, Tag } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import FadeInView from '../components/shared/FadeInView';
import SectionHeading from '../components/shared/SectionHeading';
import { format, eachDayOfInterval, parseISO, differenceInCalendarDays, subDays, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { priceForDate } from '@/lib/pricing';

export default function Booking() {
  const { t, lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const [type, setType] = useState(searchParams.get('type') === 'surf' ? 'surf' : 'accommodation');
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
        .eq('status', 'confirmed')
        .is('deleted_at', null);

      if (error) throw error;
      return data;
    },
  });

  const disabledDates = confirmedBookings.flatMap((b) => {
    if (!b.check_in || !b.check_out) return [];
    return eachDayOfInterval({ start: parseISO(b.check_in), end: parseISO(b.check_out) });
  });

  // Preços definidos no admin
  const { data: pricing } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('accommodation_price_per_night, surf_lesson_price, weekend_price_per_night, weekly_discount_percent, monthly_discount_percent, min_nights, max_nights, advance_notice_days')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Períodos de preço especial (época alta/baixa, etc.), tal como no Airbnb
  const { data: pricingPeriods = [] } = useQuery({
    queryKey: ['pricing-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_periods')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const nights = dateRange.from && dateRange.to ? differenceInCalendarDays(dateRange.to, dateRange.from) : 0;
  const surfTotal = pricing?.surf_lesson_price || 0;
  const minNights = pricing?.min_nights || 1;
  const maxNights = pricing?.max_nights || 30;
  const advanceNoticeDays = pricing?.advance_notice_days || 0;
  const earliestSelectableDate = addDays(new Date(), advanceNoticeDays);

  // Agrupa noites consecutivas com o mesmo preço, para mostrar como no Airbnb
  const priceBreakdown = [];
  if (dateRange.from && dateRange.to && nights > 0 && pricing) {
    const stayNights = eachDayOfInterval({ start: dateRange.from, end: subDays(dateRange.to, 1) });
    stayNights.forEach((night) => {
      const price = priceForDate(night, pricing, pricingPeriods);
      const last = priceBreakdown[priceBreakdown.length - 1];
      if (last && last.price === price) {
        last.count += 1;
      } else {
        priceBreakdown.push({ price, count: 1 });
      }
    });
  }
  const accommodationSubtotal = priceBreakdown.reduce((sum, seg) => sum + seg.price * seg.count, 0);

  const discountPercent = nights >= 28
    ? (pricing?.monthly_discount_percent || 0)
    : nights >= 7
      ? (pricing?.weekly_discount_percent || 0)
      : 0;
  const discountLabel = nights >= 28 ? 'Desconto mensal' : nights >= 7 ? 'Desconto semanal' : '';
  const discountAmount = accommodationSubtotal * (discountPercent / 100);
  const accommodationTotal = accommodationSubtotal - discountAmount;

  // 3. SUBMISSÃO DA RESERVA (SUPABASE)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (type === 'accommodation' && (!dateRange.from || !dateRange.to)) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Escolhe as datas de check-in e check-out.' });
      return;
    }
    if (type === 'accommodation' && (nights < minNights || nights > maxNights)) {
      toast({ variant: 'destructive', title: 'Erro', description: `Esta estadia precisa de ser entre ${minNights} e ${maxNights} noites.` });
      return;
    }
    if (type === 'surf' && !surfDate) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Escolhe a data da aula.' });
      return;
    }
    if (type === 'surf' && !form.surf_time) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Escolhe a hora preferida.' });
      return;
    }

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

      const dates = type === 'accommodation'
        ? `${dataToInsert.check_in || '?'} → ${dataToInsert.check_out || '?'}`
        : `${dataToInsert.surf_date || '?'}${form.surf_time ? ` (${form.surf_time})` : ''}`;

      fetch('/api/notify-new-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: form.guest_name, type, dates }),
      }).catch((err) => console.error('Erro ao notificar nova reserva:', err));
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
              className="inline-block bg-primary text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide rounded-full hover:bg-primary/90 transition-all duration-300 mt-2"
            >
              {lang === 'pt' ? 'Voltar à página principal' : 'Back to home'}
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
                        date < earliestSelectableDate ||
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

              {/* Resumo de preço, estilo Airbnb */}
              {type === 'accommodation' && nights > 0 && pricing && (
                <div className="border-t border-border pt-6 space-y-4">
                  {discountPercent > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl">
                      <Tag className="w-4 h-4 shrink-0" />
                      <span>Esta estadia tem um {discountLabel.toLowerCase()} de {discountPercent}%</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {priceBreakdown.map((seg, i) => (
                      <div key={i} className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>€{seg.price} x {seg.count} {seg.count === 1 ? 'noite' : 'noites'}</span>
                        <span>€{(seg.price * seg.count).toFixed(2)}</span>
                      </div>
                    ))}
                    {discountPercent > 0 && (
                      <div className="flex items-center justify-between text-sm text-emerald-600">
                        <span>{discountLabel} ({discountPercent}%)</span>
                        <span>-€{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between font-semibold pt-2 border-t border-border">
                      <span>Total</span>
                      {discountPercent > 0 ? (
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through font-normal text-sm">€{accommodationSubtotal.toFixed(2)}</span>
                          <span>€{accommodationTotal.toFixed(2)}</span>
                        </span>
                      ) : (
                        <span>€{accommodationTotal.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  {(nights < minNights || nights > maxNights) && (
                    <p className="text-xs text-destructive">
                      Esta estadia precisa de ser entre {minNights} e {maxNights} noites.
                    </p>
                  )}
                </div>
              )}
              {type === 'surf' && surfDate && pricing && (
                <div className="border-t border-border pt-6 space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>€{surfTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {type === 'surf' && (
                <div>
                  <Label className="text-sm mb-2 block">{t('booking.surfTime')}</Label>
                  <Select value={form.surf_time} onValueChange={(v) => setForm({ ...form, surf_time: v })} name="surf_time" required>
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
                  <Input value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} required className="rounded-lg" />
                </div>
                <div>
                  <Label className="text-sm mb-2 block">{t('booking.guests')}</Label>
                  <Input type="number" min={1} max={10} value={form.guests_count} onChange={(e) => setForm({ ...form, guests_count: parseInt(e.target.value) })} required className="rounded-lg" />
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