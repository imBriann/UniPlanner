import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

//const API_URL = 'https://uniplanner-api.onrender.com/api/'; 
const API_URL = 'http://192.168.0.8:5000/api/'; // URL para desarrollo local


// Crear instancia de Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de espera máxima
});

// Interceptor de peticiones: Agregar token automáticamente
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
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

// Interceptor de respuestas: Manejo global de errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      const { status, data } = error.response;
      
      if (status === 401) {
        // Token expirado o inválido
        console.log('Token inválido, redirigiendo al login...');
        await SecureStore.deleteItemAsync('user_token');
        await SecureStore.deleteItemAsync('user_data');
        // El AuthContext detectará que user_token ya no existe y mostrará el Login
      }
      
      // Agregar el error original al objeto error para que sea accesible
      error.userMessage = data?.error || 'Error en la solicitud';
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      error.userMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else {
      // Algo más causó el error
      error.userMessage = 'Ocurrió un error inesperado';
    }
    
    return Promise.reject(error);
  }
);

// Función para Login
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return { status: response.status, data: response.data };
  } catch (error) {
    console.error("Error login:", error);
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

// Función para guardar token
export const saveToken = async (token) => {
  try {
    await SecureStore.setItemAsync('user_token', token);
  } catch (error) {
    console.error('Error guardando token:', error);
  }
};

// Función para obtener token
export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync('user_token');
  } catch (error) {
    console.error('Error obteniendo token:', error);
    return null;
  }
};

// Función para limpiar token
export const clearToken = async () => {
  try {
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_data');
  } catch (error) {
    console.error('Error limpiando token:', error);
  }
};

export default api;