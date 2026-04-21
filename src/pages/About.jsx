import React from 'react';
import { useLanguage } from '@/lib/i18n.jsx'; 
import FadeInView from '@/components/shared/FadeInView';


import imageSobre from '../../images/Outros/15.jpeg'; 

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh]">
        <img src={imageSobre} alt="About us" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-12 left-6 right-6 md:bottom-16 md:left-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-heading text-4xl md:text-6xl text-white font-semibold mb-3">{t('about.title')}</h1>
            <p className="text-white/70 text-base md:text-lg">{t('about.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeInView>
              <img
                src="https://media.base44.com/images/public/69dff41ed1950015f453d59f/ad8496ae3_generated_32084552.png"
                alt="Sunset terrace"
                className="w-full h-[450px] object-cover rounded-2xl"
              />
            </FadeInView>
            <FadeInView delay={0.2}>
              <div>
                <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-6">{t('about.subtitle')}</h2>
                <p className="text-foreground/80 leading-relaxed text-base mb-6">
                  {t('about.story')}
                </p>
                <div className="grid grid-cols-3 gap-6 mt-10">
                  <div className="text-center">
                    <p className="font-heading text-3xl font-semibold text-primary">5+</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('lang') === 'pt' ? 'Anos' : 'Years'}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-3xl font-semibold text-primary">200+</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('lang') === 'pt' ? 'Hóspedes' : 'Guests'}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-3xl font-semibold text-primary">4.9</p>
                    <p className="text-xs text-muted-foreground mt-1">Rating</p>
                  </div>
                </div>
              </div>
            </FadeInView>
          </div>
        </div>
      </section>
    </div>
  );
}