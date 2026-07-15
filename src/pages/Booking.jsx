import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Home, Waves, Loader2, CheckCircle, Tag, CloudSun } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import FadeInView from '../components/shared/FadeInView';
import SectionHeading from '../components/shared/SectionHeading';
import { format, eachDayOfInterval, parseISO, differenceInCalendarDays, subDays, addDays, addMonths, getDay } from 'date-fns';
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
  const [accommodationCalendarMonth, setAccommodationCalendarMonth] = useState(new Date());
  const [surfCalendarMonth, setSurfCalendarMonth] = useState(new Date());

  useEffect(() => {
    setAccommodationCalendarMonth(dateRange.from || new Date());
  }, [dateRange.from]);

  useEffect(() => {
    setSurfCalendarMonth(surfDate || new Date());
  }, [surfDate]);
  const [form, setForm] = useState({
    guest_name: '', guest_email: '', guest_phone: '', guests_count: 2, children_count: 0, surf_time: '', notes: '',
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

  // Datas bloqueadas por reservas vindas de calendários externos (ex: Airbnb)
  const { data: externalBlocks = [] } = useQuery({
    queryKey: ['external-calendar-blocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_calendar_blocks')
        .select('start_date, end_date');
      if (error) throw error;
      return data;
    },
  });

  const disabledDates = [
    ...confirmedBookings.flatMap((b) => {
      if (!b.check_in || !b.check_out) return [];
      return eachDayOfInterval({ start: parseISO(b.check_in), end: parseISO(b.check_out) });
    }),
    ...externalBlocks.flatMap((b) => {
      if (!b.start_date || !b.end_date) return [];
      return eachDayOfInterval({ start: parseISO(b.start_date), end: parseISO(b.end_date) });
    }),
  ];

  // Preços definidos no admin
  const { data: pricing } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Períodos de preço especial (época alta/baixa, etc.)
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

  // Horários de aulas de surf definidos pelo admin (dia da semana + hora)
  const { data: surfSlots = [] } = useQuery({
    queryKey: ['surf-slots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surf_slots')
        .select('*')
        .eq('active', true)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Datas específicas bloqueadas para surf (ex: instrutor indisponível)
  const { data: surfBlockedDates = [] } = useQuery({
    queryKey: ['surf-blocked-dates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surf_blocked_dates')
        .select('date');
      if (error) throw error;
      return data;
    },
  });

  const nights = dateRange.from && dateRange.to ? differenceInCalendarDays(dateRange.to, dateRange.from) : 0;
  const surfGuests = form.guests_count || 1;
  const hasConfiguredSlots = surfSlots.length > 0;
  const surfPricePerPerson = pricing?.surf_lesson_price || 0;
  const surfMinPeople = pricing?.surf_min_people || 1;
  const surfMaxPeople = pricing?.surf_max_people || 10;
  const surfAdvanceNoticeDays = pricing?.surf_advance_notice_days || 0;
  const surfEarliestSelectableDate = addDays(new Date(), surfAdvanceNoticeDays);
  const surfBookingHorizonMonths = pricing?.surf_booking_horizon_months || 0;
  const surfLatestSelectableDate = surfBookingHorizonMonths > 0 ? addMonths(new Date(), surfBookingHorizonMonths) : undefined;
  const surfBlockedDateStrings = surfBlockedDates.map((b) => b.date);
  const surfLargeGroupThreshold = pricing?.surf_large_group_threshold || 0;
  const surfGroupThreshold = pricing?.surf_group_discount_threshold || 0;
  const surfDiscountPercent = (surfLargeGroupThreshold > 0 && surfGuests >= surfLargeGroupThreshold)
    ? (pricing?.surf_large_group_discount_percent || 0)
    : (surfGroupThreshold > 0 && surfGuests >= surfGroupThreshold)
      ? (pricing?.surf_group_discount_percent || 0)
      : 0;
  const surfChildAgeLimit = pricing?.surf_child_age_limit || 0;
  const surfChildDiscountPercent = pricing?.surf_child_discount_percent || 0;
  const hasChildDiscount = surfChildAgeLimit > 0;
  const surfChildrenCount = hasChildDiscount ? Math.min(Math.max(parseInt(form.children_count) || 0, 0), surfGuests) : 0;
  const surfAdultsCount = surfGuests - surfChildrenCount;
  const surfChildPricePerPerson = surfPricePerPerson * (1 - surfChildDiscountPercent / 100);
  const surfSubtotal = surfAdultsCount * surfPricePerPerson + surfChildrenCount * surfChildPricePerPerson;
  const surfDiscountAmount = surfSubtotal * (surfDiscountPercent / 100);
  const surfTotal = surfSubtotal - surfDiscountAmount;
  const minNights = pricing?.min_nights || 1;
  const maxNights = pricing?.max_nights || 30;
  const advanceNoticeDays = pricing?.advance_notice_days || 0;
  const earliestSelectableDate = addDays(new Date(), advanceNoticeDays);
  const bookingHorizonMonths = pricing?.booking_horizon_months || 0;
  const latestSelectableDate = bookingHorizonMonths > 0 ? addMonths(new Date(), bookingHorizonMonths) : undefined;

  // Agrupa noites consecutivas com o mesmo preço
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
  const discountLabel = nights >= 28 ? t('booking.monthlyDiscount') : nights >= 7 ? t('booking.weeklyDiscount') : '';
  const discountAmount = accommodationSubtotal * (discountPercent / 100);
  const accommodationTotal = accommodationSubtotal - discountAmount;

  // 3. SUBMISSÃO DA RESERVA (SUPABASE)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (type === 'accommodation' && (!dateRange.from || !dateRange.to)) {
      toast({ variant: 'destructive', title: t('booking.errorTitle'), description: t('booking.selectDatesError') });
      return;
    }
    if (type === 'accommodation' && (nights < minNights || nights > maxNights)) {
      toast({ variant: 'destructive', title: t('booking.errorTitle'), description: t('booking.nightsRangeError', { min: minNights, max: maxNights }) });
      return;
    }
    if (type === 'surf' && !surfDate) {
      toast({ variant: 'destructive', title: t('booking.errorTitle'), description: t('booking.selectSurfDateError') });
      return;
    }
    if (type === 'surf' && (surfGuests < surfMinPeople || surfGuests > surfMaxPeople)) {
      toast({ variant: 'destructive', title: t('booking.errorTitle'), description: t('booking.peopleRangeError', { min: surfMinPeople, max: surfMaxPeople }) });
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
      dataToInsert.price_subtotal = accommodationSubtotal;
      dataToInsert.discount_amount = discountAmount;
      dataToInsert.price_total = accommodationTotal;
      dataToInsert.discount_label = discountPercent > 0 ? discountLabel : null;
    }

    if (type === 'surf' && surfDate) {
      dataToInsert.surf_date = format(surfDate, 'yyyy-MM-dd');
      dataToInsert.surf_time = 'A combinar consoante as condições';
      dataToInsert.price_subtotal = surfSubtotal;
      dataToInsert.discount_amount = surfDiscountAmount;
      dataToInsert.price_total = surfTotal;
      dataToInsert.discount_label = surfDiscountPercent > 0 ? 'Desconto de grupo' : null;
    }

    const { error } = await supabase
      .from('bookings')
      .insert([dataToInsert]);

    setSending(false);
    
    if (error) {
      console.error(error);
      toast({ variant: "destructive", title: t('booking.errorTitle'), description: t('booking.submitError') });
    } else {
      setSuccess(true);
      toast({ title: t('booking.success') });

      const dates = type === 'accommodation'
        ? `${dataToInsert.check_in || '?'} → ${dataToInsert.check_out || '?'}`
        : `${dataToInsert.surf_date || '?'}${dataToInsert.surf_time ? ` (${dataToInsert.surf_time})` : ''}`;

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
              {t('booking.backToHome')}
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
                      onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                      month={accommodationCalendarMonth}
                      onMonthChange={setAccommodationCalendarMonth}
                      numberOfMonths={2}
                      toDate={latestSelectableDate}
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
                      month={surfCalendarMonth}
                      onMonthChange={setSurfCalendarMonth}
                      toDate={surfLatestSelectableDate}
                      disabled={(date) =>
                        date < surfEarliestSelectableDate ||
                        surfBlockedDateStrings.includes(format(date, 'yyyy-MM-dd')) ||
                        (hasConfiguredSlots && surfSlots.filter((s) => s.day_of_week === getDay(date)).length === 0)
                      }
                      locale={lang === 'pt' ? pt : undefined}
                      className="rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Resumo de preço*/}
              {type === 'accommodation' && nights > 0 && pricing && (
                <div className="border-t border-border pt-6 space-y-4">
                  {discountPercent > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl">
                      <Tag className="w-4 h-4 shrink-0" />
                      <span>{t('booking.discountBanner', { discount: discountLabel.toLowerCase(), percent: discountPercent })}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {priceBreakdown.map((seg, i) => (
                      <div key={i} className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>€{seg.price} x {seg.count} {seg.count === 1 ? t('booking.night') : t('booking.nights_label')}</span>
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
                      <span>{t('booking.total')}</span>
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
                      {t('booking.nightsRangeError', { min: minNights, max: maxNights })}
                    </p>
                  )}
                </div>
              )}
              {type === 'surf' && surfDate && pricing && (
                <div className="border-t border-border pt-6 space-y-4">
                  {surfDiscountPercent > 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl">
                      <Tag className="w-4 h-4 shrink-0" />
                      <span>{t('booking.surfGroupDiscountBanner', { percent: surfDiscountPercent })}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {surfChildrenCount > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>€{surfPricePerPerson} x {surfAdultsCount} {surfAdultsCount === 1 ? t('booking.person') : t('booking.people')}</span>
                          <span>€{(surfPricePerPerson * surfAdultsCount).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>€{surfChildPricePerPerson.toFixed(2)} x {surfChildrenCount} {t('booking.children')}</span>
                          <span>€{(surfChildPricePerPerson * surfChildrenCount).toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>€{surfPricePerPerson} x {surfGuests} {surfGuests === 1 ? t('booking.person') : t('booking.people')}</span>
                        <span>€{surfSubtotal.toFixed(2)}</span>
                      </div>
                    )}
                    {surfDiscountPercent > 0 && (
                      <div className="flex items-center justify-between text-sm text-emerald-600">
                        <span>{t('booking.groupDiscountLabel', { percent: surfDiscountPercent })}</span>
                        <span>-€{surfDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between font-semibold pt-2 border-t border-border">
                      <span>{t('booking.total')}</span>
                      {surfDiscountPercent > 0 ? (
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through font-normal text-sm">€{surfSubtotal.toFixed(2)}</span>
                          <span>€{surfTotal.toFixed(2)}</span>
                        </span>
                      ) : (
                        <span>€{surfTotal.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  {(surfGuests < surfMinPeople || surfGuests > surfMaxPeople) && (
                    <p className="text-xs text-destructive">
                      {t('booking.peopleRangeError', { min: surfMinPeople, max: surfMaxPeople })}
                    </p>
                  )}
                </div>
              )}

              {type === 'surf' && (
                <div className="flex items-start gap-3 bg-sky-50 text-sky-800 text-sm px-4 py-3 rounded-xl">
                  <CloudSun className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t('booking.weatherNotice')}</span>
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
                  <Label className="text-sm mb-2 block">{type === 'surf' ? t('booking.numberOfPeople') : t('booking.guests')}</Label>
                  <Input
                    type="number"
                    min={type === 'surf' ? surfMinPeople : 1}
                    max={type === 'surf' ? surfMaxPeople : 10}
                    value={form.guests_count}
                    onChange={(e) => setForm({ ...form, guests_count: parseInt(e.target.value) })}
                    required
                    className="rounded-lg"
                  />
                  {type === 'surf' && (
                    <p className="text-xs text-muted-foreground mt-1.5">{t('booking.peopleHint', { min: surfMinPeople, max: surfMaxPeople })}</p>
                  )}
                </div>
              </div>
              {type === 'surf' && hasChildDiscount && (
                <div>
                  <Label className="text-sm mb-2 block">{t('booking.numberOfChildren', { age: surfChildAgeLimit })}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={surfGuests}
                    value={form.children_count}
                    onChange={(e) => setForm({ ...form, children_count: parseInt(e.target.value) || 0 })}
                    className="rounded-lg"
                  />
                </div>
              )}
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