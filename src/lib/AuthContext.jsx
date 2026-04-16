import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Simulamos um login automático para o Admin funcionar no Vercel
    // No futuro, podes ligar aqui o supabase.auth.getSession()
    const fakeAdmin = { 
      id: '1', 
      name: 'Admin Ericeira', 
      role: 'admin',
      email: 'ericeirawavehouse@gmail.com' 
    };
    
    setUser(fakeAdmin);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
  }, []);

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const navigateToLogin = () => {
    window.location.href = '/admin';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      logout,
      navigateToLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};