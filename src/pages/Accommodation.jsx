import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
// Ícones atualizados para as novas comodidades
import { Ban, Clock, Dog, Home, Users, BedDouble, Bath, Wifi, Accessibility, UtensilsCrossed, Car, Flame, Wind, Tv, Coffee, Sun, Utensils, ChefHat, Zap, Droplets, Box, Fan, Thermometer, ChevronLeft, ChevronRight, Expand } from 'lucide-react';

import FadeInView from '../components/shared/FadeInView';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@/lib/leafletFix';

import imgSala from '@/images/Casa/sala.jpeg';
import imgPrancha from '@/images/Casa/prancha.jpeg';
import imgCasaDeBanho from '@/images/Casa/wc.jpeg';
import imgCasaDeBanho2 from '@/images/Casa/wc2.jpeg';
import imgCozinha from '@/images/Casa/cozinha.jpeg';
import imgMesa from '@/images/Casa/mesa.jpeg';
import imgQuarto1 from '@/images/Casa/quarto_1.jpeg';
import imgQuarto2 from '@/images/Casa/quarto_2.jpeg';
import imgVaranda from '@/images/Casa/varanda.jpeg';
import imgEscritorio from '@/images/Casa/escritorio.jpeg';
import imgRua from '@/images/Casa/rua.jpg';

// Todas as fotos da casa, numa lista só, organizadas por divisão
const getAllPhotos = (t) => [
  { src: imgSala, alt: t('accommodation.gallery.livingRoom') },
  { src: imgMesa, alt: t('accommodation.gallery.diningArea') },
  { src: imgVaranda, alt: t('accommodation.gallery.balcony') },
  { src: imgPrancha, alt: t('accommodation.gallery.entranceHall') },
  { src: imgQuarto2, alt: t('accommodation.gallery.masterBedroom') },
  { src: imgQuarto1, alt: t('accommodation.gallery.bedroom') },
  { src: imgEscritorio, alt: t('accommodation.gallery.office') },
  { src: imgCasaDeBanho, alt: t('accommodation.gallery.bathroom') },
  { src: imgCasaDeBanho2, alt: t('accommodation.gallery.bathroom') },
  { src: imgCozinha, alt: t('accommodation.gallery.kitchen') },
  { src: imgRua, alt: t('accommodation.gallery.surroundings') },
];

const rooms = [
  // Trocámos a ordem das imagens aqui para o Quarto Principal (room1) ficar com a cama Queen (imgQuarto2)
  { img: imgQuarto2, nameKey: 'room1', descKey: 'room1Desc' },
  { img: imgQuarto1, nameKey: 'room2', descKey: 'room2Desc' },
  { img: imgEscritorio, nameKey: 'room3', descKey: 'room3Desc' },
];

// Nova lista de comodidades mapeada para os novos ícones
const amenityIcons = {
  wifi: Wifi,
  parking: Car,
  accessible: Accessibility,
  balcony: Sun,
  dining: Utensils,
  tv: Tv,
  kitchen: UtensilsCrossed,
  kitchenware: ChefHat,
  oven: Flame,
  microwave: Zap,
  coffee: Coffee,
  kettle: Droplets,
  toaster: Box,
  towels: Bath,
  hairdryer: Wind,
  fan: Fan,
  heater: Thermometer
};

export default function Accommodation() {
  const { t } = useLanguage();
  const allPhotos = getAllPhotos(t);
  const heroPhotos = allPhotos.slice(0, 5);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (src) => {
    const idx = allPhotos.findIndex((p) => p.src === src);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxOpen(true);
  };

  const showPrev = () => setLightboxIndex((i) => (i - 1 + allPhotos.length) % allPhotos.length);
  const showNext = () => setLightboxIndex((i) => (i + 1) % allPhotos.length);

  const touchStartX = useRef(null);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;
    if (deltaX > threshold) showPrev();
    else if (deltaX < -threshold) showNext();
    touchStartX.current = null;
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen]);

  const visibleCount = 4;
  const visiblePhotos = allPhotos.slice(0, visibleCount);
  const hiddenCount = allPhotos.length - visibleCount;

  return (
    <div className="pt-20">
      {/* Hero Gallery */}
      <section className="px-6 pt-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 h-[300px] md:h-[500px]">
            <div
              className="lg:col-span-3 rounded-2xl overflow-hidden cursor-pointer group relative"
              onClick={() => openLightbox(heroPhotos[0].src)}
            >
              <img src={heroPhotos[0].src} alt={heroPhotos[0].alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-3 hidden lg:grid">
              {heroPhotos.slice(1).map((photo, i) => (
                <div
                  key={i}
                  className="relative rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => openLightbox(photo.src)}
                >
                  <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => openLightbox(allPhotos[0].src)}
            className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors lg:hidden"
          >
            <Expand className="w-4 h-4" /> {t('accommodation.seeAllPhotos', { count: allPhotos.length })}
          </button>
        </div>
      </section>

      {/* Title + Quick Info */}
      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <FadeInView>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <h1 className="font-heading text-3xl md:text-5xl font-semibold">{t('accommodation.title')}</h1>
                <p className="text-lg text-muted-foreground mt-2">{t('accommodation.subtitle')}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Home, label: t('accommodation.entireHome') },
                  { icon: Users, label: t('accommodation.guests') },
                  { icon: BedDouble, label: t('accommodation.bedrooms') },
                  { icon: Bath, label: t('accommodation.bathrooms') },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full text-sm">
                    <Icon className="w-4 h-4 text-primary" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="overview">
            <TabsList className="bg-muted p-1.5 rounded-full mb-12 h-auto flex-nowrap overflow-x-auto max-w-full justify-start border border-border/60">
              <TabsTrigger value="overview" className="rounded-full px-6 shrink-0">{t('accommodation.overview')}</TabsTrigger>
              <TabsTrigger value="rooms" className="rounded-full px-6 shrink-0">{t('accommodation.rooms')}</TabsTrigger>
              <TabsTrigger value="amenities" className="rounded-full px-6 shrink-0">{t('accommodation.amenities')}</TabsTrigger>
              <TabsTrigger value="location" className="rounded-full px-6 shrink-0">{t('accommodation.location')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <FadeInView>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div>
                    <p className="text-muted-foreground leading-relaxed mb-8 text-base whitespace-pre-line">
                      {t('accommodation.description')}
                    </p>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 border-t border-border/50 pt-8 mt-8">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary/70" />
                        <span>{t('accommodation.rules.checkIn')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary/70" />
                        <span>{t('accommodation.rules.checkOut')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Car className="w-4 h-4 text-primary/70" />
                        <span>{t('accommodation.rules.parking')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Ban className="w-4 h-4 text-primary/70" />
                        <span>{t('accommodation.rules.parties')}</span>
                      </div>
                    </div>

                    <div className="mt-10">
                      <Link
                        to="/booking"
                        className="inline-block bg-primary text-primary-foreground px-10 py-3.5 text-sm font-medium tracking-wide rounded-full hover:bg-primary/90 transition-all duration-300"
                      >
                        {t('accommodation.bookNow')}
                      </Link>
                    </div>
                  </div>

                  {/* Galeria com as fotos da casa, com "+N fotos" na última visível */}
                  <div className="grid grid-cols-2 gap-3">
                    {visiblePhotos.map((photo, i) => {
                      const isLast = i === visiblePhotos.length - 1;
                      return (
                        <div
                          key={i}
                          className="rounded-xl overflow-hidden cursor-pointer group relative"
                          onClick={() => openLightbox(photo.src)}
                        >
                          <img
                            src={photo.src}
                            alt={photo.alt}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          {isLast && hiddenCount > 0 ? (
                            <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-medium text-lg">
                              {t('accommodation.morePhotos', { count: hiddenCount })}
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Expand className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FadeInView>
            </TabsContent>

            <TabsContent value="rooms">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {rooms.map((room, i) => (
                  <FadeInView key={room.nameKey} delay={i * 0.15}>
                    <div
                      className="group rounded-2xl overflow-hidden bg-card border border-border cursor-pointer"
                      onClick={() => openLightbox(room.img)}
                    >
                      <div className="h-64 overflow-hidden">
                        <img
                          src={room.img}
                          alt={t(`accommodation.${room.nameKey}`)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="font-heading text-xl font-semibold mb-2">
                          {t(`accommodation.${room.nameKey}`)}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t(`accommodation.${room.descKey}`)}
                        </p>
                      </div>
                    </div>
                  </FadeInView>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="amenities">
              <FadeInView>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.entries(amenityIcons).map(([key, Icon]) => (
                    <div key={key} className="flex flex-col items-center gap-3 p-6 bg-card rounded-xl border border-border text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{t(`accommodation.amenitiesList.${key}`)}</span>
                    </div>
                  ))}
                </div>
              </FadeInView>
            </TabsContent>

            <TabsContent value="location">
              <FadeInView>
                <div className="rounded-2xl overflow-hidden h-[400px] md:h-[500px]">
                  <MapContainer center={[38.9621115689151, -9.413252797607056]} zoom={14} className="h-full w-full z-0">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    <Marker position={[38.9621115689151, -9.413252797607056]}>
                      <Popup>Ericeira Wave House</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </FadeInView>
            </TabsContent>

          </Tabs>
        </div>
      </section>

      {/* Lightbox de fotos */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-[100vw] w-screen h-dvh sm:rounded-none border-0 bg-black/95 p-0 flex items-center justify-center [&>button]:text-white [&>button]:z-20 [&>button]:opacity-80 [&>button]:hover:opacity-100 [&>button]:top-[max(1.5rem,env(safe-area-inset-top))] sm:[&>button]:top-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <DialogTitle className="sr-only">
            {allPhotos[lightboxIndex]?.alt}
          </DialogTitle>
          {allPhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label={t('accommodation.prevPhoto')}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <img
            src={allPhotos[lightboxIndex]?.src}
            alt={allPhotos[lightboxIndex]?.alt}
            className="max-w-[92vw] max-h-[85vh] object-contain rounded-md"
          />

          {allPhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showNext(); }}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label={t('accommodation.nextPhoto')}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div className="absolute bottom-[max(2.5rem,calc(1rem+env(safe-area-inset-bottom)))] sm:bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {allPhotos[lightboxIndex]?.alt} - {lightboxIndex + 1} / {allPhotos.length}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
