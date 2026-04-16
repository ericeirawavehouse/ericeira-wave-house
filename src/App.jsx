import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { LanguageProvider } from '@/lib/i18n';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ROTAS PÚBLICAS: Estão sempre disponíveis */}
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

      {/* ROTAS DE ADMIN: Só entram se não houver erro de auth */}
      <Route path="/admin" element={!authError ? <AdminLayout /> : <UserNotRegisteredError />}>
        <Route index element={<AdminBookings />} />
        <Route path="messages" element={<AdminMessages />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};
// 1. Simplificamos o ProtectedAdmin para não travar o render
const ProtectedAdmin = ({ children }) => {
  const auth = useAuth();
  
  // Se o context de auth falhar no Vercel, isto evita o ecrã branco
  if (!auth || auth.isLoadingAuth) return <div className="p-20 text-center">A carregar...</div>;
  
  return children;
};

function App() {
  return (
    <div className="p-20 text-center">
      <h1>Teste de Renderização</h1>
      <p>Se estás a ver isto, o problema está nos Providers (Auth ou Language).</p>
    </div>
  );
}

export default App