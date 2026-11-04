// Cross-tab and server-synchronized event bus for Customer, Admin, and KDS

export type RealtimeEventType =
  | "ORDER_CREATED"
  | "ORDER_STATUS_UPDATED"
  | "PRODUCT_AVAILABILITY_CHANGED"
  | "TABLE_STATUS_CHANGED"
  | "MENU_UPDATED";

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  data: any;
  timestamp: number;
}

const CHANNEL_NAME = "urban_plate_realtime_channel";

class RealtimeBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<RealtimeEventType, Set<(payload: any) => void>> = new Map();

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        const payload: RealtimeEventPayload = event.data;
        this.dispatch(payload.type, payload.data);
      };
    }
  }

  public subscribe(type: RealtimeEventType, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  public emit(type: RealtimeEventType, data: any) {
    const payload: RealtimeEventPayload = {
      type,
      data,
      timestamp: Date.now(),
    };

    // Notify local tab
    this.dispatch(type, data);

    // Notify other tabs
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (err) {
        console.warn("BroadcastChannel error:", err);
      }
    }
  }

  private dispatch(type: RealtimeEventType, data: any) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error("Error executing realtime listener:", e);
        }
      });
    }
  }
}

// Global singleton instance
export const realtime = new RealtimeBus();
