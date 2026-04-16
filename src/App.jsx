import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { LanguageProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/AuthContext';
import { Toaster } from "@/components/ui/toaster";

import SiteLayout from './components/layout/SiteLayout';
import Home from './pages/Home';
import Accommodation from './pages/Accommodation';
import Surf from './pages/Surf';
import Ericeira from './pages/Ericeira';
import About from './pages/About';
import Contact from './pages/Contact';
import Booking from './pages/Booking';
import CheckInForm from './pages/CheckInForm';
import AdminLayout from './components/admin/AdminLayout';
import AdminBookings from './pages/admin/AdminBookings';
import AdminMessages from './pages/admin/AdminMessages';
import PageNotFound from './lib/PageNotFound';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Rotas principais do site */}
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/accommodation" element={<Accommodation />} />
                <Route path="/surf" element={<Surf />} />
                <Route path="/ericeira" element={<Ericeira />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/checkin" element={<CheckInForm />} />
              </Route>

              {/* Rotas de Admin - Sem travar o resto do site */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminBookings />} />
                <Route path="messages" element={<AdminMessages />} />
              </Route>

              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;