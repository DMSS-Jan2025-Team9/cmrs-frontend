// Polyfill for SockJS which expects Node.js globals in browser environment
if (typeof window !== 'undefined') {
  // Provide global for sockjs-client
  if (!window.global) {
    (window as any).global = window;
  }
  
  // Provide process.env for libraries expecting Node environment
  if (!(window as any).process) {
    (window as any).process = { env: { DEBUG: undefined } };
  }
  
  // Provide Buffer for libraries expecting Node environment
  if (!(window as any).Buffer) {
    (window as any).Buffer = {
      isBuffer: () => false
    };
  }
} 