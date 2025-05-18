import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';


interface PlatformProps {position:THREE.Vector3, width: number, height : number, winning?: boolean };
type MoveData = {action:string, duration:number};
interface PlayerProps {index:number, input: number[], onPlayerPositionChange: Function, resetJumpInput: Function, onPlayerWin: Function, onTimeUpdate:Function, gameOver: boolean};
// Player component
const Player = ({  index, input, onPlayerPositionChange, resetJumpInput, onPlayerWin, onTimeUpdate, gameOver } : PlayerProps) => {
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

    onTimeUpdate(index, delta)

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
      resetJumpInput(index)
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
          setTimeScale(index);
          onPlayerWin(index);
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
    onPlayerPositionChange(index, newPosition);
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
const Game = ({onGameOverCallBack, evolutionData}:{onGameOverCallBack:Function, evolutionData:MoveData[][]}) => {
  const winBonusAmount =  100;
  //const [input, setInput] = useState([0, 0, 0]);
  const [scores, setScores] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const camera = useThree((state)=>state.camera);
  camera.position.set(0, 0, 30);
  const [players, setPlayers] = useState<number[]>([])
  const [moves, setMoves] = useState<MoveData[][]>([])
  const [inputIndices, setInputIndices] = useState<number[]>([])
  const [inputs, setInputs] = useState<number[][]>([])
  const [totalTimes, setTotalTimes] = useState<number[]>([]);
  const [playersDone, setPlayersDone] = useState(0)
  
  
  const [playerPositions, setPlayerPositions] = useState<THREE.Vector3[]>([])


  useEffect(()=>{
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
    let newMoves: MoveData[][] = [];
    for (let index = 0; index < evolutionData.length; index++) {
      newMoves[index] =  evolutionData[index];
    }
    setMoves(newMoves);
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
  }, []);

  const playerDone = (index:number, won:Boolean) => {
    const winBonus = won ? winBonusAmount : 0;
    // floor is at a height of -4 so add 4 to prevent negative scores
    const playerScore = (playerPositions[index].y + 4) + winBonus;
    let tempArr = scores;
    tempArr[index] = playerScore;
    setScores(tempArr);

    if (players[index] == 0){
      setPlayersDone(prev => prev + 1);
      let temp = players;
      temp[index] = 1;
      setPlayers(temp);
      console.log(`players done: ${playersDone}`)
    }
    if (playersDone + 1 === evolutionData.length){
      GameOver();
    }
  }

  const onPlayerWin = (index:number) => {
    const inputIndex:number = inputIndices[index];
    handleInputUp(index, moves[index][inputIndex].action);
    playerDone(index, true);
  }

  const GameOver = () => {
    // if (won){
    //   alert("Game Over, You Won");
    // }
    // else{
    //   alert("Game Over, Loser");
    // }
    
    onGameOverCallBack(scores)

    setGameOver(true)
  }

  // type customInput = {
  //   control:string,
  //   time:number,
  // }
  //const inputs: MoveData[] = [{control:"left", time:1},{control:"jump", time:1},{control:"right",time: 0.25}, {control:"jump",time:0.1}, {control:"default", time:2}]

  // Input handling
  
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
          break;
      };
  };

  //TODO: this needs to be done for every player, not just once 
  //Realtime can be shared, but totaltime is part of each player
  const [realTime, setRealTime] = useState(0);
  //const [inputIndex, setInputIndex] = useState(0);
  const onTimeUpdate = (index:number, delta:number) => {
    if (moves.length < 1){
      return;
    }
    const totalTime = totalTimes[index];
    const inputIndex = inputIndices[index];
    //console.log(`inputIndex ${inputIndex}, ${moves[index][0]}`)
    if (!set){
      handleInputDown(index, moves[index][0].action)
      set = true
    }
    setRealTime(prev => prev + delta);
    if (realTime > totalTime){
      if (inputIndex === moves[0].length - 1){
        //GameOver(false);
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
        handleInputDown(index, moves[index][inputIndex+1].action)
      }
    }
  }
                  
  // // Score based on height
  // useEffect(() => {
  //   const newScore = Math.max(0, Math.floor((playerPosition.y + 3) * 10));
  //   setScore(newScore);
  // }, [playerPosition.y]);
  const onPlayerPositionChange = (index:number, newPos:THREE.Vector3) => {
    let tempArr = playerPositions;
    tempArr[index] = new THREE.Vector3(newPos.x, newPos.y, newPos.z);
    setPlayerPositions(tempArr)
  }

  const resetJumpInput = (index:number) =>{
    const prev = inputs[index];
    updateInput(index, [prev[0], prev[1], 0]);
  }
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {
      players.map((player, index) => (
        <Player key={index} index={index} input={inputs[index]} onPlayerPositionChange={onPlayerPositionChange} resetJumpInput={resetJumpInput} onPlayerWin={onPlayerWin} onTimeUpdate={onTimeUpdate} gameOver = {players[index] === 1}/>
      ))}
      
      {platforms.map((platform, index) => (
        <Platform key={index} position={platform.position} width={platform.width} height={1} winning={platform.winning}/>
      ))}
      
      <Floor />
      
      <Text
        position={[0, 0 + 4, 0]}
        color="black"
        fontSize={2}
        anchorX="center"
        anchorY="middle"
      >
        Score: {players.length}
      </Text>
    </>
  );
};

// Main component
const PlatformerGame = ({onGameOverCallback, evolutionData}:{onGameOverCallback:Function, evolutionData: MoveData[][]}) => {
  return (
      <>
      <Game onGameOverCallBack={onGameOverCallback} evolutionData={evolutionData}/>
      <OrbitControls enableRotate={false} enableZoom={false} />
      </>
  );
};

export default PlatformerGame;