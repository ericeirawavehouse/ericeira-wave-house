import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { Star } from 'lucide-react';
import FadeInView from '../components/shared/FadeInView';
import SectionHeading from '../components/shared/SectionHeading';

const surfTestimonials = {
  pt: [
    { name: 'Emily R.', text: 'Primeira vez a surfar e adorei completamente. Os instrutores foram super pacientes e tornaram tudo fácil de entender. Ambiente realmente relaxado e amigável.' },
    { name: 'James L.', text: 'Aula muito bem organizada do início ao fim. Senti-me seguro e apoiado na água o tempo todo. Ótima equipe e uma experiência realmente divertida.' },
    { name: 'Lucas M.', text: 'Eu e a minha namorada nunca tínhamos surfado antes, e recebemos muita atenção personalizada e ótimas dicas ao longo de toda a experiência. Com certeza voltaremos no próximo ano!' },
  ],
  en: [
    { name: 'Emily R.', text: 'First time surfing and I absolutely loved it. The instructors were super patient and made everything easy to understand. Really relaxed and friendly atmosphere.' },
    { name: 'James L.', text: 'Very well organized lesson from start to finish. I felt safe and supported in the water the whole time. Great team and a really fun experience.' },
    { name: 'Lucas M.', text: 'Me and my girlfriend had never surfed before, and we got loads of personalized attention and great tips throughout. We\'ll definitely be back next year!' },
  ],
};

export default function Surf() {
  const { t, lang } = useLanguage();

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative h-[60vh] md:h-[70vh]">
        <img
          src="https://media.base44.com/images/public/69dff41ed1950015f453d59f/e9f3ad5e9_generated_d81fe11f.png"
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
                <Link
                  to="/booking"
                  className="inline-block bg-primary text-primary-foreground px-10 py-3.5 text-sm font-medium tracking-wide rounded-full hover:bg-primary/90 transition-all duration-300"
                >
                  {t('surf.bookLesson')}
                </Link>
              </div>
            </FadeInView>
            <FadeInView delay={0.2}>
              <img
                src="https://media.base44.com/images/public/69dff41ed1950015f453d59f/8561460d0_generated_bd30c536.png"
                alt="Surf fun"
                className="w-full h-[400px] object-cover rounded-2xl"
              />
            </FadeInView>
          </div>
        </div>
      </section>

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
    </div>
  );
}