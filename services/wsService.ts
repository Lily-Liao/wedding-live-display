
import { WsEvent, WsEventType } from '../types';

type WsCallback = (payload: any) => void;

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
const RECONNECT_INTERVAL = 3000;

class WeddingWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<WsEventType, Set<WsCallback>> = new Map();
  private reconnectTimer: number | null = null;
  private shouldReconnect = false;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.shouldReconnect = true;
    this.initWebSocket();
  }

  private initWebSocket() {
    try {
      this.ws = new WebSocket(WS_URL);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log(`[WS] Connected to ${WS_URL}`);
      this.clearReconnectTimer();
    };

    this.ws.onmessage = (event) => {
      try {
        const wsEvent: WsEvent = JSON.parse(event.data);
        if (wsEvent.type) {
          this.dispatch(wsEvent.type, wsEvent.payload);
        }
      } catch (e) {
        console.error('[WS] Message parse error:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      this.ws = null;
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setInterval(() => {
      console.log('[WS] Attempting reconnect...');
      this.initWebSocket();
    }, RECONNECT_INTERVAL);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private dispatch(type: WsEventType, payload: unknown) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
  }

  on(type: WsEventType, callback: WsCallback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  off(type: WsEventType, callback: WsCallback) {
    this.listeners.get(type)?.delete(callback);
  }

  send(event: WsEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('[WS] Cannot send, not connected');
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
export const wsService = new WeddingWebSocketService();