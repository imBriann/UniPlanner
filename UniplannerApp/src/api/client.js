/**
 * Cliente HTTP configurado con Axios
 * Maneja automáticamente tokens JWT y errores
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// IMPORTANTE: Cambia esta URL según tu entorno
// Para emulador Android: http://10.0.2.2:5000/api
// Para emulador iOS: http://localhost:5000/api
// Para dispositivo físico: http://TU_IP_LOCAL:5000/api (ejemplo: http://192.168.1.10:5000/api)
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.0.8:5000'  // Cambiar según tu caso
  : 'https://tu-api-produccion.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error obteniendo token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globalmente
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      try {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
      } catch (e) {
        console.error('Error limpiando sesión:', e);
      }
    }
    
    // Mejorar mensaje de error
    const errorMessage = error.response?.data?.error || 
                        error.message || 
                        'Error de conexión';
    
    return Promise.reject({
      ...error,
      userMessage: errorMessage
    });
  }
);

export default apiClient;
export { API_BASE_URL };