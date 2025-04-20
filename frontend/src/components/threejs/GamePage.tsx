import GameComponent from './GameComponent';

export default function GamePage() {
  return (
    <div className="game-page">
      <h1 className="text-2xl font-bold text-center py-4">My Three.js Game</h1>
      <GameComponent />
    </div>
  );
}
