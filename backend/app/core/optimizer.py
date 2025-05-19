import numpy as np
from typing import Dict, List, Tuple
import asyncio
import logging

logger = logging.getLogger(__name__)

'''PROBLEM TYPES'''
# TSP - Traveling salesman problem
# GPA - Game playing agent
# Only other option for problem is function optimization

class GeneticOptimizer:
    def __init__(self, config: dict):
        self.population_size = min(100, config.get('population_size', 50))
        self.mutation_rate = config.get('mutation_rate', 0.1)
        self.crossover_rate = config.get('crossover_rate', 0.8)
        self.problem_type = config.get('problem_type', 'tsp')
        self.dimension = config.get('dimension', 20)
        self.generation = 0
        self.population = self._initialize_population()
        self.best_solution = None
        self.best_fitness = float('-inf')
        self.max_generations = config.get('max_generations', 100)
        self.task_id = config.get('task_id', -1)

        self._gpa_fitness_values_store: Dict[str, asyncio.Future] = {}

        if self.problem_type == 'tsp':
            # Generate dummy cities if not provided
            if 'parameters' not in config:
                self.cities = np.array([[i, i] for i in range(self.dimension)])
            else:
                self.cities = np.array(config.get('parameters', {}).get('cities', 
                    [[i, i] for i in range(self.dimension)]))
            logger.info(f"Cities array shape: {self.cities.shape}")
        elif self.problem_type == 'GPA':
            # Move dimensions are always the same for now
            # self.moves = np.array([[i, i] for i in range(self.dimension)])
            # logger.info(f"Moves array shape: {self.moves.shape}")
            # TODO: test that this is not needed for game playing agent
            logger.info("init GPA optimizer")
            pass
            
        logger.info("GeneticOptimizer initialized successfully")

    def _initialize_population(self)-> np.ndarray:
        """Initialize population depending on problem type"""
        population: np.ndarray
        # For TSP create permutations of city indices
        if (self.problem_type == 'tsp'):
            population = np.zeros((self.population_size, self.dimension))
            for i in range(self.population_size):
                population[i] = np.random.permutation(self.dimension)
        elif (self.problem_type == 'GPA'):
            # Game Playing Agent
            population = self.create_game_population(self.population_size)
        return population

    # create a randomized population for the game playing agent
    # takes the form of [['left', .4]['right', 1]['jump', .7]['pause', 1.5]]
    def create_game_population(self, population_size):
        action_duration_dtype = np.dtype([('action', 'U5'), ('duration', 'f8')])
        population = np.empty((self.population_size, self.dimension), dtype=action_duration_dtype)
        possible_actions = np.array(['left', 'right', 'jump'])# 'pause'])
        for i in range(self.population_size):
            actions = np.random.choice(possible_actions, size=self.dimension)
            durations = np.random.uniform(0.25, 2.0, size=self.dimension)
            population[i]['action'] = actions
            population[i]['duration'] = durations

        return population
    
    def _calculate_distance(self, city1_idx: int, city2_idx: int) -> float:
        """Calculate Euclidean distance between two cities."""
        city1 = self.cities[city1_idx]
        city2 = self.cities[city2_idx]
        return np.sqrt(np.sum((city1 - city2) ** 2))
    
    async def _evaluate_population(self,wait_for_frontend_callback, websocket) -> np.ndarray:
        if self.problem_type == "GPA":
            task_id = self.task_id
            logger.debug(f"Task {task_id}: Evaluating GPA population via WebSocket.")
            if websocket is None:
                logger.error(f"Task {task_id}: WebSocket not available for GPA evaluation.")
                raise ValueError("WebSocket connection is not available for GPA evaluation.")

            population_data_for_frontend = []
            for i in range(self.population_size):
                individual_sequence = []
                for step in range(self.dimension): # self.dimension is sequence_length for GPA
                    action = self.population[i, step]['action']
                    duration = self.population[i, step]['duration']
                    individual_sequence.append({'action': action, 'duration': round(duration, 3)})
                population_data_for_frontend.append(individual_sequence)
            
            payload = {
                "type": "EVALUATE_POPULATION",
                "population": population_data_for_frontend,
                "generation": self.generation,
                "taskId":task_id
            }
            
            logger.info(f"Sending population to frontend for evaluation (generation {self.generation}).")
            await websocket.send_json(payload) # send data of new population back to frontend

            # Prepare a Future to wait for the fitness results for this specific task and generation
            # The WebSocket message handler (elsewhere in your server) will set the result of this Future.
            # This is a simplified mechanism. A more robust system might use a dedicated message queue or event bus.
            fitness_future = asyncio.get_event_loop().create_future()
            # Store this future so the WebSocket message handler can find it
            # A key combining task_id and generation might be better for concurrent requests
            self._gpa_fitness_values_store[task_id] = fitness_future 
                                                    # In a real app, you'd have a more robust way to correlate
                                                    # requests and responses, perhaps using unique message IDs.

            try:
                # Wait for the fitness scores from the frontend (with a timeout)
                logger.info(f"Task {task_id}: Waiting for fitness results from frontend...")

                # TODO:  this seems like a bad way to await the front end, or at least redundant
                await wait_for_frontend_callback()
                fitness_values_list = await asyncio.wait_for(fitness_future, timeout=120.0) # 2 minutes timeout
                logger.debug(f"Task {task_id}: Received fitness values via Future: {fitness_values_list}")
            except asyncio.TimeoutError:
                logger.error(f"Task {task_id}: Timeout waiting for fitness results from frontend.")
                # Handle timeout: e.g., assign very low fitness, or stop the task
                raise TimeoutError(f"Task {task_id}: Frontend fitness evaluation timed out.")
            finally:
                self._gpa_fitness_values_store.pop(task_id, None) # Clean up

            fitness = np.array(fitness_values_list, dtype=float)
            if fitness.shape[0] != self.population_size:
                logger.error(f"Task {task_id}: Fitness values count ({fitness.shape[0]}) mismatch population size ({self.population_size}).")
                raise ValueError("Mismatch between received fitness values and population size.")
            return fitness




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
    
    # Called when fitness results are received from the frontend.
    def set_gpa_fitness_results(self, fitness_scores: List[float]):
        task_id = self.task_id
        if task_id in self._gpa_fitness_values_store:
            future = self._gpa_fitness_values_store[task_id]
            if not future.done():
                future.set_result(fitness_scores)
                logger.info(f"Task {task_id}: Fitness results set for future.")
            else:
                logger.warning(f"Task {task_id}: Received fitness results, but future was already done.")
        else:
            logger.warning(f"Task {task_id}: Received fitness results, but no pending future found. Ignoring.")

    def _select_parents(self, fitness: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        # select parents using tournament selection
        tournament_size = self.population_size
        parent1_idx = np.zeros(self.population_size, dtype=int)
        parent2_idx = np.zeros(self.population_size, dtype=int)

        for i in range(self.population_size):
            #tournament for parent one
            #canidates = np.random.choice(self.population_size, tournament_size)
            canidates = list(range(self.population_size))
            parent1_idx[i] = canidates[np.argmax(fitness[canidates])]
            #logger.info(self.population[parent1_idx[i]] )

            #tournament for parent two
            #canidates = np.random.choice(self.population_size, tournament_size)
            canidates = list(range(self.population_size))
            parent2_idx[i] = canidates[np.argmax(fitness[canidates])]
        # same = True
        
        # test_lst = self.population[parent1_idx][0]
        # for lst in self.population[parent1_idx]:
        #     fail = False
        #     for k in range(len(lst)):
        #         if (test_lst[k] != lst[k]):
        #             same = False
        #             logger.info(f"mismatch: {test_lst} != {lst}")
        #             break
        #     if fail:
        #         break
        # if same:
        #     logger.info("all match")
        logger.info(f"self.population[parent1_idx].shape {self.population[parent1_idx].shape}")
        return self.population[parent1_idx], self.population[parent2_idx]

    def _crossover(self, parents1: np.ndarray, parents2: np.ndarray) -> np.ndarray:
        """Perform crossover between parents."""
        offspring = np.full((self.population_size, self.dimension), -1)
        if self.problem_type == "GPA":
            dt = np.dtype([('action', '<U5'), ('duration', '<f8')])
            offspring = np.empty((self.population_size, self.dimension), dtype=dt)
        logger.info(f"crossover rate: {self.crossover_rate}")
        for i in range(self.population_size):
            if np.random.random() < self.crossover_rate:
                logger.error("Crossover")
                if self.problem_type == 'tsp' or self.problem_type == 'GPA':
                    # Order crossover for TSP
                    # Select two random crossover points
                    point1, point2 = sorted(np.random.choice(self.dimension, 2, replace=False))
                    # Ensure parents are array-like before converting to list
                    elem_type = int if self.problem_type == 'tsp' else np.dtype([('action', '<U5'), ('duration', '<f8')])
                    p1 = np.asarray(parents1[i], dtype=elem_type)
                    p2 = np.asarray(parents2[i], dtype=elem_type)
                    
                    # Convert to lists
                    parent1: list = p1.tolist()
                    parent2: list = p2.tolist()
                    
                    # Initialize offspring
                    action_duration_dtype = np.dtype([('action', 'U5'), ('duration', 'f8')])
                
                    offspring_route = [-1] * self.dimension
                    if self.problem_type == 'GPA':
                        offspring_route = np.empty((self.dimension,), dtype=action_duration_dtype)
                        for j in range(len(offspring_route)):
                            offspring_route[j]['action'] = "none"
                            offspring_route[j]['duration'] = -1
                        offspring_route = list(offspring_route)
                    
                    # Copy segment from parent1
                    offspring_route[point1:point2] = parent1[point1:point2]
                    
                    # Create remaining elements in order from parent2
                    # Only include values that aren't already in the offspring
                    remaining = []
                    if self.problem_type == 'tsp':
                        for gene in parent2:
                            if gene not in offspring_route[point1:point2]:
                                remaining.append(gene)
                    # we don't care about duplicate moves in the game playing agent            
                    elif self.problem_type == "GPA":
                        if point1 > 0:
                            remaining = parent2[:point1]
                        if point2 < self.dimension:
                            remaining.extend(parent2[point2:])

                    # Fill in the rest of the offspring
                    if point1 > 0:
                        offspring_route[:point1] = remaining[:point1]
                    if point2 < self.dimension:
                        offspring_route[point2:] = remaining[point1:]

                    for elem in offspring_route:
                        if elem[0] == "":
                            logger.error("empty action in GPA")
                            raise Exception("empty element in GPA")
                    
                    # Convert back to numpy array
                    offspring[i] = np.array(offspring_route, dtype=elem_type)
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
                elif self.problem_type == "GPA":
                    possible_actions = np.array(['left', 'right', 'jump', 'pause'])
                    choice = np.random.choice(possible_actions, size=1)
                    duration = np.random.uniform(0.25, 2.0, size=1)
                    offspring[i]['action'] = choice[0]
                    offspring[i]['duration'] = duration[0]
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
        logger.info("before crossover")
        #offspring = self._crossover(parents1, parents2)
        logger.info("after crossover")
        offspring = parents1
        self.population = self._mutate(offspring) 
        same = True
        
        test_lst = self.population[0]
        for lst in self.population:
            fail = False
            for k in range(len(lst)):
                if (test_lst[k] != lst[k]):
                    same = False
                    logger.info(f"mismatch: {test_lst} != {lst}")
                    break
            if fail:
                break
        if same:
            logger.info("all match")
        logger.info("after mutate")          


    async def evolve(self, task_id: str, update_callback, close_callback,wait_for_frontend_callback, websocket=None) -> None:
        try:
                while self.generation < self.max_generations:
                    # Process generation
                    fitness_values = await self._evaluate_population(wait_for_frontend_callback,websocket)
                    logger.info(fitness_values)
                    self._update_best_solution(fitness_values)               
                    self._create_next_generation(fitness_values)
                    logger.info(f"mutation rate: {self.mutation_rate}")
                    
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
                        'average_fitness': -avg_fitness,
                        'population_diversity': diversity,
                        'status': 'running'
                    }
                    
                    #logger.info(f"Generation {self.generation} complete. Best fitness: {self.best_fitness}")
                    if self.problem_type == "tsp":
                        await update_callback(update_data)
                    
                    # Control evolution speed
                    await asyncio.sleep(.1)
                    self.generation += 1   
                await close_callback()
        except Exception as e:
            logger.error(f"Error in generation {self.generation}: {str(e)}")
            raise
                
        logger.info(f"Evolution completed for task {task_id}")