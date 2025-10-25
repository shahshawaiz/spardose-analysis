import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AnalysisRequest {
  [key: string]: any;
}

export interface AnalysisResponse {
  result?: string;
  error?: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response?: string;
  error?: string;
}

export const api = {
  // Health check
  health: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Chat completion (streaming by default)
  chat: async (message: string, stream: boolean = true): Promise<ChatResponse> => {
    if (stream) {
      const response = await apiClient.post('/chat/stream', message);
      return response.data;
    } else {
      const response = await apiClient.post('/chat', message);
      return response.data;
    }
  },

  // General analysis (streaming by default)
  analyze: async (data: AnalysisRequest, stream: boolean = true): Promise<AnalysisResponse> => {
    if (stream) {
      const response = await apiClient.post('/analyze', data, { params: { stream: true } });
      return response.data;
    } else {
      const response = await apiClient.post('/analyze', data, { params: { stream: false } });
      return response.data;
    }
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

  // Position plans analysis (streaming by default)
  findPositionPlans: async (data: AnalysisRequest, stream: boolean = true): Promise<AnalysisResponse> => {
    if (stream) {
      const response = await apiClient.post('/analyze/position-plans', data, { params: { stream: true } });
      return response.data;
    } else {
      const response = await apiClient.post('/analyze/position-plans', data, { params: { stream: false } });
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

  // Streaming methods for real-time updates
  streamChat: async (message: string) => {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    return response;
  },

  streamAnalyze: async (data: AnalysisRequest) => {
    const response = await fetch(`${API_BASE_URL}/analyze/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  streamAnalyzePosition: async (data: AnalysisRequest) => {
    const response = await fetch(`${API_BASE_URL}/analyze/position/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  streamFindPositionPlans: async (data: AnalysisRequest) => {
    const response = await fetch(`${API_BASE_URL}/analyze/position-plans/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  streamAnalyzeTopEarning: async (data: AnalysisRequest) => {
    const response = await fetch(`${API_BASE_URL}/analyze/top-earning/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },
};

export default api;
