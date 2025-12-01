import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ CAMBIA ESTO POR TU IP LOCAL (No uses localhost)
const API_URL = 'http://192.168.0.8:5000/api'; 

// Crear instancia de Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 segundos de espera máxima
});

// Función para Login
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return { status: response.status, data: response.data };
  } catch (error) {
    console.error("Error login:", error);
    // Axios maneja los errores diferente a fetch
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, error: 'Error de conexión con el servidor' };
  }
};

// Función para Registro
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/registro', userData);
    return { status: response.status, data: response.data };
  } catch (error) {
    console.error("Error registro:", error);
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, error: 'Error de conexión con el servidor' };
  }
};

export const saveToken = async (token) => {
  await SecureStore.setItemAsync('user_token', token);
};

export default api;