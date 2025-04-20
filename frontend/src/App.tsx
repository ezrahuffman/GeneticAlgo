import { Route, Routes } from "react-router";
import GamePage from "./components/threejs/GamePage";
import OptimizationDashboard from "./components/OptimizationDashboard";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OptimizationDashboard/>}/>
      <Route path="/Game" element={<GamePage/>}/>
    </Routes>
  );
}

