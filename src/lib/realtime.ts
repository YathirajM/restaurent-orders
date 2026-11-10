// Real-time event bus using BroadcastChannel for cross-tab communication
export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_UPDATED'
  | 'PAYMENT_UPDATED'
  | 'PRODUCT_UPDATED'
  | 'TABLE_UPDATED';

interface RealtimePayload {
  type: RealtimeEventType;
  data: any;
  timestamp: number;
}

const CHANNEL_NAME = 'urban_plate_realtime';

class RealtimeBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<RealtimeEventType, Set<(data: any) => void>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        const payload: RealtimePayload = event.data;
        this.dispatch(payload.type, payload.data);
      };
    }
  }

  subscribe(type: RealtimeEventType, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  emit(type: RealtimeEventType, data: any) {
    const payload: RealtimePayload = {
      type,
      data,
      timestamp: Date.now(),
    };
    // Notify same tab
    this.dispatch(type, data);
    // Notify other tabs
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  private dispatch(type: RealtimeEventType, data: any) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach(fn => {
        try {
          fn(data);
        } catch (e) {
          console.error('Realtime handler error:', e);
        }
      });
    }
  }
}

export const realtime = new RealtimeBus();