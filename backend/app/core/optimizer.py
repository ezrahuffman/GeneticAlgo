import numpy as np
from typing import List, Tuple
import asyncio
import logging

logger = logging.getLogger(__name__)

'''PROBLEM TYPES'''
# TSP - Traveling salesman problem
# Only other option for problem is function optimization

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
        self.max_generations = config.get('max_generations', 100)

        # Generate dummy cities if not provided
        if self.problem_type == 'tsp' and 'parameters' not in config:
            self.cities = np.array([[i, i] for i in range(self.dimension)])
        else:
            self.cities = np.array(config.get('parameters', {}).get('cities', 
                [[i, i] for i in range(self.dimension)]))
            
        logger.info(f"Cities array shape: {self.cities.shape}")
        logger.info("GeneticOptimizer initialized successfully")

    def _initialize_population(self)-> np.ndarray:
        """Initialize population depending on problem type"""
        population: np.ndarray
        # For TSP create permutations of city indices
        if (self.problem_type == 'tsp'):
            population = np.zeros((self.population_size, self.dimension))
            for i in range(self.population_size):
                population[i] = np.random.permutation(self.dimension)
        else:
            #Function optimization problem
            # Random solutions in range [0,1]
            population = np.random.uniform(0, 1, (self.population_size, self.dimension))
        return population
    
    def _calculate_distance(self, city1_idx: int, city2_idx: int) -> float:
        """Calculate Euclidean distance between two cities."""
        city1 = self.cities[city1_idx]
        city2 = self.cities[city2_idx]
        return np.sqrt(np.sum((city1 - city2) ** 2))
    
    def _evaluate_population(self) -> np.ndarray:
        fitness = np.zeros(self.population_size)

        for i in range(self.population_size):
            # calculations for distance and routes don't make much sense at the moment
            # should be something like sqrt(x^2 + y^2) where x is x distance between cities and likewise for y
            if self.problem_type == 'tsp':
                # For TSP, calculate total distance (negative as we maximize fitness)
                route = self.population[i].astype(int)
                distance = 0
                for j in range(self.dimension):
                    city1_idx = route[j]
                    city2_idx = route[(j + 1) % self.dimension]
                    distance += self._calculate_distance(city1_idx, city2_idx)
                fitness[i] = -distance  # Negative because we maximize fitness
            else:
                # function optimization uses a test function 
                x = self.population[i]
                fitness[i] = -np.sum(x**2)
        return fitness
    
    def _select_parents(self, fitness: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        # select parents using tournament selection
        tournament_size = 3
        parent1_idx = np.zeros(self.population_size, dtype=int)
        parent2_idx = np.zeros(self.population_size, dtype=int)

        for i in range(self.population_size):
            #tournament for parent one
            canidates = np.random.choice(self.population_size, tournament_size)
            parent1_idx[i] = canidates[np.argmax(fitness[canidates])]

            #tournament for parent two
            canidates = np.random.choice(self.population_size, tournament_size)
            parent2_idx[i] = canidates[np.argmax(fitness[canidates])]
        
        logger.info(f"self.population[parent1_idx].shape {self.population[parent1_idx].shape}")
        return self.population[parent1_idx], self.population[parent2_idx]

    def _crossover(self, parents1: np.ndarray, parents2: np.ndarray) -> np.ndarray:
        """Perform crossover between parents."""
        offspring = np.full((self.population_size, self.dimension), -1)
        
        for i in range(self.population_size):
            if np.random.random() < self.crossover_rate:
                if self.problem_type == 'tsp':
                    # Order crossover for TSP
                    # Select two random crossover points
                    point1, point2 = sorted(np.random.choice(self.dimension, 2, replace=False))
                    
                    # Ensure parents are array-like before converting to list
                    p1 = np.asarray(parents1[i], dtype=int)
                    p2 = np.asarray(parents2[i], dtype=int)
                    
                    # Convert to lists
                    parent1: list = p1.tolist()
                    parent2: list = p2.tolist()
                    
                    # Initialize offspring
                    offspring_route = [-1] * self.dimension
                    
                    # Copy segment from parent1
                    offspring_route[point1:point2] = parent1[point1:point2]
                    
                    # Create remaining elements in order from parent2
                    # Only include values that aren't already in the offspring
                    remaining = []
                    for gene in parent2:
                        if gene not in offspring_route[point1:point2]:
                            remaining.append(gene)
                    
                    # Fill in the rest of the offspring
                    if point1 > 0:
                        offspring_route[:point1] = remaining[:point1]
                    if point2 < self.dimension:
                        offspring_route[point2:] = remaining[point1:]
                    
                    # Convert back to numpy array
                    offspring[i] = np.array(offspring_route, dtype=int)
                else:
                    # Blend crossover for function optimization
                    alpha = np.random.random()
                    offspring[i] = alpha * parents1[i] + (1 - alpha) * parents2[i]
            else:
                offspring[i] = parents1[i]

        return offspring
    
    def _mutate(self, offspring: np.ndarray) -> np.ndarray:
        for i in range(self.population_size):
            if np.random.random() < self.mutation_rate:
                if self.problem_type == 'tsp':
                    # Randomly select and swap
                    idx1, idx2 = np.random.choice(self.dimension, 2, replace=False)
                    offspring[i, [idx1, idx2]] = offspring[i, [idx2, idx1]]
                else:
                    # Gaussian mutation for function optimization 
                    mutation = np.random.normal(0, 0.1, self.dimension)
                    offspring[i] += mutation
                    offspring[i] = np.clip(offspring[i], 0, 1)
        return offspring

    def _update_best_solution(self, fitness: np.ndarray) -> None:
        best_idx = np.argmax(fitness)
        if fitness[best_idx] > self.best_fitness:
            self.best_fitness = fitness[best_idx]
            self.best_solution = self.population[best_idx].copy()

    def _create_next_generation(self, fitness: np.ndarray) -> None:
        # use selection, mutation, and crossover to create next generation
        parents1, parents2 = self._select_parents(fitness)
        offspring = self._crossover(parents1, parents2)
        self.population = self._mutate(offspring)           


    async def evolve(self, task_id: str, update_callback, close_callback) -> None:
        try:
                while self.generation < self.max_generations:
                    # Process generation
                    fitness_values = self._evaluate_population()
                    self._update_best_solution(fitness_values)
                    self._create_next_generation(fitness_values)
                    
                    # Calculate additional metrics
                    avg_fitness = np.mean(fitness_values)
                    diversity = np.std(fitness_values)
                    
                    # Send update
                    update_data = {
                        'task_id': task_id,
                        'generation': self.generation,
                        'best_fitness': -float(self.best_fitness),
                        #'current_fitness': 14,
                        'best_solution': self.best_solution.tolist(),
                        'average_fitness': avg_fitness,
                        'population_diversity': diversity,
                        'status': 'running'
                    }
                    
                    #logger.info(f"Generation {self.generation} complete. Best fitness: {self.best_fitness}")
                    await update_callback(update_data)
                    
                    # Control evolution speed
                    await asyncio.sleep(0.1)
                    self.generation += 1   
                await close_callback()
        except Exception as e:
            logger.error(f"Error in generation {self.generation}: {str(e)}")
            raise
                
        logger.info(f"Evolution completed for task {task_id}")