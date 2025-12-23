import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Axios Instance erstellen
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - JWT Token hinzufügen
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Error Handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Token abgelaufen - Refresh versuchen
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data;
          localStorage.setItem('token', token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh fehlgeschlagen - Logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Helper Functions
export const apiHelpers = {
  // GET Request
  get: <T>(url: string, params?: object) => 
    api.get<T>(url, { params }).then(res => res.data),

  // POST Request
  post: <T>(url: string, data?: object) => 
    api.post<T>(url, data).then(res => res.data),

  // PUT Request
  put: <T>(url: string, data?: object) => 
    api.put<T>(url, data).then(res => res.data),

  // PATCH Request
  patch: <T>(url: string, data?: object) => 
    api.patch<T>(url, data).then(res => res.data),

  // DELETE Request
  delete: <T>(url: string) => 
    api.delete<T>(url).then(res => res.data),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiHelpers.post<{ token: string; refreshToken: string; user: object }>('/auth/login', { email, password }),

  register: (email: string, password: string, name: string) =>
    apiHelpers.post<{ token: string; refreshToken: string; user: object }>('/auth/register', { email, password, name }),

  logout: () => apiHelpers.post('/auth/logout'),

  me: () => apiHelpers.get<{ user: object }>('/auth/me'),

  refreshToken: (refreshToken: string) =>
    apiHelpers.post<{ token: string }>('/auth/refresh', { refreshToken }),
};

// Chat API
export const chatApi = {
  getChats: () => apiHelpers.get<{ chats: object[] }>('/chats'),

  getChat: (chatId: string) => apiHelpers.get<{ chat: object }>(`/chats/${chatId}`),

  createChat: (params: { title?: string; mode?: string; modelIds?: string[] }) =>
    apiHelpers.post<{ chat: object }>('/chats', params),

  deleteChat: (chatId: string) => apiHelpers.delete(`/chats/${chatId}`),

  sendMessage: (chatId: string, content: string) =>
    apiHelpers.post<{ message: object }>(`/chats/${chatId}/messages`, { content }),

  getMessages: (chatId: string) =>
    apiHelpers.get<{ messages: object[] }>(`/chats/${chatId}/messages`),
};

// Arena API
export const arenaApi = {
  getModels: () => apiHelpers.get<{ models: object[] }>('/arena/models'),

  getModes: () => apiHelpers.get<{ modes: object[] }>('/arena/modes'),

  changeMode: (chatId: string, mode: string) =>
    apiHelpers.post(`/arena/chats/${chatId}/mode`, { mode }),

  selectModels: (chatId: string, modelIds: string[]) =>
    apiHelpers.post(`/arena/chats/${chatId}/models`, { modelIds }),

  analyzeTask: (content: string) =>
    apiHelpers.post<{ analysis: object }>('/arena/analyze', { content }),

  recommend: (task: string) =>
    apiHelpers.post<{ recommendations: Array<{ modelId: string; confidence: number; reason: string }> }>('/arena/recommend', { task }),

  getStats: () =>
    apiHelpers.get<{ stats: object }>('/arena/stats'),
};

// Memory API
export const memoryApi = {
  getMemories: (params?: { type?: string; limit?: number }) =>
    apiHelpers.get<{ memories: object[] }>('/memory', params),

  recall: (query: string, limit?: number) =>
    apiHelpers.post<{ memories: object[] }>('/memory/recall', { query, limit }),

  getContext: (chatId: string) =>
    apiHelpers.get<{ context: object }>(`/memory/context/${chatId}`),

  getSettings: () => apiHelpers.get<{ settings: object }>('/memory/settings'),

  updateSettings: (settings: object) =>
    apiHelpers.put<{ settings: object }>('/memory/settings', settings),

  deleteAll: () => apiHelpers.delete('/memory/all'),

  export: () => apiHelpers.post<{ data: object }>('/memory/export'),
};

// Knowledge Base API
export const knowledgeApi = {
  getEntries: (params?: { status?: string; tags?: string[] }) =>
    apiHelpers.get<{ entries: object[] }>('/knowledge', params),

  createEntry: (data: { content: string; tags?: string[] }) =>
    apiHelpers.post<{ entry: object }>('/knowledge', data),

  verifyEntry: (entryId: string) =>
    apiHelpers.post(`/knowledge/${entryId}/verify`),

  search: (query: string) =>
    apiHelpers.post<{ results: object[] }>('/knowledge/search', { query }),
};

// Learning API
export const learningApi = {
  getProposedRules: () =>
    apiHelpers.get<{ rules: object[] }>('/learning/rules/proposed'),

  getActiveRules: () =>
    apiHelpers.get<{ rules: object[] }>('/learning/rules/active'),

  approveRule: (ruleId: string) =>
    apiHelpers.post(`/learning/rules/${ruleId}/approve`),

  rejectRule: (ruleId: string, reason: string) =>
    apiHelpers.post(`/learning/rules/${ruleId}/reject`, { reason }),

  deleteRule: (ruleId: string) =>
    apiHelpers.delete(`/learning/rules/${ruleId}`),

  getStatistics: () =>
    apiHelpers.get<{ statistics: object }>('/learning/statistics'),

  recordEvent: (data: { type: string; modelId: string; chatId: string; content: string }) =>
    apiHelpers.post('/learning/events', data),

  recordCorrection: (data: { messageId: string; originalContent: string; correctedContent: string }) =>
    apiHelpers.post('/learning/corrections', data),

  recordFeedback: (data: { messageId: string; isPositive: boolean; reason?: string }) =>
    apiHelpers.post('/learning/feedback', data),
};

// Teams API
export const teamsApi = {
  getTeams: () => apiHelpers.get<{ teams: object[] }>('/teams'),

  createTeam: (data: { name: string; description?: string }) =>
    apiHelpers.post<{ team: object }>('/teams', data),

  inviteMember: (teamId: string, email: string, role?: string) =>
    apiHelpers.post(`/teams/${teamId}/invite`, { email, role }),

  removeMember: (teamId: string, userId: string) =>
    apiHelpers.delete(`/teams/${teamId}/members/${userId}`),

  updateSettings: (teamId: string, settings: object) =>
    apiHelpers.put(`/teams/${teamId}/settings`, settings),
};

// Prompts API
export const promptsApi = {
  getPrompts: (params?: { category?: string; favorites?: boolean }) =>
    apiHelpers.get<{ prompts: object[] }>('/prompts', params),

  createPrompt: (data: { title: string; content: string; category?: string }) =>
    apiHelpers.post<{ prompt: object }>('/prompts', data),

  toggleFavorite: (promptId: string) =>
    apiHelpers.post(`/prompts/${promptId}/favorite`),

  suggest: (description: string) =>
    apiHelpers.post<{ suggestion: string }>('/prompts/suggest', { description }),
};

// Default Export
export default api;
