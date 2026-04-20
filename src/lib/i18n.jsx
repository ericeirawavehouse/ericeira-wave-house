import React, { createContext, useContext, useState, useEffect } from 'react';

/** @type {any} */
const translations = {
  pt: {
    nav: {
      home: 'Início',
      accommodation: 'Alojamento',
      surf: 'Surf',
      ericeira: 'Ericeira',
      about: 'Sobre Nós',
      contact: 'Contacto',
      book: 'Reservar',
    },
    // ... restante das traduções PT
    hero: {
      title: 'O teu refúgio junto ao mar',
      subtitle: 'Vive a Ericeira com alma. Alojamento exclusivo e experiências únicas na costa portuguesa.',
      cta: 'Reservar',
    },
    accommodation: {
      title: 'Ericeira Wave House',
      subtitle: 'Central & Spacious Apartment',
      description: 'Ideal para casais, amigos ou nómadas digitais, dispõe de dois quartos duplos, um escritório com sofá-cama, casa de banho, cozinha equipada e uma zona de estar com mesa de jantar. \nLocalização privilegiada, a apenas 5 minutos a pé do centro da vila, com todas as comodidades e fácil acesso às principais praias. Situado numa zona tranquila, combina conforto e conveniência.',
      entireHome: 'Apartamento Inteiro',
      guests: '5 Hóspedes',
      bedrooms: '3 Quartos',
      bathrooms: '1 Casa de Banho',
      overview: 'Visão Geral',
      rooms: 'Quartos & Camas',
      amenities: 'Comodidades',
      location: 'Localização',
      bookNow: 'Reservar Agora',
      room1: 'Quarto Principal',
      room1Desc: '1 Cama de Casal - Quarto espaçoso e ensolarado.',
      room2: 'Quarto de Hóspedes',
      room2Desc: '1 Cama de Casal - Ambiente calmo e confortável.',
      room3: 'Escritório / Quarto 3',
      room3Desc: '1 Sofá-cama individual extragrande - Perfeito para trabalho ou um hóspede extra.',
      amenitiesList: {
        wifi: "Wi-Fi Rápido",
        kitchen: "Cozinha Totalmente Equipada",
        parking: "Estacionamento Privado",
        washer: "Máquina de Lavar Roupa",
        towels: "Toalhas & Essenciais",
        tv: "Televisão",
        coffee: "Máquina de Café",
        pets: "Cães Permitidos (sob consulta)"
      }
    },


    
    surf: {
      title: 'Surf na Ericeira',
      subtitle: 'Sente a energia do oceano',
      description: 'Junta-te a nós para uma experiência única no mar. Aulas para todos os níveis, com instrutores locais apaixonados pelo surf e pela Ericeira.',
      bookLesson: 'Reservar Aula',
      experience: 'A Experiência',
      experienceDesc: 'Mais do que uma aula, é uma imersão. Ondas perfeitas, boa energia e memórias para a vida. Não precisas de experiência - só de vontade de te divertir.',
    },
    ericeira: {
      title: 'Descobre a Ericeira',
      subtitle: 'Um guia local para a tua estadia',
      beaches: 'Praias',
      restaurants: 'Restaurantes',
      spots: 'Spots Locais',
      experiences: 'Experiências',
    },
    about: {
      title: 'Sobre Nós',
      subtitle: 'A nossa história',
      story: 'Nascemos da paixão pelo mar e pelo estilo de vida da Ericeira. Depois de anos a surfar estas ondas e a explorar cada recanto desta vila, decidimos partilhar este lugar especial contigo. A nossa casa é mais do que um alojamento - é um convite a viver a Ericeira como um local.',
    },
    contact: {
      title: 'Contacto',
      subtitle: 'Estamos aqui para ti',
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      subject: 'Assunto',
      message: 'Mensagem',
      send: 'Enviar',
      success: 'Mensagem enviada com sucesso!',
    },
    booking: {
      title: 'Reservar',
      subtitle: 'Escolhe a tua experiência',
      accommodationType: 'Alojamento',
      surfType: 'Aula de Surf',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      surfDate: 'Data da aula',
      surfTime: 'Hora preferida',
      guestName: 'Nome completo',
      guestEmail: 'Email',
      guestPhone: 'Telefone',
      guests: 'Número de hóspedes',
      notes: 'Notas adicionais',
      submit: 'Pedir Reserva',
      success: 'Pedido enviado! Entraremos em contacto brevemente.',
      morning: 'Manhã (9h-12h)',
      afternoon: 'Tarde (14h-17h)',
    },
    testimonials: {
      title: 'O que dizem os nossos hóspedes',
    },
    footer: {
      rights: 'Todos os direitos reservados.',
      followUs: 'Segue-nos',
    },
  },
  en: {
    nav: {
      home: 'Home',
      accommodation: 'Accommodation',
      surf: 'Surf',
      ericeira: 'Ericeira',
      about: 'About',
      contact: 'Contact',
      book: 'Book Now',
    },
    // ... restante das traduções EN
    hero: {
      title: 'Your refuge by the sea',
      subtitle: 'Experience Ericeira with soul. Exclusive accommodation and unique experiences on the Portuguese coast.',
      cta: 'Book Now',
    },
    accommodation: {
      title: 'The House',
      subtitle: 'An entire retreat just for you',
      description: 'Ideal for couples, friends, or digital nomads, this property features two double bedrooms, an office with a sofa bed, a bathroom, a fully equipped kitchen, and a living area with a dining table.\nPrime location, just a 5-minute walk from the village center, close to all amenities and with easy access to the main beaches. Situated in a quiet area, it perfectly combines comfort and convenience.',
      overview: 'Overview',
      rooms: 'Rooms',
      amenities: 'Amenities',
      location: 'Location',
      entireHome: 'Entire Home',
      guests: 'Up to 5 guests',
      bedrooms: '3 Bedrooms',
      bathrooms: '1 Bathroom',
      bookNow: 'Book Now',
      room1: 'Master Suite',
      room1Desc: 'Spacious suite with double bed, abundant natural light and serene views.',
      room2: 'Ocean Room',
      room2Desc: 'Cozy room with double bed and ocean-inspired tones.',
      room3: 'Garden Room',
      room3Desc: 'Twin room with garden view, perfect for friends or children.',
      amenitiesList: {
        wifi: 'High-speed Wi-Fi',
        kitchen: 'Fully equipped kitchen',
        garden: 'Private garden',
        parking: 'Free parking',
        bbq: 'BBQ area',
        ac: 'Air conditioning',
        washer: 'Washing machine',
        towels: 'Bed linen & towels',
        tv: 'Smart TV',
        coffee: 'Coffee machine',
      },
    },
    surf: {
      title: 'Surf in Ericeira',
      subtitle: 'Feel the ocean\'s energy',
      description: 'Join us for a unique ocean experience. Lessons for all levels, with local instructors passionate about surfing and Ericeira.',
      bookLesson: 'Book Lesson',
      experience: 'The Experience',
      experienceDesc: 'More than a lesson, it\'s an immersion. Perfect waves, good vibes and memories for life. No experience needed - just the will to have fun.',
    },
    ericeira: {
      title: 'Discover Ericeira',
      subtitle: 'A local guide for your stay',
      beaches: 'Beaches',
      restaurants: 'Restaurants',
      spots: 'Local Spots',
      experiences: 'Experiences',
    },
    about: {
      title: 'About Us',
      subtitle: 'Our story',
      story: 'We were born from a passion for the sea and the Ericeira lifestyle. After years of surfing these waves and exploring every corner of this village, we decided to share this special place with you. Our house is more than accommodation - it\'s an invitation to live Ericeira like a local.',
    },
    contact: {
      title: 'Contact',
      subtitle: 'We\'re here for you',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      subject: 'Subject',
      message: 'Message',
      send: 'Send',
      success: 'Message sent successfully!',
    },
    booking: {
      title: 'Book',
      subtitle: 'Choose your experience',
      accommodationType: 'Accommodation',
      surfType: 'Surf Lesson',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      surfDate: 'Lesson date',
      surfTime: 'Preferred time',
      guestName: 'Full name',
      guestEmail: 'Email',
      guestPhone: 'Phone',
      guests: 'Number of guests',
      notes: 'Additional notes',
      submit: 'Request Booking',
      success: 'Request sent! We\'ll be in touch shortly.',
      morning: 'Morning (9am-12pm)',
      afternoon: 'Afternoon (2pm-5pm)',
    },
    testimonials: {
      title: 'What our guests say',
    },
    footer: {
      rights: 'All rights reserved.',
      followUs: 'Follow us',
    },
  },
};

// Alterado para evitar erro de atribuição no Provider
const LanguageContext = createContext(/** @type {any} */ (null));

/** @param {{ children: React.ReactNode }} props */
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lang') || 'pt';
    }
    return 'pt';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  /** @param {string} path */
  const t = (path) => {
    const keys = path.split('.');
    let result = translations[lang] || translations['pt']; 
    
    for (const key of keys) {
      result = result?.[key];
    }
    return result || path;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** @returns {{ lang: string, setLang: Function, t: (path: string) => string }} */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}