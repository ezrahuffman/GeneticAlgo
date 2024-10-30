import numpy as py
from typing import List, Tuple
import asyncio

class GeneticOptimizer:
    def __init__(self, config: dict):
        self.population_size = min(100, config.get('population_size', 50))
        self.mutation_rate = config.get('mutation_rate', 0.1)
        self.crossover_rate = config.get('crosover_rate', 0.8)
        self.problem_type = config.get('problem_type', 'tsp')
        self.dimension = config.get('dimension', 20)
        self.generation = 0
        self.population = self._initialize_population()
        self.best_solution = None
        self.best_fitness = float('-inf')
    

    #TODO: none of the actual updating of generations is completed just the itteration through generations
    async def evolve(self, task_id: str, update_callback) -> None:
        while self.generation < 100: # limit generations
            # Process generation
            fitness_values = self._evaluate_population()
            self._update_best_solution(fitness_values)
            self._create_next_generation(fitness_values)

            # send update
            await update_callback({
                'task_id': task_id,
                'generation': self.generation,
                'best_fitness': float(self.best_fitness),
                'best_solution': self.best_solution.tolist(),
                'status': 'running'
            })

            # Control evolution speed
            await asyncio.sleep(0.1)
            self.generation += 1