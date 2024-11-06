import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import OptimizationForm from './OptimizationForm';
import { config } from '../config';

type City = {
  x: number;
  y: number;
};

interface EvolutionData {
  generation: number;
  best_fitness: number;
  best_solution?: number[];
  average_fitness?: number;
  population_diversity?: number;
}

interface TSPVisualizationProps {
  cities: City[];
  currentPath: number[];
}

const TSPVisualization: React.FC<TSPVisualizationProps> = ({ cities, currentPath = [] }) => {
  const padding = 20;
  const minX = Math.min(...cities.map(city => city.x));
  const maxX = Math.max(...cities.map(city => city.x));
  const minY = Math.min(...cities.map(city => city.y));
  const maxY = Math.max(...cities.map(city => city.y));
  
  const width = 600;
  const height = 400;
  const scaleX = (width - 2 * padding) / (maxX - minX || 1);
  const scaleY = (height - 2 * padding) / (maxY - minY || 1);

  const transformPoint = (point: City) => ({
    x: (point.x - minX) * scaleX + padding,
    y: (point.y - minY) * scaleY + padding
  });

  const createPathData = () => {
    if (currentPath.length === 0) return '';
    
    const transformedPoints = currentPath.map(i => transformPoint(cities[i]));
    const pathCommands = transformedPoints.map((point, i) => 
      `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    );
    
    // Close the path back to the start
    const firstPoint = transformPoint(cities[currentPath[0]]);
    pathCommands.push(`L ${firstPoint.x} ${firstPoint.y}`);
    
    return pathCommands.join(' ');
  };

  const gridSize = 10;
  const numXLines = Math.floor(width / gridSize);
  const numYLines = Math.floor(height / gridSize);

  return (
    <div className="w-full max-w-3xl mx-auto mt-4">
      <div className="border rounded-lg p-4 bg-white">
        <svg width={width} height={height} className="bg-gray-50">
          {Array.from({ length: numXLines }).map((_, i) => (
            <line
              key={`x${i}`}
              x1={i * gridSize}
              y1={0}
              x2={i * gridSize}
              y2={height}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: numYLines }).map((_, i) => (
            <line
              key={`y${i}`}
              x1={0}
              y1={i * gridSize}
              x2={width}
              y2={i * gridSize}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          <path
            d={createPathData()}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {cities.map((city, i) => {
            const point = transformPoint(city);
            return (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={point.x}
                  y={point.y - 10}
                  textAnchor="middle"
                  fill="#374151"
                  className="text-sm"
                >
                  {i}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export const OptimizationDashboard: React.FC = () => {
  const [evolutionData, setEvolutionData] = React.useState<EvolutionData[]>([]);
  const [currentTask, setCurrentTask] = React.useState<string | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [wsStatus, setWsStatus] = React.useState<string>('disconnected');
  const [cities, setCities] = React.useState<City[]>([]);
  
  const startNewTask = async (formData: any) => {
    try {
      console.log('Starting new optimization task...', formData);
      const response = await fetch(`${config.apiUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Task created:', data);
      setCurrentTask(data.task_id);
      setIsRunning(true);
      setEvolutionData([]);
      // Convert cities from formData format to visualization format
      setCities(formData.parameters.cities.map((city: number[]) => ({
        x: city[0],
        y: city[1]
      })));
      connectToWebSocket(data.task_id);

    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const connectToWebSocket = (taskId: string) => {
    console.log(`Connecting to WebSocket for task ${taskId}...`);
    setWsStatus('connecting');

    const ws = new WebSocket(`${config.wsUrl}/ws/tasks/${taskId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received update:', data);
        
        if (data && typeof data.best_fitness === 'number') {
          setEvolutionData(prev => [...prev, {
            generation: data.generation,
            best_fitness: data.best_fitness,
            best_solution: data.best_solution,
            average_fitness: data.average_fitness,
            population_diversity: data.population_diversity,
          }]);
          //setEvolutionData(evolutionData.best_solution)
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

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsStatus('error');
    };
  };

  const latestSolution = evolutionData[evolutionData.length - 1]?.best_solution || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">TSP Optimization</h1>

        {currentTask && (
          <p className="text-sm text-muted-foreground">
            Current Task ID: {currentTask}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <OptimizationForm 
              onSubmit={startNewTask}
              isRunning={isRunning}
            />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Route Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <TSPVisualization 
                  cities={cities}
                  currentPath={latestSolution}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {evolutionData.length > 0 ? (
                  <LineChart
                    data={evolutionData}
                    width={500}
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
                      stroke="#3b82f6"
                      name="Best Fitness"
                    />
                    <Line
                      type="monotone"
                      dataKey="average_fitness"
                      stroke="#22c55e"
                      name="Average Fitness"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="population_diversity"
                      stroke="#eab308"
                      name="Diversity"
                      dot={false}
                    />
                  </LineChart>
                ) : (
                  <p className="text-center py-20 text-muted-foreground">
                    No data yet. Start an optimization task to see results.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationDashboard;