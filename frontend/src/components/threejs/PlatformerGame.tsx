import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';


interface PlatformProps {position:THREE.Vector3, width: number, height : number };

// Player component
const Player = ({ velocity, setPlayerVelocity, onPlayerPositionChange } : {velocity:THREE.Vector3, setPlayerVelocity: Function, onPlayerPositionChange: Function}) => {
  const ref = useRef(null);
  const [isJumping, setIsJumping] = useState(true);
  const [position, setPlayerPosition] = useState(new THREE.Vector3(0, 0, 0))
  const gravity = 1;
  const jumpForce = 0;
  const moveSpeed = .1;

  useFrame((state, delta) => {
    //console.log("gravity: " + gravity)

    // Apply gravity
    let newVelocity = velocity;
    if (isJumping) {
      velocity.y -= gravity;
    }

    // Calculate new position based on velocity
    const newPosition = new THREE.Vector3(
      position.x + velocity.x * delta,
      position.y + velocity.y * delta,
      position.z
    );
      

    // Floor collision
    // TODO: This should be the condition for a game over
    if (newPosition.y < -3) {
      newPosition.y = -3;
      setIsJumping(false);
      newVelocity.y = 0;
    }

    let tempJumping = true
    // Platform collisions
    platforms.forEach(platform => {
      if (
        
        newPosition.x > (platform.position.x - (platform.width / 2)) &&
        newPosition.x < (platform.position.x + (platform.width / 2)) &&
        newPosition.y - .5 > (platform.position.y - (platform.height/2)) &&
        newPosition.y - .5 <= (platform.position.y + (platform.height/2)) &&
        newVelocity.y < 0
      ) {
        console.log("Hit platform");
        newPosition.y = platform.position.y + platform.height/2 + .5;
        tempJumping = false
        //setIsJumping(false);
        newVelocity.y = 0;
      }
      else {
        console.log("player (x, y): (" + newPosition.x + ", " + newPosition.y + ")")
        console.log("platform.y: " + (platform.position.y))
        console.log("platform.x: " + (platform.position.x))
      }
    });

    setIsJumping(tempJumping)

    // Side boundaries
    if (newPosition.x < -9) newPosition.x = -9;
    if (newPosition.x > 9) newPosition.x = 9;

    
    setPlayerPosition(newPosition);
    //setPlayerVelocity(velocity);
    onPlayerPositionChange(newPosition);
  });
  
  return (
    <mesh ref={ref} position={position}>
      
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
};

// Platform component
const Platform = ({ position, width = 3, height = 1 } : PlatformProps) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, height]} />
      <meshStandardMaterial color="limegreen" />
    </mesh>
  );
};

// Floor component
const Floor = () => {
  return (
    <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 10]} />
      <meshStandardMaterial color="royalblue" />
    </mesh>
  );
};

// Platform definitions
const platforms : PlatformProps[] = [
  { position: new THREE.Vector3(0, -2, 0), width: 5, height: 1},
  { position: new THREE.Vector3(-5, 0, 0), width: 3, height: 1 },
  { position: new THREE.Vector3(5, 0, 0), width: 3, height: 1 },
  { position: new THREE.Vector3(0, 2, 0), width: 2, height: 1 },
  { position: new THREE.Vector3(-7, 3, 0), width: 2, height: 1 },
  { position: new THREE.Vector3(7, 3, 0), width: 2, height: 1 },
];

// Game component
const Game = () => {
  const [playerVelocity, setPlayerVelocity] = useState(new THREE.Vector3(0, 0, 0));
  const [score, setScore] = useState(0);
  const camera = new THREE.OrthographicCamera( 1920 / - 2, 1920 / 2, 1080 / 2, 1080 / - 2, 1, 1000 );
  
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 0, 0))

  // Input handling
  useEffect(() => {
    // TODO: none of this is changing the velocity used by the player or the movement speed
    const handleKeyDown = (e :any) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          //console.log("left")
          //console.log("before: " + playerVelocity.x)
          setPlayerVelocity(prev => new THREE.Vector3(prev.x - 0.15, prev.y, prev.z));
          //.log("after: " + playerVelocity.x)
          break;
        case 'ArrowRight':
        case 'd':
          setPlayerVelocity(prev => new THREE.Vector3(prev.x + 0.15, prev.y, prev.z));
          break;
        case ' ':
        case 'ArrowUp':
        case 'w':
          if (playerPosition.y <= -3 || 
              platforms.some(platform => 
                Math.abs(playerPosition.x - platform.position.x) < platform.width / 2 &&
                Math.abs(playerPosition.y - (platform.position.y + 0.5)) < 0.1
              )) {
            setPlayerVelocity(prev => new THREE.Vector3(prev.x, prev.y + 0.5, prev.z));
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerVelocity]);

  // // Score based on height
  // useEffect(() => {
  //   const newScore = Math.max(0, Math.floor((playerPosition.y + 3) * 10));
  //   setScore(newScore);
  // }, [playerPosition.y]);
  const onPlayerPositionChange = (newPos:THREE.Vector3) => {
    setPlayerPosition(newPos) 
  }

  // Camera follows player
  useEffect(() => {
    camera.position.x = playerPosition.x;
    camera.position.y = playerPosition.y + 2;
    camera.position.z = playerPosition.z -10;
  }, [playerPosition, camera]);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <Player velocity={playerVelocity} setPlayerVelocity={setPlayerVelocity}  onPlayerPositionChange={onPlayerPositionChange} />
      
      {platforms.map((platform, index) => (
        <Platform key={index} position={platform.position} width={platform.width} height={1}/>
      ))}
      
      <Floor />
      
      <Text
        position={[playerPosition.x, playerPosition.y + 4, 0]}
        color="black"
        fontSize={.1}
        anchorX="center"
        anchorY="middle"
      >
        Score: {score}
      </Text>
    </>
  );
};

// Main component
const PlatformerGame = () => {
  return (
      <>
      <Game />
      <OrbitControls enableRotate={false} enableZoom={false} />
      </>
  );
};

export default PlatformerGame;