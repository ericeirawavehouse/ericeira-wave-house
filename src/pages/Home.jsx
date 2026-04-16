import React from 'react';
import HeroSlideshow from '../components/home/HeroSlideshow';
import AccommodationPreview from '../components/home/AccommodationPreview';
import SurfPreview from '../components/home/SurfPreview';
import EriceiraPreview from '../components/home/EriceiraPreview';
import Testimonials from '../components/home/Testimonials';

export default function Home() {
  return (
    <div>
      <HeroSlideshow />
      <AccommodationPreview />
      <SurfPreview />
      <EriceiraPreview />
      <Testimonials />
    </div>
  );
}