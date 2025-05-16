import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Service {
  metadata: {
    name: string;
    namespace: string;
  };
}

export default function ServiceList({ onServiceSelect }: { onServiceSelect: (service: Service) => void }) {
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/services`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="error">Error loading services</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', maxWidth: 360 }}>
      <List>
        {services?.map((service: Service) => (
          <ListItem key={`${service.metadata.namespace}/${service.metadata.name}`} disablePadding>
            <ListItemButton onClick={() => onServiceSelect(service)}>
              <ListItemText
                primary={service.metadata.name}
                secondary={`Namespace: ${service.metadata.namespace}`}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
} 