import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Alert,
   
} from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface EvolutionData {
  generation: number;
  best_fitness: number;
  average_fitness?: number;
  population_diversity?: number;
}

export const OptimizationDashboard: React.FC = () => {
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([]);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [wsStatus, setWsStatus] = useState<string>('disconnected');
  //const toast = useToast();

  const startNewTask = async () => {
    try {
      console.log('Starting new optimization task...');
      const response = await fetch('http://localhost:8000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem_type: 'tsp',
          population_size: 50,
          dimension: 10,
          mutation_rate: 0.5,
          crossover_rate: 0.8,
          max_generations: 100,
          parameters: {
            cities: [
              [0, 0],
              [1, 3],
              [2, 1],
              [3, 9],
              [5, 3],
              [0, 10],
              [1, 8],
              [21, 1],
              [3, 59],
              [5, 13],
            ]
          }
        }),
      });

      const data = await response.json();
      console.log('Task created:', data);
      setCurrentTask(data.task_id);
      setIsRunning(true);
      setEvolutionData([]);
      connectToWebSocket(data.task_id);

    } catch (error) {
      console.error('Error starting task:', error);
    //   toast({
    //     title: 'Error',
    //     description: 'Failed to start optimization task',
    //     status: 'error',
    //     duration: 5000,
    //     isClosable: true,
    //   });
    }
  };

  const connectToWebSocket = (taskId: string) => {
    console.log(`Connecting to WebSocket for task ${taskId}...`);
    setWsStatus('connecting');

    const ws = new WebSocket(`ws://localhost:8000/ws/tasks/${taskId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsStatus('connected');
    //   toast({
    //     title: 'Connected',
    //     description: 'WebSocket connection established',
    //     status: 'success',
    //     duration: 3000,
    //     isClosable: true,
    //   });
    };

    ws.onmessage = (event) => {
      try {
        // Parse the incoming WebSocket data
        const data = JSON.parse(event.data);
        console.log('Received update:', data);
        
        // Verify data exists and has the required properties
        if (data && typeof data.best_fitness === 'number') {
          setEvolutionData(prev => [...prev, {
            generation: data.generation,
            best_fitness: data.best_fitness,  // Keep original value, handle display logic in chart
            averageFitness: data.average_fitness,
            populationDiversity: data.population_diversity,
            status: data.status
          }]);
        } else {
          console.error('Received malformed data:', data);
          console.error('Type of data.best_fitness:', typeof data.best_fitness);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setWsStatus('disconnected');
      setIsRunning(false)
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsStatus('error');
    //   toast({
    //     title: 'Connection Error',
    //     description: 'Failed to connect to optimization server',
    //     status: 'error',
    //     duration: 5000,
    //     isClosable: true,
    //   });
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  };

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <VStack padding={6} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="2xl">Genetic Algorithm Optimization</Text>
          <Button 
            colorScheme="blue" 
            onClick={startNewTask}
            disabled={isRunning}
          >
            Start New Optimization
          </Button>
        </HStack>

        {/* <Alert status={wsStatus === 'connected' ? 'success' : 'info'}>
          <AlertIcon />
          Connection Status: {wsStatus}
        </Alert> */}

        {currentTask && (
          <Text fontSize="sm" color="gray.600">
            Current Task ID: {currentTask}
          </Text>
        )}

        <Box borderWidth={1} borderRadius="lg" p={4}>
          {evolutionData.length > 0 ? (
            <Box w="100%" h="400px">
              <LineChart
                data={evolutionData}
                width={1100}
                height={400}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="generation" 
                  label={{ value: 'Generation', position: 'bottom' }} 
                />
                <YAxis 
                  label={{ value: 'Fitness', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="best_fitness"
                  stroke="#8884d8"
                  name="Best Fitness"
                />
                <Line
                  type="monotone"
                  dataKey="average_fitness"
                  stroke="#82ca9d"
                  name="Average Fitness"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="population_diversity"
                  stroke="#ffc658"
                  name="Diversity"
                  dot={false}
                />
              </LineChart>
            </Box>
          ) : (
            <Text color="gray.500" textAlign="center" py={20}>
              No data yet. Start an optimization task to see results.
            </Text>
          )}
        </Box>
      </VStack>
    </Box>
  );
};