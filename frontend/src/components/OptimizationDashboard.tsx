import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import OptimizationForm from './OptimizationForm';
import { Card, CardContent } from "./ui/card";

// Type definitions
interface City extends Array<number> {
  0: number;
  1: number;
}

interface OptimizationFormData {
  problem_type: 'tsp';
  population_size: number;
  dimension: number;
  mutation_rate: number;
  crossover_rate: number;
  max_generations: number;
  parameters: {
    cities: City[];
  };
}

interface EvolutionData {
  generation: number;
  best_fitness: number;
  current_fitness: number;
  average_fitness?: number;
  population_diversity?: number;
  status: string;
}

interface TaskResponse {
  task_id: string;
  status: string;
}

export const OptimizationDashboard: React.FC = () => {
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([]);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');

  const startNewTask = async (formData: OptimizationFormData) => {
    try {
      console.log('Starting new optimization task...', formData);
      const response = await fetch('http://localhost:8000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: TaskResponse = await response.json();
      console.log('Task created:', data);
      setCurrentTask(data.task_id);
      setIsRunning(true);
      setEvolutionData([]);
      connectToWebSocket(data.task_id);

    } catch (error) {
      console.error('Error starting task:', error);
      setIsRunning(false);
    }
  };

  const connectToWebSocket = (taskId: string) => {
    console.log(`Connecting to WebSocket for task ${taskId}...`);
    setWsStatus('connecting');

    const ws = new WebSocket(`ws://localhost:8000/ws/tasks/${taskId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsStatus('connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: EvolutionData = JSON.parse(event.data);
        console.log('Received update:', data);
        
        if (data && typeof data.best_fitness === 'number') {
          setEvolutionData(prev => [...prev, {
            generation: data.generation,
            best_fitness: data.best_fitness,
            current_fitness: data.current_fitness,
            average_fitness: data.average_fitness,
            population_diversity: data.population_diversity,
            status: data.status
          }]);
        } else {
          console.error('Received malformed data:', data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setWsStatus('disconnected');
      setIsRunning(false);
    };

    ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      setWsStatus('error');
      setIsRunning(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold">Genetic Algorithm Optimization</h2>
      </div>

      {currentTask && (
        <div className="text-sm text-gray-500">
          Current Task ID: {currentTask}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <OptimizationForm onSubmit={startNewTask} isRunning={isRunning} />

        <Card>
          <CardContent className="p-6">
            {evolutionData.length > 0 ? (
              <div className="w-full h-[400px]">
                <LineChart
                  data={evolutionData}
                  width={500}
                  height={400}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="generation" 
                    label={{ 
                      value: 'Generation', 
                      position: 'bottom',
                      offset: -5
                    }} 
                  />
                  <YAxis 
                    label={{ 
                      value: 'Fitness', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: -5
                    }} 
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="best_fitness"
                    stroke="#2563eb"
                    name="Best Fitness"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="average_fitness"
                    stroke="#4ade80"
                    name="Average Fitness"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="population_diversity"
                    stroke="#f59e0b"
                    name="Diversity"
                    dot={false}
                  />
                </LineChart>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                No data yet. Start an optimization task to see results.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OptimizationDashboard;