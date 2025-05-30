import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import PlatformerGame from './PlatformerGame';
import OptimizationForm from '../OptimizationForm';

interface EvolutionData {
  generation: number;
  best_fitness: number;
  best_solution?: number[];
  average_fitness?: number;
  population_diversity?: number;
  population: MoveData[][];
}

interface MoveData {
  action:string,
  duration: number,
}

interface FitnessResultsMessage {
  type: string;
  taskId: number;
  scores: number[];
  generation: number;
}

// Main game component
export default function GameComponent() {
  const [gameStatus, setGameStatus] = useState('idle');
  
  const startGame = () => {
    setGameStatus('playing');
  };


  const [evolutionData, setEvolutionData] = React.useState<EvolutionData[]>([]);
  const [currentTask, setCurrentTask] = React.useState<string | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [gameOver, setGameOver] = useState(false)
  // eslint-disable-next-line
  const [wsStatus, setWsStatus] = React.useState<string>('disconnected');

  interface EvalData {
    message?: string; 
    scores: number[];
  }

  // variable to track if we are already processing a poplulation evaluation
  const [singleOperation, setSingleOperation] = useState<{
    resolve: (data:EvalData) => void;
    reject: (reason?: any) => void;
    timeoutId: number | null;
  } | null>(null)
  
  const startNewTask = async (formData:any) => {
    try {
      console.log('Starting new optimization task...', formData);
      console.log(`env.wsurl: ${import.meta.env.VITE_REACT_APP_API_URL}`)
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}/api/tasks`, {
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
      connectToWebSocket(data.task_id);

    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const evaluateGPAFitness = async(
    timeoutMs: number = 15000
  ): Promise<EvalData> => {
    console.log(`eval population started, waiting on game over to be called... timeout: ${timeoutMs/1000}`)
    startGame()
    setGameOver(false)

    if (singleOperation){
      // There is already a population that is being evaluated, throw error
      const errorMessage = `Error: there is already a population being evaluated.`
      console.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }

    return new Promise<EvalData>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        // if (singleOperation && //singleOperation.reject) {
        //   singleOperation.reject(
        //     new Error(`Evaluation timed out after ${timeoutMs}ms. evaluateGPA was never called`)
        //   );
        // }
        console.log("timed out")
        setSingleOperation(null);
      }, timeoutMs)
      console.log("set single operation")
      setSingleOperation({resolve, reject, timeoutId});
    });
  };

  // const evaluateGPAFitness = async (population:any):Promise<void> => {
  //   startGame()
  //   setGameOver(false)
  //   while(!gameOver){
  //   }
  //   return
  // };

  // Callback called when game completes
  const onGameOver = (scores:number[]) => {
    if (gameOver){
      return;
    }

    console.log(`set scores: ${scores}`)
    setGameOver(true)
    if (singleOperation === null){
      console.log("singleOperation is null")
    }

    if (singleOperation && singleOperation.resolve){
      const dataForEval: EvalData = {
        message:`population evaluated`,
        scores: scores
      };
      if (singleOperation.timeoutId){
        clearTimeout(singleOperation.timeoutId);
      }
      singleOperation.resolve(dataForEval);
      console.log(`successfully signaled end of game ${dataForEval.scores}`)
      setSingleOperation(null);
    } else{
      console.warn("No pending evaluation found")
    }
  };

  const connectToWebSocket = (taskId: string) => {
    console.log(`Connecting to WebSocket for task ${taskId}...`);
    setWsStatus('connecting');
    console.log(`env.wsurl: ${import.meta.env.VITE_REACT_APP_WS_URL}`)

    const ws = new WebSocket(`${import.meta.env.VITE_REACT_APP_WS_URL}/ws/tasks/${taskId}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsStatus('connected');
      startGame()
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received update:', data);

        if (data) {
          setEvolutionData(prev => [...prev, {
            generation: data.generation,
            best_fitness: data.best_fitness,
            best_solution: data.best_solution,
            average_fitness: data.average_fitness,
            population_diversity: data.population_diversity,
            population: data.population,
          }]);
          //setEvolutionData(evolutionData.best_solution)
        } else{
          console.log(`is type of number: ${typeof data.best_fitness === 'number'}`)
        }
        
        if (data.type && data.type === 'EVALUATE_POPULATION'){
          // setLastPopulation(message.population);
          // setTaskStatus(`Evaluating Generation ${message.generation} for ${message.taskId}...`);
          
          // The maximum time for each move is 2s so the maximum timout is 2 * number of moves + a little a padding for error
          const fitnessScores = await evaluateGPAFitness(data.population[0]?.length * 2010); 
          
          // Prepare the message to send back to the backend
          const resultsMessage: FitnessResultsMessage = { // Ensure FitnessResultsMessage is defined
            type: 'FITNESS_RESULTS',
            taskId: data.taskId, // Use the taskId from the incoming message
            scores: fitnessScores.scores,
            generation: data.generation, // Echo back the generation number
          };
          
          // Check if the WebSocket connection (ws) is still open before sending
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(resultsMessage));
            console.log("Frontend: Sent fitness results to backend:", resultsMessage);
          } else {
            console.error("Frontend: WebSocket is not open. Cannot send fitness results.");
            // Handle the case where the socket might have closed unexpectedly
          }
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

  return (
    <div className="w-full h-screen relative" style={{height:'100vh'}}>
      {gameStatus === 'idle' && (
        <div className="lg:col-span-1">
        <OptimizationForm 
          onSubmit={startNewTask}
          isRunning={isRunning}
          problemType='GPA'
        />
      </div>
      )}
      
      {/* {gameStatus === 'playing' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded z-10">
          Score: {score}
        </div>
      )} */}
      
      <Canvas className="w-full h-full">
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        
        {gameStatus === 'playing' && evolutionData.length >= 1 && (
          <>
            <PlatformerGame onGameOverCallback={onGameOver} evolutionData={ evolutionData[evolutionData.length - 1].population}/>
          </>
        )}
      </Canvas>
    </div>
  );
}
