import GameComponent from './GameComponent';

export default function GamePage() {
  return (
    <div className="game-page" style={{height:'100vh', backgroundColor:'#2C2C2C'}}>
      <h1 className="text-2xl font-bold text-center py-4">My Three.js Game</h1>
      <GameComponent />
    </div>
  );
}