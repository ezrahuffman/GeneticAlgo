import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Mesh } from 'three';

// A simple rotating cube game object
function Cube(props :any) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  const [score, setScore] = useState(0);

  // Rotate the cube on each frame
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onClick={() => {
        setActive(!active);
        setScore(prev => prev + 1);
        props.onScore && props.onScore();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

// Main game component
export default function GameComponent() {
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState('idle');
  
  const handleScore = () => {
    setScore(prevScore => prevScore + 1);
  };
  
  const startGame = () => {
    setGameStatus('playing');
    setScore(0);
  };

  return (
    <div className="w-full h-screen relative">
      {gameStatus === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button 
            onClick={startGame}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Start Game
          </button>
        </div>
      )}
      
      {gameStatus === 'playing' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded z-10">
          Score: {score}
        </div>
      )}
      
      <Canvas className="w-full h-full">
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        
        {gameStatus === 'playing' && (
          <>
            <Cube position={[-1.5, 0, 0]} onScore={handleScore} />
            <Cube position={[1.5, 0, 0]} onScore={handleScore} />
          </>
        )}
        
        <OrbitControls />
      </Canvas>
    </div>
  );
}
