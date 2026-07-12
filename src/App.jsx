import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { LanguageProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/AuthContext';
import { Toaster } from "@/components/ui/toaster";

import ScrollToTop from './components/shared/ScrollToTop';
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
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminMessages from './pages/admin/AdminMessages';
import AdminTrash from './pages/admin/AdminTrash';
import AdminPricing from './pages/admin/AdminPricing';
import AdminLogin from './pages/admin/AdminLogin';
import PageNotFound from './lib/PageNotFound';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
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

              {/* Rotas de Admin - protegidas por login */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="trash" element={<AdminTrash />} />
                <Route path="pricing" element={<AdminPricing />} />
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