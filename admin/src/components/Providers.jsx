"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuthSync } from '../hooks/useAuthSync';

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());
  useAuthSync();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
