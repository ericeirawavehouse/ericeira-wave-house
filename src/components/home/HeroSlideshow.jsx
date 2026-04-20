import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';



import imagemCapa1 from '../../images/Capa/1.jpg'; 
import imagemCapa2 from '../../images/Capa/2.jpg'; 
import imagemCapa3 from '../../images/Capa/3.jpg'; 

const slides = [
  imagemCapa1,
  imagemCapa2,
  imagemCapa3,
];

export default function HeroSlideshow() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <img
            src={slides[current]}
            alt="Ericeira Wave House"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <p className="text-white/80 text-sm md:text-base tracking-[0.3em] uppercase mb-4 font-body">
            Ericeira, Portugal
          </p>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl text-white font-semibold mb-6 leading-tight">
            {t('hero.title')}
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-xl mx-auto mb-10 font-light leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <Link
            to="/booking"
            className="inline-block bg-white text-foreground px-10 py-4 text-sm font-medium tracking-wider uppercase rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105"
          >
            {t('hero.cta')}
          </Link>
        </motion.div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i === current ? 'bg-white w-8' : 'bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="w-6 h-6 text-white/60" />
      </motion.div>
    </section>
  );
}