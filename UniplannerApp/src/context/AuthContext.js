import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginUser, registerUser } from '../api/client'; // Importamos las funciones de la API

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Cargar sesión guardada al iniciar la app
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await SecureStore.getItemAsync('user_token');
        // Aquí podrías guardar también los datos del usuario en un string JSON
        const userData = await SecureStore.getItemAsync('user_data');
        
        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.error("Error cargando sesión:", e);
      } finally {
        setLoading(false);
      }
    };
    loadStorageData();
  }, []);

  // 2. Función LOGIN (Con el nombre exacto que espera tu pantalla)
  const login = async (email, password) => {
    const result = await loginUser(email, password);

    if (result.status === 200 && result.data.success) {
      const userData = result.data.usuario;
      const token = result.data.token;
      
      setUser(userData);
      
      // Guardar en el celular para persistencia
      await SecureStore.setItemAsync('user_token', token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
      
      return { success: true }; // Retornamos éxito
    } else {
      return { 
        success: false, 
        error: result.data?.error || 'Credenciales incorrectas' 
      };
    }
  };

  // 3. Función REGISTER
  const register = async (userData) => {
    const result = await registerUser(userData);
    
    if (result.status === 201 && result.data.success) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: result.data?.error || 'Error en el registro' 
      };
    }
  };

  // 4. Función LOGOUT
  const logout = async () => {
    setUser(null);
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_data');
  };

  // Exportamos todo en el objeto value
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login,    // <--- ¡AQUÍ ESTÁ LA CLAVE! Ahora sí existe 'login'
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};