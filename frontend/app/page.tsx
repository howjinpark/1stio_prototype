'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Box,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';

interface K8sService {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    ports: Array<{
      port: number;
      protocol: string;
      targetPort: number;
    }>;
  };
}

interface WeightData {
  [key: string]: number;
}

export default function Home() {
  const [services, setServices] = useState<K8sService[]>([]);
  const [selectedService, setSelectedService] = useState<K8sService | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [weights, setWeights] = useState<WeightData>({});
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to fetch services');
    }
  };

  const handleEditWeights = async (service: K8sService) => {
    try {
      const details = await axios.get(
        `http://localhost:3001/api/services/${service.metadata.namespace}/${service.metadata.name}`
      );
      
      setSelectedService(service);
      const initialWeights: WeightData = {};
      const routes = details.data.virtualService.spec.http[0].route;
      
      routes.forEach((route: any) => {
        initialWeights[route.destination.subset] = route.weight;
      });
      
      setWeights(initialWeights);
      setIsDialogOpen(true);
      setError('');
    } catch (error) {
      console.error('Error fetching service details:', error);
      setError('Failed to fetch service details');
    }
  };

  const handleWeightChange = (version: string) => (event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    const otherVersion = Object.keys(weights).find(k => k !== version);
    
    if (otherVersion) {
      setWeights({
        [version]: value,
        [otherVersion]: 100 - value
      });
    }
  };

  const handleSave = async () => {
    if (!selectedService) return;

    try {
      await axios.patch(
        `http://localhost:3001/api/services/${selectedService.metadata.namespace}/${selectedService.metadata.name}/traffic`,
        { weights }
      );
      setIsDialogOpen(false);
      fetchServices();
      setError('');
    } catch (error) {
      console.error('Error updating weights:', error);
      setError('Failed to update traffic weights');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Istio Traffic Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        <List>
          {services.map((service) => (
            <ListItem key={`${service.metadata.namespace}/${service.metadata.name}`}>
              <ListItemText
                primary={service.metadata.name}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      Namespace: {service.metadata.namespace}
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2">
                      Ports: {service.spec.ports.map(p => `${p.port}/${p.protocol}`).join(', ')}
                    </Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleEditWeights(service)}>
                  <EditIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Traffic Weights
          {selectedService && ` - ${selectedService.metadata.name}`}
        </DialogTitle>
        <DialogContent>
          {Object.entries(weights).map(([version, weight]) => (
            <Box key={version} sx={{ my: 2 }}>
              <Typography gutterBottom>
                Version {version}: {weight}%
              </Typography>
              <Slider
                value={weight}
                onChange={handleWeightChange(version)}
                valueLabelDisplay="auto"
                step={1}
                marks
                min={0}
                max={100}
              />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
