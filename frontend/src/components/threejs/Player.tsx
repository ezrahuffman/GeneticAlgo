import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import PlayerProps from '@/src/interfaces/PlayerProps';

const Player = ({ position } : PlayerProps) => {
   const ref = useRef(null);

  return (
    <mesh ref={ref} position={position}>
      
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
};

export default Player;