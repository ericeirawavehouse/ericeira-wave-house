import React from 'react';
import { motion } from 'framer-motion';

export default function SectionHeading({ title, subtitle, light = false, align = 'center' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7 }}
      className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'}`}
    >
      <h2 className={`font-heading text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 ${light ? 'text-white' : 'text-foreground'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base md:text-lg max-w-2xl ${align === 'center' ? 'mx-auto' : ''} ${light ? 'text-white/70' : 'text-muted-foreground'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}