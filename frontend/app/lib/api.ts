import axios from 'axios';
import envManager from './env';

const API_BASE_URL = envManager.getApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request/response interceptors for logging in debug mode
if (envManager.isDebug()) {
  apiClient.interceptors.request.use(
    (config) => {
      envManager.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      envManager.log(`API Request Error: ${error.message}`, 'error');
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response) => {
      envManager.log(`API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      envManager.log(`API Response Error: ${error.message}`, 'error');
      return Promise.reject(error);
    }
  );
}

export interface AnalysisRequest {
  [key: string]: any;
}

export interface AnalysisResponse {
  result?: string;
  error?: string;
}

export const api = {
  // Health check
  health: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Position analysis (streaming by default)
  analyzePosition: async (data: AnalysisRequest, stream: boolean = true): Promise<AnalysisResponse> => {
    if (stream) {
      const response = await apiClient.post('/analyze/position', data, { params: { stream: true } });
      return response.data;
    } else {
      const response = await apiClient.post('/analyze/position', data, { params: { stream: false } });
      return response.data;
    }
  },

  // Top earning analysis (streaming by default)
  analyzeTopEarning: async (data: AnalysisRequest, stream: boolean = true): Promise<AnalysisResponse> => {
    if (stream) {
      const response = await apiClient.post('/analyze/top-earning', data, { params: { stream: true } });
      return response.data;
    } else {
      const response = await apiClient.post('/analyze/top-earning', data, { params: { stream: false } });
      return response.data;
    }
  },

  // Chat with AI assistant (streaming by default)
  chat: async (data: AnalysisRequest, stream: boolean = true): Promise<AnalysisResponse> => {
    if (stream) {
      const response = await apiClient.post('/chat', data, { params: { stream: true } });
      return response.data;
    } else {
      const response = await apiClient.post('/chat', data, { params: { stream: false } });
      return response.data;
    }
  },

  // Streaming methods for real-time updates
  streamAnalyzePosition: async (data: AnalysisRequest) => {
    const response = await fetch(`${API_BASE_URL}/analyze/position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  streamAnalyzeTopEarning: async (data: AnalysisRequest) => {
    const response = await fetch(`${API_BASE_URL}/analyze/top-earning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  streamChat: async (data: AnalysisRequest) => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },
};

export default api;
