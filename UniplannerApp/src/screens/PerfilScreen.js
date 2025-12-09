/**
 * PerfilScreen.js - CORREGIDO ✅
 * - Botón de logout con área clickeable completa (TouchableOpacity)
 * - Mejor UX de interacción
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const response = await api.get('/usuario/perfil');
      setPerfil(response.data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarPerfil();
    setRefreshing(false);
  };

  // 🆕 FUNCIÓN MEJORADA DE LOGOUT
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { 
          text: 'Cancelar', 
          style: 'cancel' 
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error cerrando sesión:', error);
            }
          },
        },
      ]
    );
  };

  const getTipoEstudioInfo = (tipo) => {
    const info = {
      intensivo: {
        color: '#EF4444',
        icon: 'flame',
        descripcion: '6+ horas diarias',
        bgColor: '#FEE2E2',
      },
      moderado: {
        color: '#F59E0B',
        icon: 'sunny',
        descripcion: '4 horas diarias',
        bgColor: '#FEF3C7',
      },
      leve: {
        color: '#10B981',
        icon: 'leaf',
        descripcion: '2-3 horas diarias',
        bgColor: '#D1FAE5',
      },
    };
    return info[tipo] || info.moderado;
  };

  const getProgresoCarrera = () => {
    if (!perfil?.estadisticas) return 0;
    const total = 170;
    const aprobados = perfil.estadisticas.creditos_aprobados || 0;
    return Math.round((aprobados / total) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const tipoEstudioInfo = getTipoEstudioInfo(perfil?.usuario?.tipo_estudio);
  const progresoCarrera = getProgresoCarrera();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header con Avatar */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="white" />
          </View>
          <View style={[styles.tipoEstudioBadge, { backgroundColor: tipoEstudioInfo.bgColor }]}>
            <Ionicons name={tipoEstudioInfo.icon} size={16} color={tipoEstudioInfo.color} />
          </View>
        </View>

        <Text style={styles.nombre}>{perfil?.usuario?.nombre_completo}</Text>
        <Text style={styles.email}>{perfil?.usuario?.email}</Text>

        <View style={[styles.tipoBadge, { backgroundColor: tipoEstudioInfo.bgColor }]}>
          <Text style={[styles.tipoBadgeText, { color: tipoEstudioInfo.color }]}>
            Modo {perfil?.usuario?.tipo_estudio}
          </Text>
        </View>
      </View>

      {/* Información Académica */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Académica</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="school-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Carrera</Text>
              <Text style={styles.infoValue}>{perfil?.usuario?.carrera}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Semestre Actual</Text>
              <Text style={styles.infoValue}>{perfil?.usuario?.semestre_actual}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="time-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Intensidad de Estudio</Text>
              <Text style={styles.infoValue}>
                {perfil?.usuario?.tipo_estudio} • {tipoEstudioInfo.descripcion}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progreso de Carrera */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progreso de Carrera</Text>

        <View style={styles.progresoCard}>
          <View style={styles.progresoHeader}>
            <Text style={styles.progresoTitulo}>Créditos Completados</Text>
            <Text style={styles.progresoNumero}>
              {perfil?.estadisticas?.creditos_aprobados || 0} / 170
            </Text>
          </View>

          <View style={styles.progresoBarContainer}>
            <View style={styles.progresoBar}>
              <View style={[styles.progresoFill, { width: `${progresoCarrera}%` }]} />
            </View>
            <Text style={styles.progresoPorcentaje}>{progresoCarrera}%</Text>
          </View>

          <View style={styles.progresoStats}>
            <View style={styles.progresoStat}>
              <Text style={styles.progresoStatNumero}>
                {perfil?.estadisticas?.materias_aprobadas || 0}
              </Text>
              <Text style={styles.progresoStatLabel}>Aprobadas</Text>
            </View>

            <View style={styles.progresoStatDivider} />

            <View style={styles.progresoStat}>
              <Text style={styles.progresoStatNumero}>
                {perfil?.estadisticas?.materias_actuales || 0}
              </Text>
              <Text style={styles.progresoStatLabel}>Cursando</Text>
            </View>

            <View style={styles.progresoStatDivider} />

            <View style={styles.progresoStat}>
              <Text style={styles.progresoStatNumero}>
                {perfil?.estadisticas?.creditos_actuales || 0}
              </Text>
              <Text style={styles.progresoStatLabel}>Créd. actuales</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Estadísticas de Tareas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desempeño</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="list-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.statNumber}>{perfil?.estadisticas?.total_tareas || 0}</Text>
            <Text style={styles.statLabel}>Total de tareas</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="hourglass-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statNumber}>{perfil?.estadisticas?.pendientes || 0}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-done" size={24} color="#10B981" />
            </View>
            <Text style={styles.statNumber}>{perfil?.estadisticas?.completadas || 0}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statNumber}>
              {perfil?.estadisticas?.horas_pendientes?.toFixed(1) || 0}h
            </Text>
            <Text style={styles.statLabel}>Horas restantes</Text>
          </View>
        </View>

        {perfil?.estadisticas?.total_tareas > 0 && (
          <View style={styles.completadoCard}>
            <View style={styles.completadoHeader}>
              <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
              <Text style={styles.completadoTitulo}>Porcentaje de Completado</Text>
            </View>
            <View style={styles.completadoBarContainer}>
              <View style={styles.completadoBar}>
                <View
                  style={[
                    styles.completadoFill,
                    { width: `${perfil.estadisticas.porcentaje_completado}%` }
                  ]}
                />
              </View>
              <Text style={styles.completadoPorcentaje}>
                {perfil.estadisticas.porcentaje_completado.toFixed(0)}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Configuración de Estudio */}
      {perfil?.configuracion_estudio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Estudio</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="time-outline" size={20} color="#4F46E5" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Horas Diarias</Text>
                <Text style={styles.infoValue}>
                  {perfil.configuracion_estudio.horas_diarias}h por día
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Días de Estudio</Text>
                <Text style={styles.infoValue}>
                  {perfil.configuracion_estudio.dias_semana.length} días por semana
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="alarm-outline" size={20} color="#4F46E5" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Horario Preferido</Text>
                <Text style={styles.infoValue}>
                  {perfil.configuracion_estudio.hora_inicio} - {perfil.configuracion_estudio.hora_fin}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 🆕 BOTÓN DE CERRAR SESIÓN MEJORADO */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  header: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  tipoEstudioBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'white' },
  nombre: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  tipoBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  tipoBadgeText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  infoCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  infoIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  progresoCard: { backgroundColor: 'white', borderRadius: 12, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  progresoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progresoTitulo: { fontSize: 15, fontWeight: '600', color: '#374151' },
  progresoNumero: { fontSize: 15, fontWeight: 'bold', color: '#4F46E5' },
  progresoBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  progresoBar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progresoFill: { height: '100%', backgroundColor: '#4F46E5' },
  progresoPorcentaje: { fontSize: 14, fontWeight: 'bold', color: '#4F46E5', width: 45 },
  progresoStats: { flexDirection: 'row', justifyContent: 'space-around' },
  progresoStat: { alignItems: 'center' },
  progresoStatNumero: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  progresoStatLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  progresoStatDivider: { width: 1, backgroundColor: '#E5E7EB' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: 'white', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  completadoCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  completadoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  completadoTitulo: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  completadoBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  completadoBar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  completadoFill: { height: '100%', backgroundColor: '#F59E0B' },
  completadoPorcentaje: { fontSize: 16, fontWeight: 'bold', color: '#F59E0B', width: 45 },
  
  // 🆕 BOTÓN DE LOGOUT CORREGIDO
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});