const API_URL = 'http://localhost:8000/api';

const request = async (url, options = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(
      (data && (data.title || data.message)) || text || 'API request failed',
    );
    error.status = response.status;
    throw error;
  }

  return data;
};

export const workoutAPI = {
  /** Session planned/executed on a given day, or null when the day is empty. */
  getSession: async (date) => {
    try {
      return await request(`/workouts?date=${date}`);
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  getSessionById: (id) => request(`/workouts/${id}`),

  /** Newest session still in progress (any day). Null once it is finished. */
  getActiveSession: async () => {
    try {
      return await request('/workouts/active');
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  },

  /** Creates a PLANNED session for the target date from a template. */
  loadTemplate: (templateId, date) =>
    request(`/workouts/from-template/${templateId}`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),

  startWorkout: (id) => request(`/workouts/${id}/start`, { method: 'PATCH' }),

  finishWorkout: (id) => request(`/workouts/${id}/finish`, { method: 'PATCH' }),

  /** Reopens a finished workout so sets can be logged again. */
  reopenWorkout: (id) => request(`/workouts/${id}/reopen`, { method: 'PATCH' }),

  /** Logs sets on a session item (or adds a new item when userExerciseId is null). */
  logSet: (payload) =>
    request('/workouts/sets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const SESSION_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};
