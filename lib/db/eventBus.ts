// Update gallery when new photo is taken
type Listener = (payload: any) => void;

const listeners: Record<string, Listener[]> = {};

export function emit(event: string, payload?: any) {
  (listeners[event] || []).forEach((l) => l(payload));
}

export function on(event: string, listener: Listener) {
  listeners[event] = listeners[event] || [];
  listeners[event].push(listener);
  return () => {
    listeners[event] = listeners[event].filter((l) => l !== listener);
  };
}
