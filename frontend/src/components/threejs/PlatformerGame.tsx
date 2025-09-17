import { useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import Player from './Player';

let callGameOver = true;

interface PlatformProps {position:THREE.Vector3, width: number, height : number, winning?: boolean };
type MoveData = {action:string, duration:number};

const platformColor = "#FEEFD9"

// Platform component
const Platform = ({ position, width = 3, height = 1, winning = false} : PlatformProps) => {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, height]} />
      <meshStandardMaterial color={winning? "gold" : platformColor} />
    </mesh>
  );
};

// Floor component
const Floor = () => {
  return (
    <mesh position={[0, -5, 0]} rotation={[0, 0, 0]}>
      <boxGeometry args={[20, 1, 1]} />
      <meshStandardMaterial color={platformColor} />
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
const Game = ({onGameOverCallBack, evolutionData, generation, maxGeneration}:{onGameOverCallBack:Function, evolutionData:MoveData[][], generation:number, maxGeneration:number}) => {
  const winBonusAmount =  100;
  //const [input, setInput] = useState([0, 0, 0]);
  const [scores, setScores] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  // camera.lookAt(0,10,0);
  const [players, setPlayers] = useState<number[]>([])
  const [moves, setMoves] = useState<MoveData[][]>([])
  const [inputIndices, setInputIndices] = useState<number[]>([])
  const [inputs, setInputs] = useState<number[][]>([])
  const [totalTimes, setTotalTimes] = useState<number[]>([]);
  const [playersDone, setPlayersDone] = useState(0)
  const [reset, setReset] = useState<boolean[]>([]);
  const [realTime, setRealTime] = useState(0);
  const [playerIsJumpings, setPlayerIsJumpings] = useState<boolean[]>([])
  let pDone = 0;
  
  
  const [playerPositions, setPlayerPositions] = useState<THREE.Vector3[]>([])
  const [playerVelocities, setPlayerVelocities] = useState<THREE.Vector3[]>([])


  useEffect(()=>{
    callGameOver = true;
    console.log("reset")
    setGameOver(false)
    setRealTime(0);
    let reset_start :boolean[] = [];
    for (let index = 0; index < evolutionData.length; index++){
      reset_start[index] = true;
    }
    setReset(reset_start)
    let isJumpingArr :boolean[] = [];
    for (let index = 0; index < evolutionData.length; index++){
      isJumpingArr[index] = true;
    }
    setPlayerIsJumpings(isJumpingArr)
    setPlayersDone(0);
    console.log(evolutionData)
    let test :number[] = [];
    for (let index = 0; index < evolutionData.length; index++){
      test[index] = 0;
    }
    setPlayers(test);
    let newArr:THREE.Vector3[] = []
    for (let index = 0; index < evolutionData.length; index++) {
      newArr[index] =  new THREE.Vector3(0, 0 , 0);
    }
    setPlayerPositions(newArr)
    let velArr:THREE.Vector3[] = []
    for (let index = 0; index < evolutionData.length; index++) {
      velArr[index] =  new THREE.Vector3(0, 0 , 0);
    }
    setPlayerVelocities(velArr)
    let newMoves: MoveData[][] = [];
    for (let index = 0; index < evolutionData.length; index++) {
      newMoves[index] =  evolutionData[index];
    }
    setMoves(newMoves);
    console.log(newMoves)
    let test_1 :number[] = [];
    for (let index = 0; index < evolutionData.length; index++){
      test_1[index] = 0;
    }
    setInputIndices(test_1)
    let newInputs : number[][] =[];
    for (let index = 0; index < evolutionData.length; index++){
      newInputs[index] = [0, 0, 0]
    }
    setInputs(newInputs)

    // intialize the timers for the first move of every individual in the population
    let newTimes : number[] = [];
    for (let index = 0; index < evolutionData.length; index++){
      newTimes[index] = evolutionData[index][0].duration;
    }
    setTotalTimes(newTimes);
    
    let test_2 :number[] = [];
    for (let index = 0; index < evolutionData.length; index++){
      test_2[index] = 0;
    }
    setScores(test_2);
  }, [evolutionData]);

  const checkPlayerDone = () => {
    for (let i = 0; i < players.length; i++){
      if (players[i] === 0){
        return;
      }
    }
    if (!gameOver){
      GameOver()
    }
    
  }

  const varietyBonus = (playerMoves:MoveData[]) => {
    let bonus = 0;
    let moveTypes = new Set<string>();
    for (let i = 0; i < playerMoves.length; i++) {
      moveTypes.add(playerMoves[i].action);
    }
    bonus = moveTypes.size * 10;
    return bonus;
  }

  const playerDone = (index:number, won:Boolean, invalidInput = false) => {
    const winBonus = won ? winBonusAmount : 0;
    // floor is at a height of -4 so add 4 to prevent negative scores
    const playerScore = invalidInput? -1000 : ((playerPositions[index].y + 4) * 10) + winBonus + varietyBonus(moves[index]);
    let tempArr = scores;
    tempArr[index] = playerScore;
    setScores(tempArr);
    const newPlayer= players[index] === 0
    if (players[index] === 0){
      setPlayersDone(prev => prev + 1);
      pDone += 1;
      let temp = players;
      temp[index] = won? 2: 1;
      setPlayers(temp);
    }
    if (pDone >= evolutionData.length && !gameOver){
      GameOver();
    }
  }

  const onPlayerWin = (index:number) => {
    const inputIndex:number = inputIndices[index];
    handleInputUp(index, moves[index][inputIndex].action);
    playerDone(index, true);
  }

  const GameOver = () => {
    if (callGameOver){
      console.log(`gameOver Callback ${playersDone}`)
      onGameOverCallBack(scores)

      callGameOver = false;
      setGameOver(true)
    }
  }

  
  const updateInput = (index:number, new_inputs:number[]) => {
    let newArr = inputs;
    newArr[index] = new_inputs;
    setInputs(newArr);
  };

  const handleInputDown = (index:number, inputString :string) => {
    const prev = inputs[index];
    switch (inputString) {
      case 'left':
        updateInput(index, [1, prev[1], prev[2]])
        break;
      case 'right':
        updateInput(index, [prev[0], 1, prev[2]])
        break;
      case 'jump':
        let onPlatform = false
        platforms.forEach(platform => {
          const widthCond = Math.abs(playerPositions[index].x - platform.position.x) < platform.width / 2;
          const heightCond = Math.abs((playerPositions[index].y - 0.5) - (platform.position.y + 0.5)) < 0.1;
          //console.log("player.y: " + playerPosition.y);
          if (widthCond && heightCond){
            onPlatform = true;
          }
        })
        if (playerPositions[index].y <= -3 || 
          onPlatform
        ) {
          updateInput(index, [prev[0], prev[1], 1])
        }
        break;
      default:
        playerDone(index, false, true)
        break;
      }
    };
  const handleInputUp = (index:number, inputString: string) => {
    const prev = inputs[index];
    switch (inputString) {
      case 'left':
        updateInput(index, [0, prev[1], prev[2]])
        break;
      case 'right':
        updateInput(index, [prev[0], 0, prev[2]])
        break;
      case 'jump':
        break;
      default:
        playerDone(index, false, true)
        break;
      };
  };

  const onTimeUpdate = (index:number, delta:number) => {
    if (moves.length < 1){
      
      return;
    }
    const totalTime = totalTimes[index];
    const inputIndex = inputIndices[index];
    if (!set){
      handleInputDown(index, moves[index][0].action)
      set = true
    }
    
    if (realTime > totalTime){
      if (inputIndex === moves[0].length - 1){
        //Out of moves, game over
        playerDone(index, false)
      }
      else{
        let tempArr = inputIndices;
        tempArr[index] += 1;
        setInputIndices(tempArr);
        //setInputIndex(prev => prev + 1)
        tempArr = totalTimes;
        tempArr[index] += moves[index][inputIndex].duration;
        setTotalTimes(tempArr);
        //setTotalTime(prev => prev + inputs[inputIndex].time)
        handleInputUp(index, moves[index][inputIndex].action)
        const nextAction = moves[index][inputIndex+1].action;
        if (nextAction === "pause"){
          playerDone(index, false);
          return;
        }
        handleInputDown(index, moves[index][inputIndex+1].action)
      }
    }
  }
                  
  const onPlayerPositionChange = (index:number, newPos:THREE.Vector3) => {
    let tempArr = playerPositions;
    tempArr[index] = new THREE.Vector3(newPos.x, newPos.y, newPos.z);
    setPlayerPositions(tempArr)
  }

  const onPlayerVelocityChange = (index:number, newVel:THREE.Vector3) => {
    let tempArr = playerVelocities;
    tempArr[index] = new THREE.Vector3(newVel.x, newVel.y, newVel.z);
    setPlayerVelocities(tempArr)
  }

  const updateIsJumping = (index:number, newVal:boolean) => {
    let tempArr = playerIsJumpings;
    tempArr[index] = newVal;
    setPlayerIsJumpings(tempArr)
  }

  const resetJumpInput = (index:number) =>{
    const prev = inputs[index];
    updateInput(index, [prev[0], prev[1], 0]);
  }
  
  const updateReset = (index:number, val:boolean) => {
    let temp = reset;
    temp[index] = val;
    setReset(temp);
  }

  useFrame((state, delta) => {
    //console.log("useFrame")
    if (gameOver){
      return;
    }
    setRealTime(prev => prev + delta);
    //console.log(`Realtime: ${realTime}`)
    for(let index = 0; index < evolutionData.length; index++){
      const input = inputs[index]
      let position = playerPositions[index];
      let velocity = playerVelocities[index];
      let isJumping = playerIsJumpings[index];
      const timeScale = 1;
      const gravity = .5;
      const jumpForce = 40;
      const moveSpeed = 5;

      if(players[index] !== 0){
        checkPlayerDone()
        continue;
      }
  
      if(reset[index]){
        position = new THREE.Vector3(0,0,0)
        velocity = new THREE.Vector3(0,0,0)
        updateReset(index, false)
      }
  
      onTimeUpdate(index, delta)
  
      delta = delta * timeScale;
      // Apply gravity
      let newVelocity = new THREE.Vector3(velocity.x, velocity.y, velocity.z);
      if(reset[index]){
        newVelocity = new THREE.Vector3(0, 0, 0);
      }
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
      if (input[2] === 1 && !isJumping){
        newVelocity.y = jumpForce;
        //console.log("actually jump")
        resetJumpInput(index)
      }
  
      // Calculate new position based on velocity
      let newPosition = new THREE.Vector3(
        position.x + newVelocity.x * delta,
        position.y + newVelocity.y * delta,
        position.z
      );
      if (reset[index]){
        newPosition = new THREE.Vector3(
          newVelocity.x * delta,
          newVelocity.y * delta,
          0
        );
      }
        
  
      // Floor collision
      // TODO: Should be the condition for a game over?
      if (newPosition.y < -3) {
        newPosition.y = -3;
        updateIsJumping(index, false);
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
            //setTimeScale(0); This needs to be updated to use timescale (maybe)
            onPlayerWin(index);
          }
          newPosition.y = platform.position.y + platform.height/2 + .5;
          tempJumping = false
          //setIsJumping(false);
          newVelocity.y = 0;
        }
      });
  
      updateIsJumping(index, tempJumping)
  
      // Side boundaries
      if (newPosition.x < -9) newPosition.x = -9;
      if (newPosition.x > 9) newPosition.x = 9;
  
      
      //onPlayerPositionChange(index, newPosition);
      onPlayerVelocityChange(index, newVelocity);
      onPlayerPositionChange(index, newPosition);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {
      players.map((player, index) => (
        <Player key={index} position={playerPositions[index]}/>
      ))}
      
      {platforms.map((platform, index) => (
        <Platform key={index} position={platform.position} width={platform.width} height={1} winning={platform.winning}/>
      ))}
      
      <Floor />
      
      <Text
        position={[0, 15, 0]}
        color="black"
        fontSize={2}
        anchorX="center"
        anchorY="middle"
        textAlign='center'
      >
        Generation: {generation+1}/{maxGeneration}{"\n"}
        State: {gameOver?(generation+1 == maxGeneration ? "done":"evolving"):"playing"}
      </Text>
    </>
  );
};

// Main component
const PlatformerGame = ({onGameOverCallback, evolutionData, generation, maxGeneration}:{onGameOverCallback:Function, evolutionData: MoveData[][], generation:number, maxGeneration:number}) => {
  const { camera, gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const container = canvas;

    if (!container) {
      console.error("Canvas container not found for ResizeObserver.");
      return;
    }

    const handleResizeInternal = () => {
      console.log(`handle resize: ${camera}`)
      // Ensure container has valid dimensions to prevent errors with aspect ratio calculation
      if (container.clientWidth <= 0 || container.clientHeight <= 0) {
        return;
      }

      if (camera instanceof THREE.OrthographicCamera) {
        const newAspect = container.clientWidth / container.clientHeight;

        // Derive desired world height and Y-shift from your initial camera setup
        // in GameComponent.tsx:
        // top={9*1.5 + 8} => 21.5
        // bottom={-9*1.5 + 8} => -5.5
        // Initial worldHeight = 21.5 - (-5.5) = 27
        // Initial yShift = (21.5 + (-5.5)) / 2 = 8
        const idealContainerHeight = 700; // e.g., The pixel height of 80vh on a target screen
        const baseWorldHeight = 27;
        const currentContainerPixelHeight = container.clientHeight;

        const scalingFactor = idealContainerHeight / currentContainerPixelHeight;
        const dynamicWorldHeight = baseWorldHeight * scalingFactor;
        const yShift = 8;

        camera.top = dynamicWorldHeight / 2 + yShift;
        camera.bottom = -dynamicWorldHeight / 2 + yShift;
        camera.left = (dynamicWorldHeight * newAspect) / -2; // Assumes X-axis is centered (xShift = 0)
        camera.right = (dynamicWorldHeight * newAspect) / 2;

        camera.updateProjectionMatrix();
        
        // R3F typically handles renderer.setSize, but if you notice issues,
        // you might need to uncomment this. Be cautious as it can interfere.
        gl.setSize(container.clientWidth, container.clientHeight, false);
        
        console.log(
          `Camera resized: L:${camera.left.toFixed(1)} R:${camera.right.toFixed(1)} ` +
          `T:${camera.top.toFixed(1)} B:${camera.bottom.toFixed(1)} Aspect:${newAspect.toFixed(2)}` +
          `current container height: ${currentContainerPixelHeight}`
        );
      }
    };

    // Use ResizeObserver to detect changes in the container's size
    const resizeObserver = new ResizeObserver(() => {
      // console.log("ResizeObserver: Canvas container dimensions changed.");
      handleResizeInternal();
    });

    resizeObserver.observe(container);

    // Initial call to set camera correctly when component mounts
    handleResizeInternal();

    // Cleanup
    return () => {
      resizeObserver.unobserve(container);
    };
  }, [camera, gl]); // Effect dependencies

  return (
      <>
      {evolutionData && (
        <>
      <Game onGameOverCallBack={onGameOverCallback} evolutionData={evolutionData} generation={generation} maxGeneration={maxGeneration}/>
      {/* <OrbitControls enableRotate={false} enableZoom={false} /> */}
      </>
      )
      }
      </>
  );
};

export default PlatformerGame;