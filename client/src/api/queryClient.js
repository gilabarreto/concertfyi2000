import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos (os dados ficam "frescos" por 5 minutos antes de precisar de revalidação)
      cacheTime: 15 * 60 * 1000, // 15 minutos (os dados ficam no cache por 15 minutos)
      retry: 2, // Número de tentativas em caso de erro
      refetchOnWindowFocus: true, // Revalida os dados quando a janela ganha foco
      refetchOnReconnect: true, // Revalida os dados quando a conexão é restabelecida
    },
  },
});