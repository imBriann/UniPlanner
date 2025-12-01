/**
 * Context de Autenticación
 * Maneja el estado global de la sesión del usuario
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Verifica si hay sesión guardada al iniciar
   */
  const checkAuth = async () => {
    try {
      const isAuth = await authAPI.isAuthenticated();
      if (isAuth) {
        const userData = await authAPI.getUserData();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Inicia sesión
   */
  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      setUser(data.usuario);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Registra nuevo usuario
   */
  const registro = async (userData) => {
    try {
      const data = await authAPI.registro(userData);
      setUser(data.usuario);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Cierra sesión
   */
  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      throw error;
    }
  };

  /**
   * Actualiza datos del usuario en el contexto
   */
  const updateUser = (newUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...newUserData
    }));
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isAuthenticated: !!user,
        login, 
        registro, 
        logout,
        updateUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

export default AuthContext;