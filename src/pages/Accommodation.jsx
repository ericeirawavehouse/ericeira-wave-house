import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
// Ícones atualizados para as novas comodidades
import { Ban, Clock, Dog, Home, Users, BedDouble, Bath, Wifi, UtensilsCrossed, Car, Flame, Wind, Tv, Coffee, Sun, Utensils, ChefHat, Zap, Droplets, Box, Fan, Thermometer } from 'lucide-react';

import FadeInView from '../components/shared/FadeInView';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@/lib/leafletFix';

import imgSala from '@/images/Casa/imagem_sala.png';
import imgPrancha from '@/images/Casa/imagem_prancha.png';
import imgCasaDeBanho from '@/images/Casa/wc.jpeg';
import imgCozinha from '@/images/Casa/cozinha.jpeg';
// import imgEscritorio from '@/images/Casa/escritorio.jpeg'; // Descomenta isto quando tirares a foto
import imgQuarto1 from '@/images/Casa/imagem_quarto1_2.png';
import imgQuarto2 from '@/images/Casa/imagem_quarto_2_2.png';
import imgVaranda from '@/images/Casa/varanda.jpeg';

const galleryImages = [imgSala, imgPrancha, imgCasaDeBanho, imgQuarto1, imgQuarto2];

const rooms = [
  // Trocámos a ordem das imagens aqui para o Quarto Principal (room1) ficar com a cama Queen (imgQuarto2)
  { img: imgQuarto2, nameKey: 'room1', descKey: 'room1Desc' },
  { img: imgQuarto1, nameKey: 'room2', descKey: 'room2Desc' },
  // Usamos um placeholder provisório até tirares a foto. Depois substituis por: imgEscritorio
  { img: 'https://placehold.co/600x400/f3f4f6/64748b?text=Foto+do+Escritório', nameKey: 'room3', descKey: 'room3Desc' },
];

// Nova lista de comodidades mapeada para os novos ícones
const amenityIcons = {
  wifi: Wifi,
  parking: Car,
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
  const [selectedImg, setSelectedImg] = useState(0);

  return (
    <div className="pt-20">
      {/* Hero Gallery */}
      <section className="px-6 pt-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 h-[300px] md:h-[500px]">
            <div className="lg:col-span-3 rounded-2xl overflow-hidden cursor-pointer" onClick={() => setSelectedImg(0)}>
              <img src={galleryImages[0]} alt="Main" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-3 hidden lg:grid">
              {galleryImages.slice(1).map((img, i) => (
                <div key={i} className="rounded-xl overflow-hidden cursor-pointer" onClick={() => setSelectedImg(i + 1)}>
                  <img src={img} alt={`Gallery ${i + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Title + Quick Info */}
      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <FadeInView>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground tracking-wider uppercase mb-2">Ericeira, Portugal</p>
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
            <TabsList className="bg-muted/50 p-1 rounded-full mb-12 flex-wrap h-auto">
              <TabsTrigger value="overview" className="rounded-full px-6">{t('accommodation.overview')}</TabsTrigger>
              <TabsTrigger value="rooms" className="rounded-full px-6">{t('accommodation.rooms')}</TabsTrigger>
              <TabsTrigger value="amenities" className="rounded-full px-6">{t('accommodation.amenities')}</TabsTrigger>
              <TabsTrigger value="location" className="rounded-full px-6">{t('accommodation.location')}</TabsTrigger>
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

                  {/* Alteração: Galeria de 4 imagens (Sala, Varanda, Casa de Banho, Prancha) */}
                  <div className="grid grid-cols-2 gap-3">
                    <img src={imgSala} alt="Living Room" className="rounded-xl w-full h-48 object-cover" />
                    <img src={imgVaranda} alt="Balcony" className="rounded-xl w-full h-48 object-cover" />
                    <img src={imgCasaDeBanho} alt="Bathroom" className="rounded-xl w-full h-48 object-cover" />
                    <img src={imgPrancha} alt="Hallway" className="rounded-xl w-full h-48 object-cover" />
                  </div>
                </div>
              </FadeInView>
            </TabsContent>

            <TabsContent value="rooms">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {rooms.map((room, i) => (
                  <FadeInView key={room.nameKey} delay={i * 0.15}>
                    <div className="group rounded-2xl overflow-hidden bg-card border border-border">
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
    </div>
  );
}