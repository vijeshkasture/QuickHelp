// API service configuration for KaamSetu backend connection
export const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'https://quickhelp-7h8q.onrender.com';
export const API_BASE_URL = `${BACKEND_URL}/api`;

export async function checkBackendHealth(): Promise<{ status: string; healthy: boolean }> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    if (!res.ok) return { status: 'unreachable', healthy: false };
    const data = await res.json();
    return { status: data.status || 'online', healthy: data.status === 'healthy' };
  } catch (e) {
    return { status: 'offline', healthy: false };
  }
}
