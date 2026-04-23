import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { Star } from 'lucide-react';
import FadeInView from '../shared/FadeInView';
import SectionHeading from '../shared/SectionHeading';

const testimonials = {
  pt: [
    { name: 'Maria & Bernardo', location: 'Coimbra, Portugal', text: 'Estadia maravilhosa! O espaço era exatamente o que precisavamos: limpo, confortável e super bem localizado. Tomar o pequeno-almoço no exterior foi inesquecível. Voltaremos sem dúvida!' },
    { name: 'Sarah B.', location: 'Londres, UK', text: 'A Carolina e o Nuno foram anfitriões excelentes, com muitas recomendações. A casa é ainda mais bonita pessoalmente e adorámos a possibilidade de ir a pé até às praias e aos restaurantes. A Ericeira conquistou o nosso coração.' },
    { name: 'Thomas K.', location: 'Berlim, Alemanha', text: 'Experiência perfeita - desde a casa acolhedora até às aulas de surf com o Nuno. A melhor semana que eu e os meus amigos tivemos em anos.' },
  ],
  en: [
    { name: 'Maria & Bernardo', location: 'Coimbra, Portugal', text: 'Wonderful stay! The space was exactly what we needed: clean, comfortable, and very well located. Having breakfast outside was unforgettable. We will definitely be back!' },
    { name: 'Sarah B.', location: 'London, UK', text: 'Carolina and Nuno were excellent hosts, with plenty of great recommendations. The house is even more beautiful in person and we loved being able to walk to the beaches and restaurants. Ericeira truly stole our hearts.' },
    { name: 'Thomas K.', location: 'Berlin, Germany', text: 'Perfect experience - from the cozy house to the surf lessons with Nuno. The best week me and my friends had in years.' },
  ],
};

export default function Testimonials() {
  const { t, lang } = useLanguage();

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <SectionHeading title={t('testimonials.title')} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {testimonials[lang].map((item, i) => (
            <FadeInView key={i} delay={i * 0.15}>
              <div className="bg-card border border-border rounded-2xl p-8 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array(5).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-foreground/80 leading-relaxed flex-1 text-sm italic">
                  "{item.text}"
                </p>
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.location}</p>
                </div>
              </div>
            </FadeInView>
          ))}
        </div>
      </div>
    </section>
  );
}