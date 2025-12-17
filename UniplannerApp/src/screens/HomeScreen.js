/**
 * HomeScreen.js - MEJORADO con Notificaciones y Features Avanzadas
 * Pantalla principal con acceso rápido a todas las funcionalidades
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import NotificacionBadge from '../components/NotificacionBadge';
import AppBackground from '../components/AppBackground';
import ModernDialog from './ModernDialog';
import { colors, fonts, radii, shadows } from '../theme/tokens';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [tareasUrgentes, setTareasUrgentes] = useState([]);
  const [notificacionesCount, setNotificacionesCount] = useState(0);
  const [cargaSemanal, setCargaSemanal] = useState(null);
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
    cargarDatos();
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

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar múltiples endpoints en paralelo
      const [recResponse, statsResponse, urgentesResponse, notifResponse, cargaResponse] = await Promise.all([
        api.get('/recomendaciones?limite=5'),
        api.get('/estadisticas'),
        api.get('/recomendaciones/tareas-urgentes?dias=3'),
        api.get('/notificaciones/no-leidas/contar'),
        api.get('/recomendaciones/carga-semanal'),
      ]);

      setRecomendaciones(recResponse.data.recomendaciones || []);
      setEstadisticas(statsResponse.data.estadisticas);
      setTareasUrgentes(urgentesResponse.data.tareas_urgentes || []);
      setNotificacionesCount(notifResponse.data.no_leidas || 0);
      setCargaSemanal(cargaResponse.data);

    } catch (error) {
      console.error('Error cargando datos:', error);
      showDialog({
        title: 'No pudimos cargar el inicio',
        message: resolveErrorMessage(
          error,
          'Verifica tu conexion y vuelve a intentar.'
        ),
        type: 'error',
        onConfirm: cargarDatos,
        confirmText: 'Reintentar',
        cancelText: 'Cerrar',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const getDificultadColor = (dificultad) => {
    if (dificultad >= 4) return colors.danger;
    if (dificultad >= 3) return colors.warning;
    return colors.success;
  };

  const getDiasColor = (dias) => {
    if (dias <= 1) return colors.danger;
    if (dias <= 3) return colors.warning;
    return colors.success;
  };

  const getCargaColor = () => {
    if (!cargaSemanal) return colors.success;
    if (cargaSemanal.total_horas > 30) return colors.danger;
    if (cargaSemanal.total_horas > 15) return colors.warning;
    return colors.success;
  };

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return '¡Buenos días';
    if (hora < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AppBackground />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando recomendaciones...</Text>
      </View>
    );
  }

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Header Mejorado */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getSaludo()}, {user?.nombre}! 👋</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('es', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notificaciones')}
        >
          <Ionicons name="notifications-outline" size={28} color={colors.ink} />
          <NotificacionBadge />
        </TouchableOpacity>
      </View>

      {/* Alerta de Carga Alta */}
      {cargaSemanal && cargaSemanal.total_horas > 30 && (
        <View style={styles.alertaBanner}>
          <Ionicons name="warning" size={24} color={colors.warning} />
          <View style={styles.alertaContent}>
            <Text style={styles.alertaTitulo}>⚠️ Carga Alta Detectada</Text>
            <Text style={styles.alertaTexto}>
              Tienes {cargaSemanal.total_horas}h de trabajo pendiente. 
              Considera reorganizar tu tiempo.
            </Text>
          </View>
        </View>
      )}

      {/* Tarjetas de Estadísticas Mejoradas */}
      {estadisticas && (
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.glowSky }]}
            onPress={() => navigation.navigate('Tareas')}
            activeOpacity={0.7}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="checkbox-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.statNumber}>{estadisticas.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
            <View style={styles.statTrend}>
              <Ionicons name="arrow-up" size={12} color={colors.primary} />
              <Text style={styles.statTrendText}>Prioridad</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.glowTeal }]}
            onPress={() => navigation.navigate('Tareas')}
            activeOpacity={0.7}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-done" size={28} color={colors.success} />
            </View>
            <Text style={styles.statNumber}>{estadisticas.completadas}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
            <View style={styles.statTrend}>
              <Ionicons name="trophy" size={12} color={colors.success} />
              <Text style={styles.statTrendText}>¡Bien!</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: colors.accentSoft }]}
            onPress={() => navigation.navigate('PlanEstudio')}
            activeOpacity={0.7}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="time-outline" size={28} color={colors.warning} />
            </View>
            <Text style={styles.statNumber}>{estadisticas.horas_pendientes}h</Text>
            <Text style={styles.statLabel}>Por hacer</Text>
            <View style={[styles.statTrend, { backgroundColor: getCargaColor() + '20' }]}>
              <Ionicons name="pulse" size={12} color={getCargaColor()} />
              <Text style={[styles.statTrendText, { color: getCargaColor() }]}>
                {cargaSemanal?.recomendacion?.split(' ')[1] || 'Normal'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Tareas Urgentes con diseño mejorado */}
      {tareasUrgentes.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="alert-circle" size={24} color={colors.danger} />
              <Text style={styles.sectionTitle}>Tareas Urgentes</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Tareas')}>
              <Text style={styles.verTodas}>Ver todas →</Text>
            </TouchableOpacity>
          </View>
          
          {tareasUrgentes.slice(0, 3).map((tarea) => (
            <TouchableOpacity
              key={tarea.id}
              style={styles.tareaUrgente}
              onPress={() => navigation.navigate('Tareas')}
              activeOpacity={0.7}
            >
              <View style={[styles.tareaIndicador, { backgroundColor: colors.danger }]} />
              <View style={styles.tareaContent}>
                <View style={styles.tareaHeader}>
                  <Text style={styles.tareaTitle} numberOfLines={1}>{tarea.titulo}</Text>
                  <View style={[styles.diasBadge, { backgroundColor: `${colors.danger}18` }]}>
                    <Ionicons name="calendar" size={12} color={colors.danger} />
                    <Text style={[styles.diasText, { color: colors.danger }]}>
                      {tarea.dias_restantes === 0 ? '¡Hoy!' : `${tarea.dias_restantes}d`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.tareaCurso}>{tarea.curso}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recomendaciones del día mejoradas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="bulb" size={24} color={colors.warning} />
            <Text style={styles.sectionTitle}>Recomendaciones Inteligentes</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('PlanEstudio')}>
            <Text style={styles.verTodas}>Plan completo →</Text>
          </TouchableOpacity>
        </View>
        
        {recomendaciones.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
            <Text style={styles.emptyText}>¡Todo al día!</Text>
            <Text style={styles.emptySubtext}>No tienes tareas pendientes por ahora</Text>
          </View>
        ) : (
          recomendaciones.map((tarea, index) => (
            <TouchableOpacity
              key={tarea.id}
              style={styles.recomendacionCard}
              onPress={() => navigation.navigate('Tareas')}
              activeOpacity={0.7}
            >
              <View style={styles.recomendacionHeader}>
                <View style={[
                  styles.recomendacionNumber,
                  index === 0 && { backgroundColor: colors.primary },
                  index === 1 && { backgroundColor: colors.info },
                  index === 2 && { backgroundColor: colors.accent },
                ]}>
                  <Text style={styles.recomendacionNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.recomendacionContent}>
                  <View style={styles.recomendacionTitleRow}>
                    <Text style={styles.recomendacionTitle} numberOfLines={1}>
                      {tarea.titulo}
                    </Text>
                    {index === 0 && (
                      <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>TOP</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.recomendacionCurso}>{tarea.curso}</Text>
                </View>
              </View>
              
              <View style={styles.recomendacionFooter}>
                <View style={styles.recomendacionTag}>
                  <Ionicons name="time-outline" size={14} color={colors.inkMuted} />
                  <Text style={styles.recomendacionTagText}>{tarea.horas_estimadas}h</Text>
                </View>
                
                <View style={[styles.recomendacionTag, { backgroundColor: getDificultadColor(tarea.dificultad) + '20' }]}>
                  <Ionicons name="flame-outline" size={14} color={getDificultadColor(tarea.dificultad)} />
                  <Text style={[styles.recomendacionTagText, { color: getDificultadColor(tarea.dificultad) }]}>
                    Dif. {tarea.dificultad}/5
                  </Text>
                </View>
                
                <View style={[styles.recomendacionTag, { backgroundColor: getDiasColor(tarea.dias_restantes) + '20' }]}>
                  <Ionicons name="calendar-outline" size={14} color={getDiasColor(tarea.dias_restantes)} />
                  <Text style={[styles.recomendacionTagText, { color: getDiasColor(tarea.dias_restantes) }]}>
                    {tarea.dias_restantes}d
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Accesos rápidos renovados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.glowSky }]}
            onPress={() => navigation.navigate('Tareas')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="add-circle" size={32} color="white" />
            </View>
            <Text style={styles.quickActionText}>Nueva Tarea</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.accentSoft }]}
            onPress={() => navigation.navigate('PlanEstudio')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name="calendar" size={32} color="white" />
            </View>
            <Text style={styles.quickActionText}>Plan de Estudio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.glowTeal }]}
            onPress={() => navigation.navigate('Estadisticas')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.success }]}>
              <Ionicons name="stats-chart" size={32} color="white" />
            </View>
            <Text style={styles.quickActionText}>Estadísticas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.glowPeach }]}
            onPress={() => navigation.navigate('Logros')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.warning }]}>
              <Ionicons name="trophy" size={32} color="white" />
            </View>
            <Text style={styles.quickActionText}>Logros</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner motivacional */}
      <View style={styles.motivoBanner}>
        <Ionicons name="flame" size={32} color={colors.warning} />
        <View style={styles.motivoContent}>
          <Text style={styles.motivoTitulo}>¡Sigue así!</Text>
          <Text style={styles.motivoTexto}>
            Has completado {estadisticas?.completadas || 0} tareas este semestre. 
            {estadisticas?.pendientes > 0 
              ? ` Tienes ${estadisticas.pendientes} pendientes.`
              : ' ¡Estás al día!'
            }
          </Text>
        </View>
      </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, position: 'relative' },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, position: 'relative' },
  loadingText: { marginTop: 12, color: colors.inkMuted, fontSize: 14, fontFamily: fonts.medium },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    padding: 20, 
    paddingTop: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 24, fontFamily: fonts.bold, color: colors.ink },
  subtitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.inkMuted, marginTop: 4 },
  notificationButton: { 
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  alertaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: radii.md,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  alertaContent: { flex: 1 },
  alertaTitulo: { fontSize: 14, fontFamily: fonts.semibold, color: colors.ink, marginBottom: 4 },
  alertaTexto: { fontSize: 12, fontFamily: fonts.regular, color: colors.inkMuted, lineHeight: 16 },

  statsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    marginTop: 20,
    marginBottom: 12,
    gap: 12,
  },
  statCard: { 
    flex: 1, 
    padding: 16, 
    borderRadius: radii.md, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  statIconContainer: { marginBottom: 8 },
  statNumber: { fontSize: 28, fontFamily: fonts.bold, color: colors.ink, marginTop: 4 },
  statLabel: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkMuted, marginTop: 4 },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statTrendText: { fontSize: 10, fontFamily: fonts.semibold, color: colors.primary },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontFamily: fonts.semibold, color: colors.ink },
  verTodas: { fontSize: 14, fontFamily: fonts.semibold, color: colors.primary },

  tareaUrgente: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  tareaIndicador: { width: 4, borderRadius: 2, marginRight: 12 },
  tareaContent: { flex: 1 },
  tareaHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tareaTitle: { flex: 1, fontSize: 16, fontFamily: fonts.semibold, color: colors.ink, marginRight: 8 },
  diasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diasText: { fontSize: 12, fontFamily: fonts.semibold },
  tareaCurso: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted },

  recomendacionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  recomendacionHeader: { flexDirection: 'row', marginBottom: 12 },
  recomendacionNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.inkMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recomendacionNumberText: { color: colors.surface, fontFamily: fonts.bold, fontSize: 16 },
  recomendacionContent: { flex: 1 },
  recomendacionTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recomendacionTitle: { flex: 1, fontSize: 16, fontFamily: fonts.semibold, color: colors.ink },
  priorityBadge: {
    backgroundColor: `${colors.danger}14`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: { fontSize: 10, fontFamily: fonts.semibold, color: colors.danger },
  recomendacionCurso: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted },
  recomendacionFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recomendacionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.chip,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  recomendacionTagText: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkMuted },

  quickActions: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: { 
    width: (width - 52) / 2,
    alignItems: 'center',
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  quickActionIcon: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12,
    ...shadows.card,
  },
  quickActionText: { fontSize: 13, fontFamily: fonts.semibold, color: colors.ink, textAlign: 'center' },

  motivoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: radii.md,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    ...shadows.card,
  },
  motivoContent: { flex: 1 },
  motivoTitulo: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink, marginBottom: 4 },
  motivoTexto: { fontSize: 13, fontFamily: fonts.regular, color: colors.inkMuted, lineHeight: 18 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 20, fontFamily: fonts.bold, color: colors.ink, marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted, marginTop: 8, textAlign: 'center' },
});
