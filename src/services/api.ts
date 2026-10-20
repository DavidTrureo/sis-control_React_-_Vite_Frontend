import axios from 'axios';

// URL Base del Backend Java Spring Boot (configurable en producción mediante VITE_API_URL)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const TokenService = {
  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  },
  
  saveToken(token: string): void {
    localStorage.setItem('jwt_token', token);
  },
  
  removeToken(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
  },
  
  saveUser(user: any): void {
    localStorage.setItem('user_data', JSON.stringify(user));
  },
  
  getUser(): any | null {
    const data = localStorage.getItem('user_data');
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
};

// Interceptor para adjuntar el token JWT en cada solicitud
api.interceptors.request.use(
  (config) => {
    const token = TokenService.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas fallidas (e.g. token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Redirigir silenciosamente al login si la sesión expira
      TokenService.removeToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export async function downloadFile(endpoint: string, defaultFilename: string) {
  const token = TokenService.getToken();
  const res = await axios.get(`${API_URL}${endpoint}`, {
    responseType: 'blob',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

