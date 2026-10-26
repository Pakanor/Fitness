import apiClient, { API_BASE_URL } from './client';

const USER_URL = `${API_BASE_URL}/api/user`;
const MEASUREMENT_URL = `${API_BASE_URL}/api/body-measurements`;

export const registerUser = async (formData) => {
  const response = await apiClient.post('/api/auth/register', formData);
  return response.data;
};

export const loginUser = async (formData) => {
  const response = await apiClient.post('/api/auth/login', formData);
  return response.data;
};

export const fetchMe = async () => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
};

export const fetchProfile = async () => {
  const response = await fetch(`${USER_URL}/profile`, { credentials: 'include' });
  if (!response.ok) throw new Error('Błąd pobierania profilu');
  return response.json();
};

export const updateUserProfile = async (data) => {
  const res = await fetch(`${USER_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Błąd aktualizacji profilu');
};

export const logoutUser = async () => {
  await apiClient.post('/api/auth/logout');
};

export const changePassword = async (data) => {
  const response = await fetch(`${USER_URL}/change-password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(await response.text() || 'Błąd zmiany hasła');
};

export const exportUserData = async () => {
  const response = await fetch(`${USER_URL}/export`, { credentials: 'include' });
  if (!response.ok) throw new Error('Błąd eksportu danych');
  return response.json();
};

export const deleteUserAccount = async () => {
  const response = await fetch(`${USER_URL}/delete`, { method: 'DELETE', credentials: 'include' });
  if (!response.ok) throw new Error('Błąd usuwania konta');
};

export const fetchActiveSessions = async () => {
  const response = await fetch(`${USER_URL}/sessions`, { credentials: 'include' });
  if (!response.ok) throw new Error('Błąd pobierania sesji');
  return response.json();
};

const MEASUREMENT_URL = 'http://localhost:8000/api/body-measurements';

export const createBodyMeasurement = async (data) => {
  const res = await fetch(`${MEASUREMENT_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Błąd zapisu pomiarów');
  return await res.json();
};

export const getBodyMeasurements = async () => {
  const res = await fetch(`${MEASUREMENT_URL}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Błąd pobierania pomiarów');
  return await res.json();
};

export const deleteBodyMeasurement = async (id) => {
  const res = await fetch(`${MEASUREMENT_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Błąd usuwania pomiaru');
};
