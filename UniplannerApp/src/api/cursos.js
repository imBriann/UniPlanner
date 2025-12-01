/**
 * API de Cursos y Materias
 * Gestión del pensum y materias del estudiante
 */

import apiClient from './client';

export const cursosAPI = {
  /**
   * Obtiene las materias actuales del usuario
   */
  obtenerMateriasActuales: async () => {
    try {
      const response = await apiClient.get('/usuario/materias/actuales');
      return response.data.materias;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene las materias aprobadas del usuario
   */
  obtenerMateriasAprobadas: async () => {
    try {
      const response = await apiClient.get('/usuario/materias/aprobadas');
      return response.data.materias;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene todos los cursos o por semestre
   */
  obtenerCursos: async (semestre = null) => {
    try {
      const params = semestre ? { semestre } : {};
      const response = await apiClient.get('/cursos', { params });
      return response.data.cursos;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene un curso específico por código
   */
  obtenerCurso: async (codigo) => {
    try {
      const response = await apiClient.get(`/cursos/${codigo}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Busca cursos por nombre o código
   */
  buscarCursos: async (termino) => {
    try {
      const response = await apiClient.get('/cursos/buscar', {
        params: { q: termino }
      });
      return response.data.resultados;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Inscribe una materia
   */
  inscribirMateria: async (codigoMateria) => {
    try {
      const response = await apiClient.post('/usuario/materias/inscribir', {
        codigo_materia: codigoMateria
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cancela una materia
   */
  cancelarMateria: async (codigoMateria) => {
    try {
      const response = await apiClient.post('/usuario/materias/cancelar', {
        codigo_materia: codigoMateria
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};