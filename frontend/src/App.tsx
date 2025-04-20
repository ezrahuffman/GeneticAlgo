import React from "react";
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

function Home() {
  return <h2>Home</h2>;
}

function About() {
  return <h2>About</h2>;
}

function Users() {
  return <h2>Users</h2>;
}

