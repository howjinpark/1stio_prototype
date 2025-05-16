import { useState, useEffect } from 'react';
import {
  Box,
  Slider,
  Typography,
  Button,
  Paper,
  Stack,
  Alert,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Version {
  subset: string;
  weight: number;
}

interface TrafficWeightsProps {
  namespace: string;
  serviceName: string;
}

export default function TrafficWeights({ namespace, serviceName }: TrafficWeightsProps) {
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const { data: serviceDetails, isLoading } = useQuery({
    queryKey: ['serviceDetails', namespace, serviceName],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/api/services/${namespace}/${serviceName}`
      );
      return response.data;
    },
    enabled: !!namespace && !!serviceName,
  });

  const updateMutation = useMutation({
    mutationFn: async (newWeights: Record<string, number>) => {
      await axios.patch(
        `${API_URL}/api/services/${namespace}/${serviceName}/traffic`,
        { weights: newWeights }
      );
    },
    onSuccess: () => {
      setError(null);
    },
    onError: (err) => {
      setError('Failed to update traffic weights');
    },
  });

  useEffect(() => {
    if (serviceDetails?.virtualService) {
      const routes = serviceDetails.virtualService.spec.http[0].route;
      const initialWeights: Record<string, number> = {};
      routes.forEach((route: Version) => {
        initialWeights[route.subset] = route.weight;
      });
      setWeights(initialWeights);
    }
  }, [serviceDetails]);

  const handleWeightChange = (version: string) => (event: Event, newValue: number | number[]) => {
    const newWeight = newValue as number;
    const otherVersions = Object.keys(weights).filter((v) => v !== version);
    const remainingWeight = 100 - newWeight;
    
    const newWeights = { ...weights };
    newWeights[version] = newWeight;

    // Distribute remaining weight among other versions
    if (otherVersions.length > 0) {
      const weightPerVersion = remainingWeight / otherVersions.length;
      otherVersions.forEach((v) => {
        newWeights[v] = weightPerVersion;
      });
    }

    setWeights(newWeights);
  };

  const handleApply = () => {
    updateMutation.mutate(weights);
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Paper sx={{ p: 3, width: '100%', maxWidth: 600 }}>
      <Stack spacing={3}>
        <Typography variant="h6">Traffic Distribution</Typography>
        
        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {Object.entries(weights).map(([version, weight]) => (
          <Box key={version}>
            <Typography gutterBottom>
              {version}: {Math.round(weight)}%
            </Typography>
            <Slider
              value={weight}
              onChange={handleWeightChange(version)}
              aria-labelledby="traffic-weight-slider"
              valueLabelDisplay="auto"
              step={1}
              min={0}
              max={100}
            />
          </Box>
        ))}

        <Button
          variant="contained"
          onClick={handleApply}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Updating...' : 'Apply Changes'}
        </Button>
      </Stack>
    </Paper>
  );
} 