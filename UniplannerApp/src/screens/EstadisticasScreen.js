/**
 * EstadisticasScreen.js - Pantalla de Estadísticas Detalladas
 * Muestra gráficos y métricas de rendimiento del estudiante
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import AppBackground from '../components/AppBackground';
import ModernDialog from './ModernDialog';
import { colors, fonts, radii, shadows } from '../theme/tokens';

const { width } = Dimensions.get('window');

export default function EstadisticasScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'error',
    onConfirm: null,
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    closeText: 'Entendido',
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const showDialog = ({
    title,
    message,
    type = 'info',
    onConfirm = null,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    closeText = 'Entendido',
  }) => {
    setDialogConfig({
      title,
      message,
      type,
      onConfirm,
      confirmText,
      cancelText,
      closeText,
    });
    setDialogVisible(true);
  };

  const resolveErrorMessage = (error, fallback) => {
    if (error?.response?.status === 404) {
      return 'El servicio no esta disponible. Verifica que el backend este activo.';
    }
    return error.userMessage || fallback;
  };

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/estadisticas/detalladas');
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      showDialog({
        title: 'No pudimos cargar las estadisticas',
        message: resolveErrorMessage(
          error,
          'Verifica tu conexion y vuelve a intentar.'
        ),
        type: 'error',
        onConfirm: cargarEstadisticas,
        confirmText: 'Reintentar',
        cancelText: 'Cerrar',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarEstadisticas();
    setRefreshing(false);
  };

  const renderBarChart = (data, maxValue) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>Sin datos para mostrar</Text>
        </View>
      );
    }

    const safeMax = maxValue > 0 ? maxValue : 1;

    return (
      <View style={styles.chartContainer}>
        {Object.entries(data).map(([label, value]) => {
          const percentage = (value / safeMax) * 100;
          return (
            <View key={label} style={styles.barRow}>
              <Text style={styles.barLabel} numberOfLines={1}>
                {label.length > 20 ? label.substring(0, 20) + '...' : label}
              </Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.barFill, 
                    { width: `${percentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.barValue}>{value.toFixed(1)}h</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderPieChart = (data) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>Sin datos para mostrar</Text>
        </View>
      );
    }

    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    const chartColors = [colors.primary, colors.accent, colors.success, colors.danger, colors.info];

    if (!total) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>Sin datos para mostrar</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.pieContainer}>
        {Object.entries(data).map(([label, value], index) => {
          const percentage = ((value / total) * 100).toFixed(1);
          return (
            <View key={label} style={styles.pieRow}>
              <View style={[styles.pieColor, { backgroundColor: chartColors[index % chartColors.length] }]} />
              <Text style={styles.pieLabel}>{label}</Text>
              <Text style={styles.pieValue}>{percentage}%</Text>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AppBackground />
        <ModernDialog
          visible={dialogVisible}
          onClose={() => setDialogVisible(false)}
          title={dialogConfig.title}
          message={dialogConfig.message}
          type={dialogConfig.type}
          onConfirm={dialogConfig.onConfirm}
          confirmText={dialogConfig.confirmText}
          cancelText={dialogConfig.cancelText}
          closeText={dialogConfig.closeText}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!estadisticas) {
    return (
      <View style={styles.loadingContainer}>
        <AppBackground />
        <ModernDialog
          visible={dialogVisible}
          onClose={() => setDialogVisible(false)}
          title={dialogConfig.title}
          message={dialogConfig.message}
          type={dialogConfig.type}
          onConfirm={dialogConfig.onConfirm}
          confirmText={dialogConfig.confirmText}
          cancelText={dialogConfig.cancelText}
          closeText={dialogConfig.closeText}
        />
        <Text>No hay datos disponibles</Text>
      </View>
    );
  }

  const porMateria = estadisticas.distribucion_tiempo?.por_materia || {};
  const porTipo = estadisticas.distribucion_tiempo?.por_tipo || {};
  const maxHoras = Math.max(1, ...Object.values(porMateria));

  return (
    <View style={styles.container}>
      <AppBackground />
      <ModernDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        onConfirm={dialogConfig.onConfirm}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        closeText={dialogConfig.closeText}
      />
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      {/* Resumen General */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Resumen General</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.glowSky }]}>
            <Ionicons name="checkmark-done-circle" size={32} color={colors.primary} />
            <Text style={styles.statNumber}>{estadisticas.rendimiento.tasa_completado}%</Text>
            <Text style={styles.statLabel}>Completado</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.glowTeal }]}>
            <Ionicons name="school" size={32} color={colors.success} />
            <Text style={styles.statNumber}>{estadisticas.creditos.porcentaje_carrera}%</Text>
            <Text style={styles.statLabel}>Carrera</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="time" size={32} color={colors.warning} />
            <Text style={styles.statNumber}>{estadisticas.rendimiento.horas_pendientes}</Text>
            <Text style={styles.statLabel}>Horas Pendientes</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.glowPeach }]}>
            <Ionicons name="flame" size={32} color={colors.accent} />
            <Text style={styles.statNumber}>{estadisticas.rendimiento.racha_dias}</Text>
            <Text style={styles.statLabel}>Días Racha</Text>
          </View>
        </View>
      </View>

      {/* Rendimiento */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Rendimiento</Text>
        
        <View style={styles.card}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Tareas Completadas</Text>
            <Text style={styles.metricValue}>{estadisticas.rendimiento.completadas}</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Tareas Pendientes</Text>
            <Text style={styles.metricValue}>{estadisticas.rendimiento.pendientes}</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Dificultad Promedio</Text>
            <View style={styles.difficultyStars}>
              {[1, 2, 3, 4, 5].map(star => (
                <Ionicons
                  key={star}
                  name={star <= estadisticas.rendimiento.dificultad_promedio ? "star" : "star-outline"}
                  size={16}
                  color={colors.warning}
                />
              ))}
              <Text style={styles.metricValue}>
                {estadisticas.rendimiento.dificultad_promedio.toFixed(1)}/5
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Distribución por Materia */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Carga por Materia (Top 5)</Text>
        {renderBarChart(porMateria, maxHoras)}
      </View>

      {/* Distribución por Tipo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Distribución por Tipo</Text>
        {renderPieChart(porTipo)}
      </View>

      {/* Créditos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎓 Progreso de Créditos</Text>
        
        <View style={styles.card}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Créditos Aprobados</Text>
            <Text style={styles.progressValue}>
              {estadisticas.creditos.aprobados} / 162
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${estadisticas.creditos.porcentaje_carrera}%` }
              ]} 
            />
          </View>
          
          <Text style={styles.progressPercentage}>
            {estadisticas.creditos.porcentaje_carrera}% de la carrera
          </Text>

          <View style={[styles.progressRow, { marginTop: 16 }]}>
            <Text style={styles.progressLabel}>Créditos Actuales</Text>
            <Text style={styles.progressValue}>{estadisticas.creditos.actuales}</Text>
          </View>
        </View>
      </View>

      {/* Materias Críticas */}
      {estadisticas.rendimiento.materias_criticas.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Materias que Requieren Atención</Text>
          
          <View style={styles.card}>
            {estadisticas.rendimiento.materias_criticas.map((materia, index) => (
              <View key={index} style={styles.criticalItem}>
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <Text style={styles.criticalText}>{materia}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, position: 'relative' },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: fonts.semibold, color: colors.ink, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { 
    flex: 1, 
    minWidth: (width - 52) / 2,
    padding: 16, 
    borderRadius: radii.md, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  statNumber: { fontSize: 28, fontFamily: fonts.bold, color: colors.ink, marginTop: 8 },
  statLabel: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkMuted, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  metricRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricLabel: { fontSize: 14, fontFamily: fonts.medium, color: colors.inkMuted },
  metricValue: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink },
  difficultyStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  chartContainer: { gap: 12 },
  emptyChart: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyChartText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 140, fontSize: 12, fontFamily: fonts.medium, color: colors.inkMuted },
  barContainer: { 
    flex: 1, 
    height: 24, 
    backgroundColor: colors.border, 
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: { 
    height: '100%', 
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  barValue: { width: 45, fontSize: 12, fontFamily: fonts.semibold, color: colors.ink, textAlign: 'right' },
  pieContainer: { gap: 12 },
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pieColor: { width: 16, height: 16, borderRadius: 4 },
  pieLabel: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted },
  pieValue: { fontSize: 14, fontFamily: fonts.semibold, color: colors.ink },
  progressRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 14, fontFamily: fonts.medium, color: colors.inkMuted },
  progressValue: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink },
  progressBar: { 
    height: 12, 
    backgroundColor: colors.border, 
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  progressPercentage: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkMuted, textAlign: 'center' },
  criticalItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    paddingVertical: 8,
  },
  criticalText: { fontSize: 14, fontFamily: fonts.medium, color: colors.danger },
});
