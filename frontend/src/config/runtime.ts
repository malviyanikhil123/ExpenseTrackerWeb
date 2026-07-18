declare global {
  interface Window {
    __APP_CONFIG__?: {
      VITE_API_URL?: string;
    };
  }
}

export function getApiUrl(): string {
  if (window.__APP_CONFIG__?.VITE_API_URL) {
    return window.__APP_CONFIG__.VITE_API_URL;
  }

  const host = window.location.hostname;

  switch (host) {
    case "spendra.nikhilmalviya.online":
      return "https://api-spendra.nikhilmalviya.online";

    case "100.113.63.36":
      return "http://100.113.63.36:5003";

    case "localhost":
      return "http://localhost:6003";

    default:
      return "http://100.113.63.36:5003";
  }
}

export const API_URL = getApiUrl();