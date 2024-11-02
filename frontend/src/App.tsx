import React from 'react';
import { OptimizationDashboard } from './components/OptimizationDashboard';
import './globals.css';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center">
          <h1 className="text-xl font-bold">Genetic Algorithm Optimizer</h1>
        </div>
      </header>
      
      <main className="container py-6">
        <OptimizationDashboard />
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex h-14 items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Built with React & Python
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;