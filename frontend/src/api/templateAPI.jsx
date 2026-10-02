const API_URL = 'http://localhost:8000/api';

const apiClient = async (url, options = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'API request failed');
  }

  return response.json();
};

export const templateAPI = {
  getTemplates: () => apiClient('/templates'),
  
  getTemplate: (id) => apiClient(`/templates/${id}`),
  
  createTemplate: (data) => apiClient('/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateTemplate: (id, data) => apiClient(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteTemplate: (id) => apiClient(`/templates/${id}`, {
    method: 'DELETE',
  }),

  getPreviousWorkout: () => apiClient('/workout-start/previous'),

  getPreviousByTemplate: (templateId) => apiClient(`/workout-start/previous-by-template/${templateId}`),
  
  startFromTemplate: (templateId) => apiClient(`/workout-start/from-template/${templateId}`, {
    method: 'POST',
  }),
  
  copyPreviousWorkout: () => apiClient('/workout-start/copy-previous', {
    method: 'POST',
  }),

  copyPreviousByTemplate: (templateId) => apiClient(`/workout-start/copy-previous/${templateId}`, {
    method: 'POST',
  }),

  getWorkoutStartTemplates: () => apiClient('/workout-start/templates'),
};