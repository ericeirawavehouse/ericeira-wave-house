import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { ArrowRight } from 'lucide-react';
import FadeInView from '../shared/FadeInView';

export default function SurfPreview() {
  const { t } = useLanguage();

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://media.base44.com/images/public/69dff41ed1950015f453d59f/e9f3ad5e9_generated_d81fe11f.png"
          alt="Surf lifestyle"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <FadeInView>
          <p className="text-white/60 text-sm tracking-[0.3em] uppercase mb-4">{t('surf.experience')}</p>
          <h2 className="font-heading text-3xl md:text-5xl text-white font-semibold mb-6">
            {t('surf.title')}
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-10 leading-relaxed">
            {t('surf.experienceDesc')}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/surf"
              className="inline-flex items-center gap-2 text-white text-sm font-medium hover:gap-3 transition-all duration-300"
            >
              {t('surf.subtitle')} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/booking?type=surf"
              className="inline-block bg-white text-foreground px-8 py-3 text-sm font-medium tracking-wide rounded-full hover:bg-white/90 transition-all duration-300"
            >
              {t('surf.bookLesson')}
            </Link>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}