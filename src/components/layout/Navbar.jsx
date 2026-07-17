import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const [showLangHint, setShowLangHint] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('langHintSeen')) {
      const showTimer = setTimeout(() => setShowLangHint(true), 1200);
      return () => clearTimeout(showTimer);
    }
  }, []);

  useEffect(() => {
    if (showLangHint) {
      const hideTimer = setTimeout(dismissLangHint, 6000);
      return () => clearTimeout(hideTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLangHint]);

  const dismissLangHint = () => {
    setShowLangHint(false);
    localStorage.setItem('langHintSeen', '1');
  };

  const handleLangClick = () => {
    setLang(lang === 'pt' ? 'en' : 'pt');
    dismissLangHint();
  };

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/accommodation', label: t('nav.accommodation') },
    { path: '/surf', label: t('nav.surf') },
    { path: '/ericeira', label: t('nav.ericeira') },
    { path: '/about', label: t('nav.about') },
    { path: '/contact', label: t('nav.contact') },
  ];

  const bgClass = scrolled || !isHome || menuOpen
    ? 'bg-background/95 backdrop-blur-md shadow-sm'
    : 'bg-transparent';

  const textClass = scrolled || !isHome
    ? 'text-foreground'
    : 'text-white';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className={`flex items-center gap-2 font-heading text-2xl font-semibold tracking-wide transition-colors duration-300 ${textClass}`}>
          <img src="/favicon_sem_fundo.png" alt="" className="w-9 h-9 object-contain" />
          <span translate="no" className="notranslate">Ericeira Wave House</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium tracking-wide transition-all duration-300 hover:opacity-70 ${
                location.pathname === link.path ? 'opacity-100' : 'opacity-75'
              } ${textClass}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="relative">
            <button
              onClick={handleLangClick}
              className={`flex items-center gap-1.5 text-sm opacity-75 hover:opacity-100 transition-opacity ${textClass}`}
            >
              <Globe className="w-4 h-4" />
              {lang.toUpperCase()}
            </button>
            <AnimatePresence>
              {showLangHint && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-max bg-foreground text-background text-xs px-3 py-2 rounded-lg shadow-lg z-50"
                >
                  Switch language / Mudar idioma
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-foreground rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link
            to="/booking"
            className="bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium tracking-wide rounded-full hover:bg-primary/90 transition-all duration-300"
          >
            {t('nav.book')}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 lg:hidden">
          <div className="relative">
            <button
              onClick={handleLangClick}
              className={`flex items-center gap-1 text-sm transition-colors ${textClass}`}
            >
              <Globe className="w-4 h-4" />
              {lang.toUpperCase()}
            </button>
            <AnimatePresence>
              {showLangHint && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-max max-w-[200px] bg-foreground text-background text-xs px-3 py-2 rounded-lg shadow-lg z-50"
                >
                  Switch language / Mudar idioma
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-foreground rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className={`transition-colors ${menuOpen ? 'text-foreground' : textClass}`}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/98 backdrop-blur-md border-t border-border overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-base font-medium py-2 transition-colors ${
                    location.pathname === link.path ? 'text-primary' : 'text-foreground/70'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/booking"
                className="bg-primary text-primary-foreground px-6 py-3 text-sm font-medium tracking-wide rounded-full text-center mt-2 hover:bg-primary/90 transition-all"
              >
                {t('nav.book')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}