import axios from "axios";

const API_URL = 'http://localhost:8000/api/ExerciseDb';
const RECORDS_URL = 'http://localhost:8000/api/records';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export async function getExerciseCategory() {
    const res = await fetch(`${API_URL}/exercise/categories`, { credentials: 'include' });
    if (!res.ok) throw new Error('Błąd pobierania kategorii ćwiczeń');
    return await res.json();
}

export async function getExercisesByBodyPart(bodyPart) {
  const res = await fetch(`${API_URL}/exercise/${encodeURIComponent(bodyPart)}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Błąd pobierania ćwiczeń dla: ${bodyPart}`);
  return await res.json();
}

export async function searchExercises(term, offset = 0, limit = 50) {
  const params = new URLSearchParams({ term, offset: String(offset), limit: String(limit) });
  const res = await fetch(`${API_URL}/exercise/search/${encodeURIComponent(term)}?${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Błąd wyszukiwania ćwiczeń');
  return await res.json();
}
export const addUserExercise = async (exerciseData) => {
  const response = await apiClient.post('/userexercise/add', exerciseData);
  return response.data;
};

export const getExercisesByDate = async (date) => {
  const response = await apiClient.get(`/userexercise/bydate?date=${date}`);
  return response.data;
};

export const deleteUserExercise = async (userExerciseId) => {
  await apiClient.delete(`/userexercise/${userExerciseId}`);
};

export const getRecordsByExercise = async (exerciseId) => {
  const res = await fetch(`${RECORDS_URL}/exercise/${exerciseId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Błąd pobierania rekordów');
  return await res.json();
};

export async function getExerciseProgress(exerciseId, startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const query = params.toString();
  const res = await fetch(
    `${RECORDS_URL}/exercise/${exerciseId}/progress${query ? `?${query}` : ''}`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error('Blad pobierania progresji cwiczenia');
  return await res.json();
}

export async function getTrainingOverview(startDate, endDate, timeZone) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (timeZone) params.append('timeZone', timeZone);

  const query = params.toString();
  const res = await fetch(
    `${RECORDS_URL}/overview${query ? `?${query}` : ''}`,
    { credentials: 'include' }
  );
  if (!res.ok) throw new Error('Blad pobierania globalnej analityki');
  return await res.json();
}
