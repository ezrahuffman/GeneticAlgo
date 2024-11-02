from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .core.task_manager import TaskManager
from .models.schemas import OptimizationRequest, TaskResponse
import asyncio
import logging 
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),  # Print to console
        logging.FileHandler('app.log')      # Also save to file
    ]
)

# Create logger for this file
logger = logging.getLogger(__name__)

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
            logger.info("optimizer is null")
            await websocket.close(code=4004)
            return

        async def update_callback(data):
            await websocket.send_json(data)

        async def close_callback():
            await websocket.close()

        await optimizer.evolve(task_id, update_callback, close_callback)
    except Exception as e:
        logger.info(e)
        await websocket.close(code=1011)