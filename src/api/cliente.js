import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function guardarToken(token) {
  await SecureStore.setItemAsync('token', token);
}

export async function borrarToken() {
  await SecureStore.deleteItemAsync('token');
}

export async function api(ruta, { method = 'GET', body } = {}) {
  const token = await SecureStore.getItemAsync('token');

  const res = await fetch(`${API_URL}${ruta}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `Error ${res.status}`);
  }
  return data;
}