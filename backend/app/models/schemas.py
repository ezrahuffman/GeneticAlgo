from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict
from enum import Enum

class ProblemType(str, Enum):
    TSP = "tsp"
    GPA = "GPA"
    #FUNCTION_OPTIMIZATION = "function_optimization"
    #KNAPSACK = "knapsack"

class OptimizationRequest(BaseModel):
    problem_type: ProblemType
    population_size: int = Field(
        default=50,
        ge=10,  # greater than or equal to 10
        le=1000,  # less than or equal to 1000
        description="Size of the population for genetic algorithm"
    )
    dimension: int = Field(
        default=10,
        ge=2,
        le=100,
        description="Dimension of the problem space"
    )
    mutation_rate: float = Field(
        default=0.1,
        ge=0.0,
        le=1.0,
        description="Probability of mutation"
    )
    crossover_rate: float = Field(
        default=0.8,
        ge=0.0,
        le=1.0,
        description="Probability of crossover"
    )
    max_generations: int = Field(
        default=100,
        ge=1,
        le=1000,
        description="Maximum number of generations"
    )
    parameters: Optional[Dict] = Field(
        default={},
        description="Additional problem-specific parameters"
    )

    @validator('parameters')
    def validate_parameters(cls, v, values):
        if values['problem_type'] == ProblemType.TSP:
            if 'cities' not in v:
                raise ValueError("TSP problem type requires 'cities' parameter")
        return v

class TaskResponse(BaseModel):
    task_id: str
    status: str
    created_at: Optional[str] = None
    message: Optional[str] = None

class EvolutionUpdate(BaseModel):
    task_id: str
    generation: int
    best_fitness: float
    current_fitness: float
    best_solution: List[float]
    average_fitness: Optional[float] = None
    population_diversity: Optional[float] = None
    status: str
    elapsed_time: Optional[float] = None

class TaskStatus(BaseModel):
    task_id: str
    status: str
    progress: float
    current_generation: int
    best_fitness: float
    start_time: str
    elapsed_time: float