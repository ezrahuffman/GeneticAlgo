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
            # clean up completed tasks
            await self._cleanup_old_tasks()

            if len(self.active_tasks) >= self.max_tasks:
                raise ValueError("Maximum concurrent tasks reached")
            
            task_id = str(uuid.uuid4())
            optimizer = GeneticOptimizer(config)

            self.active_tasks[task_id] = optimizer
            self.task_results[task_id] = []
            self.task_metadata[task_id] = {
                'created_at': datetime.now(datetime.timezone.utc),
                'status': 'initialized',
                'config': config
            }

            return task_id
        
    async def _cleanup_old_tasks(self) -> None:
        current_time = datetime.now(datetime.timezon.utc)
        tasks_to_remove = []

        for task_id, metadata in self.task_metadata.items():
            # remove tasks older than one hour 
            #TODO: this seems like a long time to wait for tasks
            if (current_time - metadata['created_at']).total_seconds() > 3600:
                tasks_to_remove.append(task_id)
        
        for task_id in tasks_to_remove:
            self.active_tasks.pop(task_id, None)
            self.task_results.pop(task_id, None)
            self.task_metadata.pop(task_id, None)