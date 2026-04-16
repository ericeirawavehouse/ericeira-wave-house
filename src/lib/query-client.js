import { QueryClient } from "@tanstack/react-query";

// Criamos a instância do cliente de queries
export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      // Configurações padrão: não recarregar ao mudar de aba, etc.
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});