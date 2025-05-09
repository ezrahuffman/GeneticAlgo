import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, useCamera } from '@react-three/drei';
import * as THREE from 'three';


interface PlatformProps {position:THREE.Vector3, width: number, height : number };
let  first = true;
// Player component
const Player = ({  input, onPlayerVelocityChange, onPlayerPositionChange, resetJumpInput } : {input: number[], onPlayerVelocityChange: Function, onPlayerPositionChange: Function, resetJumpInput: Function}) => {
  const ref = useRef(null);
  const [isJumping, setIsJumping] = useState(true);
  const [position, setPlayerPosition] = useState(new THREE.Vector3(0, 0, 0))
  const [velocity, setPlayerVelocity] = useState(new THREE.Vector3(0, 0, 0 ))
  const gravity = 1;
  const jumpForce = 40;
  const moveSpeed = 5;

  useFrame((state, delta) => {

    // Apply gravity
    let newVelocity = new THREE.Vector3(velocity.x, velocity.y, velocity.z);
    if (isJumping) {
      newVelocity.y -= gravity;
    }
    
    let horizontalInput = 0;
    if (input[0] === 1){
      horizontalInput += -1;
    }
    if (input[1] === 1){
      horizontalInput += 1;
    }
    newVelocity.x = moveSpeed * horizontalInput;
    if (input[2] === 1){
      newVelocity.y = jumpForce;
      //console.log("actually jump")
      resetJumpInput()
    }

    // Calculate new position based on velocity
    const newPosition = new THREE.Vector3(
      position.x + newVelocity.x * delta,
      position.y + newVelocity.y * delta,
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

        newPosition.x >= (platform.position.x - (platform.width / 2)) &&
        newPosition.x <= (platform.position.x + (platform.width / 2)) &&
        newPosition.y - .5 >= (platform.position.y - (platform.height/2)) &&
        newPosition.y - .5 <= (platform.position.y + (platform.height/2)) &&
        velocity.y <= 0
      ) {
        if (first){
          // console.log("Hit platform");
          // console.log("platform: " + platform.position.x + ", " + (platform.position.y + 0.5));
          // console.log("player: " + newPosition.x + ", " + (newPosition.y - 0.5));
          first = false;
        }
        else{
          // console.log("still on platform")
          // console.log("position: " + position.x + ", " + position.y);
          // console.log("newPosition: " + newPosition.x + ", " + newPosition.y);
        }
        newPosition.y = platform.position.y + platform.height/2 + .5;
        tempJumping = false
        //setIsJumping(false);
        newVelocity.y = 0;
      }
    });

    setIsJumping(tempJumping)

    // Side boundaries
    if (newPosition.x < -9) newPosition.x = -9;
    if (newPosition.x > 9) newPosition.x = 9;

    
    setPlayerPosition(newPosition);
    setPlayerVelocity(newVelocity);
    onPlayerPositionChange(newPosition);
    onPlayerVelocityChange(newVelocity);
    //setPlayerVelocity(new THREE.Vector3(0, newVelocity.y, newVelocity.z))
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
  //let playerVelocity = new THREE.Vector3(0, 0, 0);
  const [playerVelocity, setPlayerVelocity] = useState(new THREE.Vector3(0, 0, 0))
  const [input, setInput] = useState([0, 0, 0]);
  const [score, setScore] = useState(0);
  //const camera = new THREE.OrthographicCamera( 1920 / - 2, 1920 / 2, 1080 / 2, 1080 / - 2, 1, 1000 );
  const camera = useThree((state)=>state.camera)
  camera.position.set(0, 0, 30)
  
  // Not sure why, but useState was not updating the playerPosition.
  // My guess is it has something to do with how components are rendered in Threejs
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 0, 0))
  //let playerPosition = new THREE.Vector3(0, 0, 0);

  const callSetPlayerVelocity = (newVel:THREE.Vector3) =>  {
    //console.log("newVel: " + newVel.x + ", " + newVel.y + ", ", newVel.z)
    setPlayerVelocity(new THREE.Vector3(newVel.x, newVel.y, newVel.z));
  }

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e :any) => {
      let input = [0, 0, 0];
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          //setPlayerVelocity(prev => new THREE.Vector3(-5, prev.y, prev.z));
          input[0] = 1;
          setInput(prev => [1, prev[1], prev[2]])
          break;
        case 'ArrowRight':
        case 'd':
          //setPlayerVelocity(prev => new THREE.Vector3(5, prev.y, prev.z));
          //input[1] = 1;
          setInput(prev => [prev[0], 1, prev[2]])
          break;
        case ' ':
        case 'ArrowUp':
        case 'w':
          //console.log("attempt to jump")
          let onPlatform = false
          platforms.forEach(platform => {
            const widthCond = Math.abs(playerPosition.x - platform.position.x) < platform.width / 2;
            const heightCond = Math.abs((playerPosition.y - 0.5) - (platform.position.y + 0.5)) < 0.1;
            //console.log("player.y: " + playerPosition.y);
            if (widthCond && heightCond){
              onPlatform = true;
            }
          })
          if (playerPosition.y <= -3 || 
              onPlatform
            ) {
            //input[2] = 1
            setInput(prev => [prev[0], prev[1], 1])
            //setPlayerVelocity(prev => new THREE.Vector3(prev.x, prev.y + 20, prev.z));
            //console.log("jump")
          }
          break;
        default:
          break;
      }
      //setInput(input)
    };
    const handleKeyUp = (e: any) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          //setPlayerVelocity(prev => new THREE.Vector3(-5, prev.y, prev.z));
          setInput(prev => [0, prev[1], prev[2]])
          break;
        case 'ArrowRight':
        case 'd':
          //setPlayerVelocity(prev => new THREE.Vector3(5, prev.y, prev.z));
          setInput(prev => [prev[0], 0, prev[2]])
          break;
        case ' ':
        case 'ArrowUp':
        case 'w':
          //setInput(prev => [prev[0], prev[1], 0])
          break;
        default:
          break;
      }
      //setInput(prev => [input[0], prev[1]]);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp)
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerVelocity, playerPosition]);

  // // Score based on height
  // useEffect(() => {
  //   const newScore = Math.max(0, Math.floor((playerPosition.y + 3) * 10));
  //   setScore(newScore);
  // }, [playerPosition.y]);
  const onPlayerPositionChange = (newPos:THREE.Vector3) => {
    //playerPosition = newPos;
    setPlayerPosition(new THREE.Vector3(newPos.x, newPos.y, newPos.z))
    //console.log("player.y update: " + playerPosition.y)
  }

  const resetJumpInput = () =>{
    setInput(prev => [prev[0], prev[1], 0]);
  }

  // Camera follows player
  useEffect(() => {
    console.log(`follow player: {${playerPosition.x}, ${playerPosition.y}, ${playerPosition.z}}`);
    // camera.position.x = playerPosition.x;
    // camera.position.y = playerPosition.y + 2;
    // camera.position.z = playerPosition.z -10;
    // camera.position.set(playerPosition.x, playerPosition.y, playerPosition.z - 30)
    // camera.rotation.set(0, 0, 0);
    // camera.lookAt(playerPosition);
    
  }, [playerPosition, camera]);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <Player input={input} onPlayerVelocityChange={callSetPlayerVelocity}  onPlayerPositionChange={onPlayerPositionChange} resetJumpInput={resetJumpInput} />
      
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