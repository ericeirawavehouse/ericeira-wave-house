import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // O CSS tem scroll-behavior: smooth no <html>, o que faz este scroll ser
    // animado (e por vezes nem chegar ao topo no mobile). Desativa-se
    // temporariamente para o salto para o topo ser sempre instantâneo.
    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    html.style.scrollBehavior = previousScrollBehavior;
  }, [pathname]);

  return null;
}
