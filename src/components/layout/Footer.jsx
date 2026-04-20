import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background/80">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-heading text-2xl font-semibold text-background mb-4">Ericeira Wave House</h3>
            <p className="text-sm leading-relaxed opacity-70 max-w-xs">
              {t('hero.subtitle')}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-background mb-4">Links</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/accommodation" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t('nav.accommodation')}</Link>
              <Link to="/surf" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t('nav.surf')}</Link>
              <Link to="/ericeira" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t('nav.ericeira')}</Link>
              <Link to="/booking" className="text-sm opacity-70 hover:opacity-100 transition-opacity">{t('nav.book')}</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-wider uppercase text-background mb-4">{t('contact.title')}</h4>
            <div className="flex flex-col gap-3">
              <a href="mailto:ericeirawavehouse@gmail.com" className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <Mail className="w-4 h-4" /> ericeirawavehouse@gmail.com
              </a>
              <a href="tel:+351960461100" className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition-opacity">
                <Phone className="w-4 h-4" /> +351 960 461 100 
              </a>
              <p className="flex items-center gap-2 text-sm opacity-70">
                <MapPin className="w-4 h-4" /> Ericeira, Portugal
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 mt-12 pt-8 text-center">
          <p className="text-xs opacity-50">© {new Date().getFullYear()} Ericeira Wave House. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}