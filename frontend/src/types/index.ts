export interface OptimizationConfig {
    problem_type: 'tsp' | 'function_optimization' | 'knapsack';
    population_size: number;
    dimension: number;
    mutation_rate: number;
    crossover_rate: number;
    max_generations: number;
    parameters?: Record<string, any>;
}

export interface TaskResponse {
    task_id: string;
    status: string;
    created_at?: string;
    message?: string;
}

export interface EvolutionUpdate {
    task_id: string;
    generation: number;
    best_fitness: number;
    current_fitness: number;
    best_solution: number[];
    average_fitness?: number;
    population_diversity?: number;
    status: string;
    elapsed_time?: number;
}

export interface TaskStatus {
    task_id: string;
    status: string;
    progress: number;
    current_generation: number;
    best_fitness: number;
    start_time: string;
    elapsed_time: number;
}