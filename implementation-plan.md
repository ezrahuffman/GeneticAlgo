# Implementation Plan: Distributed Genetic Algorithm System

## Phase 1: Core Backend Implementation (1-2 weeks)

### 1.1 Project Setup
```bash
project_root/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models/
│   │   ├── core/
│   │   └── api/
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
├── frontend/
└── docker/
```

### 1.2 Core Components

#### Task Manager Implementation
```python
# app/core/task_manager.py
from typing import Dict, Optional
from datetime import datetime
import asyncio
import uuid
from .optimizer import GeneticOptimizer

class TaskManager:
    def __init__(self):
        self.active_tasks: Dict[str, GeneticOptimizer] = {}
        self.task_results: Dict[str, list] = {}
        self.task_metadata: Dict[str, dict] = {}
        self.max_tasks = 5
        self._cleanup_lock = asyncio.Lock()

    async def create_task(self, config: dict) -> str:
        async with self._cleanup_lock:
            # Clean up completed tasks
            await self._cleanup_old_tasks()
            
            if len(self.active_tasks) >= self.max_tasks:
                raise ValueError("Maximum concurrent tasks reached")
            
            task_id = str(uuid.uuid4())
            optimizer = GeneticOptimizer(config)
            
            self.active_tasks[task_id] = optimizer
            self.task_results[task_id] = []
            self.task_metadata[task_id] = {
                'created_at': datetime.utcnow(),
                'status': 'initialized',
                'config': config
            }
            
            return task_id

    async def _cleanup_old_tasks(self):
        current_time = datetime.utcnow()
        tasks_to_remove = []
        
        for task_id, metadata in self.task_metadata.items():
            # Remove tasks older than 1 hour
            if (current_time - metadata['created_at']).total_seconds() > 3600:
                tasks_to_remove.append(task_id)
        
        for task_id in tasks_to_remove:
            self.active_tasks.pop(task_id, None)
            self.task_results.pop(task_id, None)
            self.task_metadata.pop(task_id, None)
```

#### Genetic Algorithm Implementation
```python
# app/core/optimizer.py
import numpy as np
from typing import List, Tuple
import asyncio

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

    async def evolve(self, task_id: str, update_callback) -> None:
        while self.generation < 100:  # Limit generations
            # Process generation
            fitness_values = self._evaluate_population()
            self._update_best_solution(fitness_values)
            self._create_next_generation(fitness_values)
            
            # Send update
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
```

## Phase 2: API Layer Implementation (3-4 days)

### 2.1 FastAPI Setup
```python
# app/main.py
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .core.task_manager import TaskManager
from .models.schemas import OptimizationRequest, TaskResponse
import asyncio

app = FastAPI()
task_manager = TaskManager()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/tasks", response_model=TaskResponse)
async def create_task(request: OptimizationRequest):
    try:
        task_id = await task_manager.create_task(request.dict())
        return TaskResponse(task_id=task_id, status="created")
    except ValueError as e:
        raise HTTPException(status_code=429, detail=str(e))

@app.websocket("/ws/tasks/{task_id}")
async def task_websocket(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        optimizer = task_manager.active_tasks.get(task_id)
        if not optimizer:
            await websocket.close(code=4004)
            return

        async def update_callback(data):
            await websocket.send_json(data)

        await optimizer.evolve(task_id, update_callback)
    except Exception as e:
        await websocket.close(code=1011)
```

## Phase 3: Frontend Implementation (1 week)

### 3.1 React Setup
```bash
npx create-react-app frontend --template typescript
cd frontend
npm install @chakra-ui/react recharts @emotion/react @emotion/styled framer-motion
```

### 3.2 Core Components
```typescript
// src/components/OptimizationDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text } from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { WebSocketClient } from '../services/websocket';

export const OptimizationDashboard: React.FC = () => {
    const [evolutionData, setEvolutionData] = useState([]);
    const [currentTask, setCurrentTask] = useState(null);

    useEffect(() => {
        if (currentTask) {
            const ws = new WebSocketClient(
                `ws://localhost:8000/ws/tasks/${currentTask.id}`,
                handleUpdate
            );
            return () => ws.disconnect();
        }
    }, [currentTask]);

    const handleUpdate = (data) => {
        setEvolutionData(prev => [...prev, data]);
    };

    return (
        <Box p={6}>
            <VStack spacing={6}>
                <HStack>
                    <Text fontSize="2xl">Evolution Progress</Text>
                </HStack>
                <Box w="100%" h="400px">
                    <LineChart data={evolutionData} width={800} height={400}>
                        <Line type="monotone" dataKey="best_fitness" stroke="#8884d8" />
                        <XAxis dataKey="generation" />
                        <YAxis />
                        <Tooltip />
                    </LineChart>
                </Box>
            </VStack>
        </Box>
    );
};
```

## Phase 4: Deployment Setup (2-3 days)

### 4.1 Docker Configuration
```dockerfile
# docker/Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY backend/app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 4.2 Nginx Configuration
```nginx
# docker/nginx.conf
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Phase 5: Testing and Optimization (3-4 days)

### 5.1 Backend Tests
```python
# tests/test_optimizer.py
import pytest
from app.core.optimizer import GeneticOptimizer

@pytest.mark.asyncio
async def test_optimizer_evolution():
    config = {
        'population_size': 20,
        'problem_type': 'tsp',
        'dimension': 10
    }
    optimizer = GeneticOptimizer(config)
    
    updates = []
    async def mock_callback(data):
        updates.append(data)
    
    await optimizer.evolve('test-task', mock_callback)
    
    assert len(updates) > 0
    assert all('best_fitness' in update for update in updates)
```

## Deployment Steps:

1. Provision Server (DigitalOcean $5 Droplet)
```bash
# Initial server setup
apt update && apt upgrade -y
apt install docker.io docker-compose nginx certbot python3-certbot-nginx -y
```

2. Deploy Application
```bash
# Clone repository and deploy
git clone your-repo
cd your-repo
docker-compose up -d
```

3. SSL Setup
```bash
# Configure SSL
certbot --nginx -d your-domain.com
```

## Resource Management:

1. Memory Optimization:
- Limit maximum concurrent tasks
- Implement task cleanup
- Use efficient numpy operations

2. CPU Management:
- Add delay between generations
- Limit population size
- Implement task queuing

3. Monitoring:
- Add basic metrics collection
- Implement health checks
- Set up error logging

Would you like me to expand on any of these phases or provide more detailed code examples for specific components?