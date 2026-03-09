// Use relative /api path for Vercel serverless functions, or localhost for development
const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-app-password': APP_PASSWORD,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }

  return data.data;
}

// Chat API
export const chatApi = {
  createSession: (userId: string, organizationId: string) =>
    request<{ sessionId: string }>('/chat/sessions', {
      method: 'POST',
      body: { userId, organizationId },
    }),

  sendMessage: (sessionId: string, content: string) =>
    request<{ messageId: string; response: any }>(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: { content },
    }),

  getSession: (sessionId: string) =>
    request<any>(`/chat/sessions/${sessionId}`),
};

// Campaign API
export const campaignApi = {
  list: (organizationId: string) =>
    request<any[]>(`/campaigns?organizationId=${organizationId}`),

  get: (id: string) =>
    request<any>(`/campaigns/${id}`),

  create: (data: any) =>
    request<{ id: string }>('/campaigns', { method: 'POST', body: data }),

  update: (id: string, data: any) =>
    request<void>(`/campaigns/${id}`, { method: 'PUT', body: data }),

  launch: (id: string) =>
    request<void>(`/campaigns/${id}/launch`, { method: 'POST' }),

  pause: (id: string) =>
    request<void>(`/campaigns/${id}/pause`, { method: 'POST' }),

  delete: (id: string) =>
    request<void>(`/campaigns/${id}`, { method: 'DELETE' }),
};

// Content Spots API
export const contentSpotApi = {
  list: (organizationId: string) =>
    request<any[]>(`/content-spots?organizationId=${organizationId}`),

  get: (id: string) =>
    request<any>(`/content-spots/${id}`),

  create: (data: any) =>
    request<{ id: string }>('/content-spots', { method: 'POST', body: data }),

  update: (id: string, data: any) =>
    request<void>(`/content-spots/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    request<void>(`/content-spots/${id}`, { method: 'DELETE' }),
};

// TD Agent API
export const tdAgentApi = {
  // Create a new chat session
  createSession: () =>
    request<{ chatId: string; raw: any }>('/td-agent/sessions', {
      method: 'POST',
      body: {},
    }),

  // Send message (non-streaming, returns full response)
  sendMessage: (chatId: string, message: string) =>
    request<{ message: string; chatId: string }>(`/td-agent/sessions/${chatId}/message`, {
      method: 'POST',
      body: { message },
    }),

  // Get chat history
  getHistory: (chatId: string) =>
    request<any>(`/td-agent/sessions/${chatId}/history`),

  // Get agent status
  getStatus: () =>
    request<any>('/td-agent/status'),
};

// Templates API
export const templateApi = {
  list: (organizationId: string, category?: string) => {
    let url = `/templates?organizationId=${organizationId}`;
    if (category) url += `&category=${category}`;
    return request<any[]>(url);
  },

  create: (data: any) =>
    request<{ id: string }>('/templates', { method: 'POST', body: data }),

  update: (id: string, data: any) =>
    request<void>(`/templates/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    request<void>(`/templates/${id}`, { method: 'DELETE' }),
};

// Parent Segments API (Treasure Data CDP)
export const parentSegmentApi = {
  list: () =>
    request<any[]>('/parent-segments'),

  get: (id: string) =>
    request<any>(`/parent-segments/${id}`),
};
