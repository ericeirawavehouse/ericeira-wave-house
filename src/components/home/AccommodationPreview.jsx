import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { Home, Users, BedDouble, ArrowRight } from 'lucide-react';
import FadeInView from '../shared/FadeInView';
import SectionHeading from '../shared/SectionHeading';

import imagemSala from '../../images/Casa/imagem_sala.png'; 
import imagemPrancha from '../../images/Casa/imagem_prancha.png';


export default function AccommodationPreview() {
  const { t } = useLanguage();

  const features = [
    { icon: Home, label: t('accommodation.entireHome') },
    { icon: Users, label: t('accommodation.guests') },
    { icon: BedDouble, label: t('accommodation.bedrooms') },
  ];

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          title={t('accommodation.title')}
          subtitle={t('accommodation.subtitle')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-8">
          <FadeInView>
            <div className="relative">
              <img
                src={imagemSala} 
                alt="Sala de estar"
                className="w-full h-[400px] md:h-[500px] object-cover rounded-2xl"
              />
              <div className="absolute -bottom-6 -right-6 w-48 h-48 rounded-xl overflow-hidden shadow-xl hidden md:block">
                <img
                  src={imagemPrancha}
                  alt="Corredor"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </FadeInView>

          <FadeInView delay={0.2}>
            <div className="lg:pl-8">
              <p className="text-muted-foreground leading-relaxed mb-8 text-base">
                {t('accommodation.description')}
              </p>
              <div className="flex flex-wrap gap-6 mb-10">
                {features.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    {label}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/accommodation"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all duration-300"
                >
                  {t('accommodation.overview')} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/booking"
                  className="inline-block bg-primary text-primary-foreground px-8 py-3 text-sm font-medium tracking-wide rounded-full hover:bg-primary/90 transition-all duration-300"
                >
                  {t('accommodation.bookNow')}
                </Link>
              </div>
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}