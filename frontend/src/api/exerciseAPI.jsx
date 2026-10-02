import axios from "axios";

const API_URL = 'http://localhost:8000/api/ExerciseDb';

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
  const res = await fetch(`/api/records/exercise/${exerciseId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Błąd pobierania rekordów');
  return await res.json();
};

export const searchExercises = async (query) => {
  const res = await fetch(`/api/records/search?query=${encodeURIComponent(query)}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Błąd wyszukiwania');
  return await res.json();
};
