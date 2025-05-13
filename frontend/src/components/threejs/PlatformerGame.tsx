import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';


interface PlatformProps {position:THREE.Vector3, width: number, height : number, winning?: boolean };
// Player component
const Player = ({  input, onPlayerVelocityChange, onPlayerPositionChange, resetJumpInput, onPlayerWin, onTimeUpdate, gameOver } : {input: number[], onPlayerVelocityChange: Function, onPlayerPositionChange: Function, resetJumpInput: Function, onPlayerWin: Function, onTimeUpdate:Function, gameOver: boolean}) => {
  const ref = useRef(null);
  const [isJumping, setIsJumping] = useState(true);
  const [position, setPlayerPosition] = useState(new THREE.Vector3(0, 0, 0))
  const [velocity, setPlayerVelocity] = useState(new THREE.Vector3(0, 0, 0 ))
  const [timeScale, setTimeScale] = useState(1);
  const gravity = 1;
  const jumpForce = 25;
  const moveSpeed = 5;

  useFrame((state, delta) => {
    if(gameOver){
      return;
    }

    onTimeUpdate(delta)

    delta = delta * timeScale;
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
    // TODO: Should be the condition for a game over?
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
        if (platform.winning){
          setTimeScale(0);
          onPlayerWin();
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
const Platform = ({ position, width = 3, height = 1, winning = false} : PlatformProps) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, height]} />
      <meshStandardMaterial color={winning? "royalblue" : "limegreen"} />
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
  { position: new THREE.Vector3(1, 8, 0), width: 3, height: 1, winning: true},
  { position: new THREE.Vector3(0, -2, 0), width: 5, height: 1},
  { position: new THREE.Vector3(-3, 5, 0), width: 2, height: 1},
  { position: new THREE.Vector3(-5, 0, 0), width: 3, height: 1 },
  { position: new THREE.Vector3(5, 0, 0), width: 3, height: 1 },
  { position: new THREE.Vector3(0, 2, 0), width: 2, height: 1 },
  { position: new THREE.Vector3(-7, 3, 0), width: 2, height: 1 },
  { position: new THREE.Vector3(7, 3, 0), width: 2, height: 1 },
];
let set = false
// Game component
const Game = () => {
  const [playerVelocity, setPlayerVelocity] = useState(new THREE.Vector3(0, 0, 0))
  const [input, setInput] = useState([0, 0, 0]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const camera = useThree((state)=>state.camera);
  camera.position.set(0, 0, 30);
  
  
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 0, 0))

  const callSetPlayerVelocity = (newVel:THREE.Vector3) =>  {
    setPlayerVelocity(new THREE.Vector3(newVel.x, newVel.y, newVel.z));
  }

  const onPlayerWin = () => {
    handleInputUp(inputs[inputIndex].control);
    GameOver(true);
  }

  const GameOver = (won:boolean) => {
    if (won){
      alert("Game Over, You Won");
    }
    else{
      alert("Game Over, Loser");
    }
    setGameOver(true)
  }

  type customInput = {
    control:string,
    time:number,
  }
  const inputs: customInput[] = [{control:"left", time:1},{control:"jump", time:1},{control:"right",time: 0.25}, {control:"jump",time:0.1}, {control:"default", time:2}]

  // Input handling
  
  const handleInputDown = (inputString :string) => {
    switch (inputString) {
      case 'left':
        input[0] = 1;
        setInput(prev => [1, prev[1], prev[2]])
        break;
      case 'right':
        setInput(prev => [prev[0], 1, prev[2]])
        break;
      case 'jump':
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
          setInput(prev => [prev[0], prev[1], 1])
        }
        break;
      default:
        break;
      }
    };
  const handleInputUp = (inputString: string) => {
    switch (inputString) {
      case 'left':
        setInput(prev => [0, prev[1], prev[2]])
        break;
        case 'right':
          setInput(prev => [prev[0], 0, prev[2]])
          break;
          case 'jump':
            break;
            default:
              break;
            }
          };
  const [realTime, setRealTime] = useState(0);
  const [totalTime, setTotalTime] = useState(inputs[0].time);
  const [inputIndex, setInputIndex] = useState(0);
  const onTimeUpdate = (delta:number) => {
    if (!set){
      handleInputDown(inputs[0].control)
      set = true
    }
    setRealTime(prev => prev + delta);
    if (realTime > totalTime){
      if (inputIndex === inputs.length - 1){
        GameOver(false);
      }
      else{
        setInputIndex(prev => prev + 1)
        setTotalTime(prev => prev + inputs[inputIndex].time)
        handleInputUp(inputs[inputIndex].control)
        handleInputDown(inputs[inputIndex+1].control)
      }
    }
  }
                  
  // // Score based on height
  // useEffect(() => {
  //   const newScore = Math.max(0, Math.floor((playerPosition.y + 3) * 10));
  //   setScore(newScore);
  // }, [playerPosition.y]);
  const onPlayerPositionChange = (newPos:THREE.Vector3) => {
    setPlayerPosition(new THREE.Vector3(newPos.x, newPos.y, newPos.z))
  }

  const resetJumpInput = () =>{
    setInput(prev => [prev[0], prev[1], 0]);
  }
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <Player input={input} onPlayerVelocityChange={callSetPlayerVelocity}  onPlayerPositionChange={onPlayerPositionChange} resetJumpInput={resetJumpInput} onPlayerWin={onPlayerWin} onTimeUpdate={onTimeUpdate} gameOver = {gameOver}/>
      
      {platforms.map((platform, index) => (
        <Platform key={index} position={platform.position} width={platform.width} height={1} winning={platform.winning}/>
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