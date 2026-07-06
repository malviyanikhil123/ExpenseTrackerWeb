declare global {
    interface Window {
        __APP_CONFIG__?: {
            VITE_API_URL?: string;
        };
    }
}

export const API_URL = (() => {
  if (window.__APP_CONFIG__?.VITE_API_URL) {
    return window.__APP_CONFIG__.VITE_API_URL;
  }

  const host = window.location.hostname;
  switch (host) {
    case "expensetracker.nikhilmalviya.online":
      return "https://api-expensetracker.nikhilmalviya.online";
    case "100.113.63.36":
      return "http://100.113.63.36:5003";
    case "localhost":
      return "http://localhost:6003";
    default:
      return "http://100.113.63.36:5003";
  }
})();