declare global {
    interface Window {
        __APP_CONFIG__?: {
            VITE_API_URL?: string;
        };
    }
}

export const API_URL =
    window.__APP_CONFIG__?.VITE_API_URL ??
    import.meta.env.VITE_API_URL ??
    "http://localhost:5003";