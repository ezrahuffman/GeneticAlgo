import { OptimizationConfig } from "../types";

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private onMessage: (data: any) => void;

    constructor(url: string, onMessage: (data: any) => void) {
        this.url = url;
        this.onMessage = onMessage;
        this.connect();
    }

    private connect(): void {
        this.ws = new WebSocket(this.url);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.onMessage(data);
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// frontend/src/services/api.ts
const API_URL = import.meta.env.VITE_REACT_APP_WS_URL;

export const createOptimizationTask = async (config: OptimizationConfig) => {
    const response = await fetch(`${API_URL}/api/optimize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });
    return response.json();
};