'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Container,
  Box,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const ServiceList = dynamic(() => import('../components/ServiceList'), {
  ssr: false,
});
const TrafficWeights = dynamic(() => import('../components/TrafficWeights'), {
  ssr: false,
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

interface Service {
  metadata: {
    name: string;
    namespace: string;
  };
}

export default function Home() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Istio Traffic Manager
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
            <Typography variant="h6" gutterBottom>
              Services
            </Typography>
            <ServiceList onServiceSelect={setSelectedService} />
          </Box>
          
          <Box sx={{ flex: '2 1 500px', minWidth: 0 }}>
            {selectedService ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Traffic Distribution for {selectedService.metadata.name}
                </Typography>
                <TrafficWeights
                  namespace={selectedService.metadata.namespace}
                  serviceName={selectedService.metadata.name}
                />
              </Box>
            ) : (
              <Typography color="text.secondary">
                Select a service to manage traffic distribution
              </Typography>
            )}
          </Box>
        </Box>
      </Container>
    </QueryClientProvider>
  );
} 