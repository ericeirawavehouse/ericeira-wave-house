import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { ArrowRight } from 'lucide-react';
import FadeInView from '../shared/FadeInView';
import SectionHeading from '../shared/SectionHeading';


import imagemPraia from '../../images/Surf/Surf_Ericeira.jpg'; 
import imagemRestaurante from '../../images/Outros/restaurante.jpg';
import imagemSpots from '../../images/Outros/a_fazer.webp';


const spots = [
  { img: imagemPraia, key: 'beaches' },
  { img: imagemRestaurante, key: 'restaurants' },
  { img: imagemSpots, key: 'spots' },
];

export default function EriceiraPreview() {
  const { t } = useLanguage();

  return (
    <section className="py-24 md:py-32 px-6 bg-muted/50">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          title={t('ericeira.title')}
          subtitle={t('ericeira.subtitle')}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {spots.map((spot, i) => (
            <FadeInView key={spot.key} delay={i * 0.15}>
              <Link to="/ericeira" className="group block relative rounded-2xl overflow-hidden h-[350px]">
                <img
                  src={spot.img}
                  alt={t(`ericeira.${spot.key}`)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="font-heading text-xl text-white font-semibold mb-1">
                    {t(`ericeira.${spot.key}`)}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-white/70 text-sm group-hover:gap-2 transition-all">
                    {t('nav.ericeira')} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}