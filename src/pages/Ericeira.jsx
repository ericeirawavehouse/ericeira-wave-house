import React from 'react';
import { useLanguage } from '@/lib/i18n';
import FadeInView from '../components/shared/FadeInView';
import SectionHeading from '../components/shared/SectionHeading';

import imagemRua from '../images/Outros/rua_eri.jpg';
import imagemPraia from '../images/Surf/Surf_Ericeira.jpg'; 
import imagemRestaurante from '../images/Outros/restaurante.jpg';
import imagemExperiencias from '../images/Outros/trilho.jpg';
import imagemEriceira from '../images/Capa/ericeira.png';

const sections = {
  pt: {
    beaches: {
      title: 'Praias',
      items: [
        { name: 'Surf', desc: 'Praia de Ribeira d\'Ilhas, Praia da Empa, Praia do Matadouro.' },
        { name: 'Relaxar', desc: 'Praia da Foz do Lizandro, Praia do Sul, Praia de São Sebastião.' },
        { name: 'Vista', desc: 'Praia de São Julião, Praia de São Lourenço, Praia dos Coxos.' },
      ],
    },
    restaurants: {
      title: 'Restaurantes',
      items: [
        { name: 'Jangada', desc: 'Espaço acolhedor com uma seleção variada de pratos de sabores requintados.' },
        { name: 'Ti Matilde', desc: 'Restaurante tradicional de ambiente familiar conhecido pelo peixe e marisco frescos.' },
        { name: 'A Panela', desc: 'Restaurante no centro da vila com cozinha portuguesa contemporânea.' },
      ],
    },
    spots: {
      title: 'Spots Locais',
      items: [
        { name: 'Centro Histórico', desc: 'Ruelas encantadoras, azulejos tradicionais e lojas de artesanato.' },
        { name: 'Miradouro de Santa Marta', desc: 'Vista panorâmica sobre o oceano e a vila.' },
        { name: 'Mercado da Ericeira', desc: 'Produtos locais frescos, peixe do dia e artesanato.' },
      ],
    },
    experiences: {
      title: 'Experiências',
      items: [
        { name: 'Trilhos Costeiros', desc: 'Caminhadas com vistas deslumbrantes sobre o Atlântico.' },
        { name: 'Yoga ao Pôr-do-Sol', desc: 'Sessões relaxantes com vista para o mar.' },
        { name: 'Wine Tasting', desc: 'Descobre os vinhos da região numa experiência premium.' },
      ],
    },
  },
  en: {
    beaches: {
      title: 'Beaches',
      items: [
        { name: 'Surf', desc: 'Praia de Ribeira d\'Ilhas, Praia da Empa, Praia do Matadouro.' },
        { name: 'Relaxing', desc: 'Praia da Foz do Lizandro, Praia do Sul, Praia de São Sebastião.' },
        { name: 'Views', desc: 'Praia de São Julião, Praia de São Lourenço, Praia dos Coxos.' },
      ],
    },
    restaurants: {
      title: 'Restaurants',
      items: [
        { name: 'Jangada', desc: 'Welcoming space with a diverse selection of exquisitely flavored dishes.' },
        { name: 'Ti Matilde', desc: 'Traditional restaurant with a family atmosphere, known for its fresh fish and seafood.' },
        { name: 'A Panela', desc: 'Restaurant in the town center featuring contemporary Portuguese cuisine.' },
      ],
    },
    spots: {
      title: 'Local Spots',
      items: [
        { name: 'Historic Centre', desc: 'Charming alleys, traditional tiles and craft shops.' },
        { name: 'Santa Marta Viewpoint', desc: 'Panoramic view over the ocean and the village.' },
        { name: 'Ericeira Market', desc: 'Fresh local produce, catch of the day and crafts.' },
      ],
    },
    experiences: {
      title: 'Experiences',
      items: [
        { name: 'Coastal Trails', desc: 'Hikes with stunning views over the Atlantic.' },
        { name: 'Sunset Yoga', desc: 'Relaxing sessions overlooking the sea.' },
        { name: 'Wine Tasting', desc: 'Discover the region\'s wines in a premium experience.' },
      ],
    },
  },
};

const sectionImages = {
  beaches: imagemPraia,
  restaurants: imagemRestaurante,
  spots: imagemRua,
  experiences: imagemExperiencias,
};

export default function Ericeira() {
  const { t, lang } = useLanguage();
  const data = sections[lang];

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh]">
        <img src={imagemEriceira} alt="Ericeira" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-12 left-6 right-6 md:bottom-16 md:left-12">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-heading text-4xl md:text-6xl text-white font-semibold mb-3">{t('ericeira.title')}</h1>
            <p className="text-white/70 text-base md:text-lg">{t('ericeira.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* Sections */}
      {Object.entries(data).map(([key, section], i) => (
        <section key={key} className={`py-20 md:py-28 px-6 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
          <div className="max-w-7xl mx-auto">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              <FadeInView className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <img
                  src={sectionImages[key]}
                  alt={section.title}
                  className="w-full h-[350px] md:h-[400px] object-cover rounded-2xl"
                />
              </FadeInView>
              <FadeInView delay={0.2} className={i % 2 === 1 ? 'lg:order-1' : ''}>
                <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-8">{section.title}</h2>
                <div className="space-y-6">
                  {section.items.map((item) => (
                    <div key={item.name} className="border-l-2 border-primary/30 pl-5">
                      <h3 className="font-medium text-base mb-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </FadeInView>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}