import { Route, Routes } from "react-router";
import GamePage from "./components/threejs/GamePage";
import OptimizationDashboard from "./components/OptimizationDashboard";
import HomePage from "./components/HomePage";
import './index.css'


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/TSP" element={<OptimizationDashboard/>}/>
      <Route path="/Game" element={<GamePage/>}/>
    </Routes>
  );
}

