// Pendo/Novus analytics agent, injected via the snippet in index.html.
declare const pendo: {
  initialize: (options: Record<string, unknown>) => void;
  identify: (options: Record<string, unknown>) => void;
  clearSession: () => void;
  track: (name: string, props?: Record<string, unknown>) => void;
};
