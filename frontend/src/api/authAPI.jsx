import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const registerUser = async (formData) => {
  const response = await apiClient.post('/register', formData);
  return response.data;
};

export const loginUser = async (formData) => {
  const response = await apiClient.post('/login', formData);
  return response.data;
};

export const verifyEmail = async (token) => {
  const response = await apiClient.get(`/verify?token=${token}`);
  return response.data;
};

export const fetchMe = async () => {
  const response = await apiClient.get('/me');
  return response.data;
};

const USER_URL = 'http://localhost:8000/api/user';

export const getUserProfile = async () => {
  const res = await fetch(`${USER_URL}/profile`, { credentials: 'include' });
  if (!res.ok) throw new Error('Błąd pobierania profilu');
  return await res.json();
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
  await apiClient.post('/logout');
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

export const getLatestBodyMeasurement = async () => {
  const res = await fetch(`${MEASUREMENT_URL}/latest`, { credentials: 'include' });
  if (!res.ok) return null;
  return await res.json();
};

export const deleteBodyMeasurement = async (id) => {
  const res = await fetch(`${MEASUREMENT_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Błąd usuwania pomiaru');
};

export const getMeasurementStatus = async () => {
  const res = await fetch(`${MEASUREMENT_URL}/status`, { credentials: 'include' });
  if (!res.ok) throw new Error('Błąd sprawdzania statusu pomiarów');
  return await res.json();
};
