import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Star, Package, Loader2, Info, Users, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import FadeInView from '../components/shared/FadeInView';
import SectionHeading from '../components/shared/SectionHeading';
import imgSurfHero from '../images/Surf/Surf 1.jpg';
import imgSurfLesson from '../images/Surf/Surf 4.jpeg';

const surfTestimonials = {
  pt: [
    { name: 'Emily R.', text: 'Primeira vez a surfar e adorei completamente. Os instrutores foram super pacientes e tornaram tudo fácil de entender. Ambiente realmente relaxado e amigável.' },
    { name: 'Lucas M.', text: 'Eu e a minha namorada nunca tínhamos surfado antes, e recebemos muita atenção personalizada e ótimas dicas ao longo de toda a experiência. Com certeza voltaremos no próximo ano!' },
  ],
  en: [
    { name: 'Emily R.', text: 'First time surfing and I absolutely loved it. The instructors were super patient and made everything easy to understand. Really relaxed and friendly atmosphere.' },
    { name: 'Lucas M.', text: 'Me and my girlfriend had never surfed before, and we got loads of personalized attention and great tips throughout. We\'ll definitely be back next year!' },
  ],
};

export default function Surf() {
  const { t, lang } = useLanguage();
  const [requestPackage, setRequestPackage] = useState(null);
  const [form, setForm] = useState({ guest_name: '', guest_email: '', guest_phone: '' });
  const [sending, setSending] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { data: pricing } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const surfPricePerPerson = pricing?.surf_lesson_price || 0;
  const surfPrivatePricePerPerson = pricing?.surf_private_lesson_price || 0;

  const { data: packages = [] } = useQuery({
    queryKey: ['surf-packages-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surf_packages')
        .select('*')
        .eq('active', true)
        .order('lessons_count', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const openRequestDialog = (pkg) => {
    setRequestPackage(pkg);
    setForm({ guest_name: '', guest_email: '', guest_phone: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    const { error } = await supabase.from('surf_package_purchases').insert([{
      package_id: requestPackage.id,
      package_name: requestPackage.name,
      package_name_en: requestPackage.name_en || null,
      lessons_total: requestPackage.lessons_count,
      price_total: requestPackage.price_total,
      validity_days: requestPackage.validity_days || null,
      lesson_type: requestPackage.lesson_type || 'group',
      guest_name: form.guest_name,
      guest_email: form.guest_email,
      guest_phone: form.guest_phone,
      status: 'pending',
      lang,
    }]);

    setSending(false);

    if (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t('surf.packageErrorTitle'), description: t('surf.packageSubmitError') });
    } else {
      toast({ title: t('surf.packageSuccess') });
      setRequestPackage(null);

      fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_booking',
          guestName: form.guest_name,
          type: 'surf_package',
          dates: `${requestPackage.name} (${requestPackage.lessons_count} aulas)`,
        }),
      }).catch((err) => console.error('Erro ao notificar novo pedido de pacote:', err));

      fetch('/api/send-request-received-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: form.guest_email,
          guestName: form.guest_name,
          type: 'surf_package',
          lang,
          packageName: requestPackage.name,
          packageNameEn: requestPackage.name_en,
          lessonsTotal: requestPackage.lessons_count,
          priceTotal: requestPackage.price_total,
        }),
      }).catch((err) => console.error('Erro ao enviar email de pedido recebido:', err));
    }
  };

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative h-[60vh] md:h-[70vh]">
        <img
          src={imgSurfHero}
          alt="Surf Ericeira"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-12 left-6 right-6 md:bottom-16 md:left-12">
          <div className="max-w-7xl mx-auto">
            <p className="text-white/60 text-sm tracking-[0.3em] uppercase mb-3">{t('surf.experience')}</p>
            <h1 className="font-heading text-4xl md:text-6xl text-white font-semibold mb-4">{t('surf.title')}</h1>
            <p className="text-white/70 max-w-lg text-base">{t('surf.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeInView>
              <div>
                <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-6">{t('surf.experience')}</h2>
                <p className="text-foreground/80 leading-relaxed text-base mb-4">
                  {t('surf.description')}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Link
                    to="/booking?type=surf"
                    className="inline-block bg-primary text-primary-foreground px-10 py-3.5 text-sm font-medium tracking-wide rounded-full hover:bg-primary/90 transition-all duration-300"
                  >
                    {t('surf.bookLesson')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowDetails(true)}
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
                  >
                    <Info className="w-4 h-4" />
                    {t('surf.viewDetails')}
                  </button>
                </div>
              </div>
            </FadeInView>
            <FadeInView delay={0.2}>
              <img
                src={imgSurfLesson}
                alt="Surf fun"
                className="w-full h-[400px] object-cover rounded-2xl"
              />
            </FadeInView>
          </div>
        </div>
      </section>

      {/* Packages */}
      {packages.length > 0 && (() => {
        const packagesWithSavings = packages.map((pkg) => {
          const basePrice = pkg.lesson_type === 'private' ? surfPrivatePricePerPerson : surfPricePerPerson;
          const regularPrice = basePrice * pkg.lessons_count;
          const savingsPercent = regularPrice > 0 ? Math.round((1 - pkg.price_total / regularPrice) * 100) : 0;
          return { pkg, savingsPercent };
        });
        const bestSavings = Math.max(...packagesWithSavings.map((p) => p.savingsPercent));

        return (
          <section className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
              <SectionHeading title={t('surf.packagesTitle')} subtitle={t('surf.packagesSubtitle')} />
              <div className="flex flex-wrap justify-center gap-6 mt-12">
                {packagesWithSavings.map(({ pkg, savingsPercent }, i) => {
                  const isBest = savingsPercent > 0 && savingsPercent === bestSavings;
                  return (
                    <FadeInView key={pkg.id} delay={i * 0.1} className="w-full sm:w-[300px]">
                      <div
                        className={`relative bg-card rounded-2xl p-8 h-full flex flex-col transition-shadow duration-300 hover:shadow-xl ${
                          isBest ? 'border-2 border-primary shadow-lg' : 'border border-border'
                        }`}
                      >
                        {isBest && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium tracking-wide px-4 py-1 rounded-full">
                            {t('surf.bestValue')}
                          </span>
                        )}
                        <div className="flex items-center justify-between mb-5">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="w-6 h-6 text-primary" />
                          </div>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                            {pkg.lesson_type === 'private' ? <UserRound className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                            {pkg.lesson_type === 'private' ? t('booking.privateLesson') : t('booking.groupLesson')}
                          </span>
                        </div>
                        <h3 className="font-heading text-xl font-semibold mb-1">{lang === 'en' && pkg.name_en ? pkg.name_en : pkg.name}</h3>
                        <p className="text-sm text-muted-foreground mb-5">{t('surf.packageLessons', { count: pkg.lessons_count })}</p>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-3xl font-semibold">€{pkg.price_total}</span>
                          {savingsPercent > 0 && (
                            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">{t('surf.packageSavings', { percent: savingsPercent })}</span>
                          )}
                        </div>
                        {pkg.validity_days && (
                          <p className="text-xs text-muted-foreground mt-1">{t('surf.packageValidity', { days: pkg.validity_days })}</p>
                        )}
                        <Button
                          onClick={() => openRequestDialog(pkg)}
                          className="w-full rounded-full mt-6"
                        >
                          {t('surf.packageRequest')}
                        </Button>
                      </div>
                    </FadeInView>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Testimonials */}
      <section className="py-24 px-6 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <SectionHeading title={t('testimonials.title')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {surfTestimonials[lang].map((item, i) => (
              <FadeInView key={i} delay={i * 0.15}>
                <div className="bg-card border border-border rounded-2xl p-8">
                  <div className="flex gap-1 mb-4">
                    {Array(5).fill(0).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/80 italic leading-relaxed mb-4">"{item.text}"</p>
                  <p className="text-sm font-medium">{item.name}</p>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!requestPackage} onOpenChange={(open) => !open && setRequestPackage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{t('surf.packageDialogTitle')}</DialogTitle>
            <DialogDescription>{t('surf.packageDialogDesc')}</DialogDescription>
          </DialogHeader>
          {requestPackage && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">{t('booking.guestName')}</Label>
                <Input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} required />
              </div>
              <div>
                <Label className="text-sm mb-2 block">{t('booking.guestEmail')}</Label>
                <Input type="email" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} required />
              </div>
              <div>
                <Label className="text-sm mb-2 block">{t('booking.guestPhone')}</Label>
                <Input value={form.guest_phone} onChange={(e) => setForm({ ...form, guest_phone: e.target.value })} required />
              </div>
              <Button type="submit" disabled={sending} className="w-full rounded-full">
                {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t('surf.packageSubmit')}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{t('surf.detailsTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <p className="font-medium">{t('surf.detailsGroupTitle')}</p>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{t('surf.detailsGroupDesc')}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <UserRound className="w-4 h-4 text-primary" />
                  <p className="font-medium">{t('surf.detailsPrivateTitle')}</p>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{t('surf.detailsPrivateDesc')}</p>
              </div>
            </div>

            <div>
              <p className="font-medium mb-1">{t('surf.detailsLevelsTitle')}</p>
              <p className="text-muted-foreground text-xs mb-3">{t('surf.detailsLevelsIntro')}</p>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{t('surf.levelBeginnerLabel')}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{t('surf.levelBeginnerDesc')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('surf.levelIntermediateLabel')}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{t('surf.levelIntermediateDesc')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{t('surf.levelAdvancedLabel')}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{t('surf.levelAdvancedDesc')}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="font-medium mb-1">{t('surf.detailsIncludedTitle')}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{t('surf.detailsIncludedText')}</p>
            </div>

            <div>
              <p className="font-medium mb-1">{t('surf.detailsPaymentTitle')}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{t('surf.detailsPaymentText')}</p>
            </div>

            <div>
              <p className="font-medium mb-1">{t('surf.detailsCancelTitle')}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{t('surf.detailsCancelText')}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
