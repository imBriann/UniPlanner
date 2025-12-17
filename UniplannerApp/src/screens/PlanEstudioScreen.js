/**
 * PlanEstudioScreen.js - Plan de Estudio Inteligente
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import AppBackground from '../components/AppBackground';
import { colors, fonts, radii, shadows } from '../theme/tokens';

export default function PlanEstudioScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [planEstudio, setPlanEstudio] = useState([]);
  const [cargaSemanal, setCargaSemanal] = useState(null);
  const [modalConfig, setModalConfig] = useState(false);
  const [horasDiarias, setHorasDiarias] = useState(4);

  useEffect(() => {
    cargarPlan();
    cargarCargaSemanal();
  }, [horasDiarias]);

  const cargarPlan = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/recomendaciones/plan-estudio?horas_diarias=${horasDiarias}&dias=7`
      );
      setPlanEstudio(response.data.plan_estudio || []);
    } catch (error) {
      console.error('Error cargando plan:', error);
      Alert.alert('Error', 'No se pudo cargar el plan de estudio');
    } finally {
      setLoading(false);
    }
  };

  const cargarCargaSemanal = async () => {
    try {
      const response = await api.get('/recomendaciones/carga-semanal');
      setCargaSemanal(response.data);
    } catch (error) {
      console.error('Error cargando carga semanal:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([cargarPlan(), cargarCargaSemanal()]);
    setRefreshing(false);
  };

  const getDiaSemana = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fecha.getDay()];
  };

  const esHoy = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const renderDia = (dia, index) => {
    const hoy = esHoy(dia.fecha);
    const diaSemana = getDiaSemana(dia.fecha);
    const fecha = new Date(dia.fecha);

    return (
      <View key={index} style={[styles.diaCard, hoy && styles.diaCardHoy]}>
        <View style={styles.diaHeader}>
          <View>
            <View style={styles.diaHeaderRow}>
              <Text style={[styles.diaSemana, hoy && styles.textoHoy]}>
                {diaSemana}
              </Text>
              {hoy && (
                <View style={styles.hoyBadge}>
                  <Text style={styles.hoyText}>HOY</Text>
                </View>
              )}
            </View>
            <Text style={styles.diaFecha}>
              {fecha.getDate()} de {fecha.toLocaleDateString('es', { month: 'long' })}
            </Text>
          </View>
          
          <View style={styles.diaStats}>
            <Ionicons name="time-outline" size={16} color={colors.inkMuted} />
            <Text style={styles.diaHoras}>{dia.horas_totales.toFixed(1)}h</Text>
          </View>
        </View>

        <View style={styles.tareasList}>
          {dia.tareas.map((tarea, i) => (
            <View key={i} style={styles.tareaItem}>
              <View style={styles.tareaIndicador} />
              <View style={styles.tareaContent}>
                <Text style={styles.tareaTitulo} numberOfLines={2}>
                  {tarea.titulo}
                </Text>
                <Text style={styles.tareaCurso}>{tarea.curso.nombre}</Text>
                
                <View style={styles.tareaFooter}>
                  <View style={styles.tareaTag}>
                    <Ionicons name="time-outline" size={12} color={colors.inkMuted} />
                    <Text style={styles.tareaTagText}>{tarea.horas_estimadas}h</Text>
                  </View>
                  
                  <View style={styles.tareaTag}>
                    <Ionicons name="flame-outline" size={12} color={colors.warning} />
                    <Text style={styles.tareaTagText}>Dif. {tarea.dificultad}/5</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AppBackground />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Generando tu plan de estudio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBackground />
      {/* Header con configuración */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          <View>
            <Text style={styles.headerTitulo}>Plan de Estudio</Text>
            <Text style={styles.headerSubtitulo}>
              {horasDiarias}h diarias • Modo {user?.tipo_estudio || 'Estándar'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.configButton}
          onPress={() => setModalConfig(true)}
        >
          <Ionicons name="settings-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Resumen Semanal */}
      {cargaSemanal && (
        <View style={styles.resumenCard}>
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Carga Total</Text>
            <Text style={[
              styles.resumenValor,
              { color: cargaSemanal.total_horas > 30 ? colors.danger : colors.success }
            ]}>
              {cargaSemanal.total_horas}h
            </Text>
          </View>
          
          <View style={styles.resumenBadges}>
            <View style={[
              styles.resumenBadge,
              { backgroundColor: 
                cargaSemanal.recomendacion === 'Carga alta' ? `${colors.danger}14` :
                cargaSemanal.recomendacion === 'Carga moderada' ? colors.accentSoft : colors.glowTeal
              }
            ]}>
              <Text style={[
                styles.resumenBadgeText,
                { color:
                  cargaSemanal.recomendacion === 'Carga alta' ? colors.danger :
                  cargaSemanal.recomendacion === 'Carga moderada' ? colors.warning : colors.success
                }
              ]}>
                {cargaSemanal.recomendacion}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Plan por días */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {planEstudio.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
            <Text style={styles.emptyText}>¡Todo al día!</Text>
            <Text style={styles.emptySubtext}>
              No hay tareas pendientes para planificar
            </Text>
          </View>
        ) : (
          planEstudio.map((dia, index) => renderDia(dia, index))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Modal de Configuración */}
      <Modal
        visible={modalConfig}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalConfig(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ Configuración del Plan</Text>
              <TouchableOpacity onPress={() => setModalConfig(false)}>
                <Ionicons name="close" size={28} color={colors.inkMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.configLabel}>Horas disponibles por día:</Text>
              
              <View style={styles.horasSelector}>
                {[2, 3, 4, 5, 6, 8].map(horas => (
                  <TouchableOpacity
                    key={horas}
                    style={[
                      styles.horaOption,
                      horasDiarias === horas && styles.horaOptionActiva
                    ]}
                    onPress={() => {
                      setHorasDiarias(horas);
                      setModalConfig(false);
                    }}
                  >
                    <Text style={[
                      styles.horaOptionText,
                      horasDiarias === horas && styles.horaOptionTextActiva
                    ]}>
                      {horas}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.configInfo}>
                <Ionicons name="information-circle-outline" size={20} color={colors.info} />
                <Text style={styles.configInfoText}>
                  El plan se ajustará automáticamente según las horas que elijas
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, position: 'relative' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 12, color: colors.inkMuted, fontSize: 14, fontFamily: fonts.medium },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitulo: { fontSize: 20, fontFamily: fonts.semibold, color: colors.ink },
  headerSubtitulo: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted, marginTop: 2 },
  configButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glowSky,
    justifyContent: 'center',
    alignItems: 'center',
  },

  resumenCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resumenLabel: { fontSize: 14, fontFamily: fonts.medium, color: colors.inkMuted },
  resumenValor: { fontSize: 24, fontFamily: fonts.bold },
  resumenBadges: { flexDirection: 'row', gap: 8, marginTop: 8 },
  resumenBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  resumenBadgeText: { fontSize: 12, fontFamily: fonts.semibold },

  scrollView: { flex: 1, paddingTop: 16 },
  diaCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  diaCardHoy: { borderWidth: 2, borderColor: colors.primary },
  diaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  diaHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diaSemana: { fontSize: 18, fontFamily: fonts.semibold, color: colors.ink },
  textoHoy: { color: colors.primary },
  hoyBadge: { backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  hoyText: { fontSize: 11, fontFamily: fonts.bold, color: colors.surface },
  diaFecha: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted, marginTop: 2 },
  diaStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  diaHoras: { fontSize: 16, fontFamily: fonts.semibold, color: colors.inkMuted },

  tareasList: { gap: 12 },
  tareaItem: { flexDirection: 'row', gap: 12 },
  tareaIndicador: { width: 4, backgroundColor: colors.primary, borderRadius: 2 },
  tareaContent: { flex: 1 },
  tareaTitulo: { fontSize: 15, fontFamily: fonts.semibold, color: colors.ink, marginBottom: 4 },
  tareaCurso: { fontSize: 13, fontFamily: fonts.regular, color: colors.inkMuted, marginBottom: 8 },
  tareaFooter: { flexDirection: 'row', gap: 8 },
  tareaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.chip,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tareaTagText: { fontSize: 11, fontFamily: fonts.medium, color: colors.inkMuted },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, maxHeight: '60%' },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 20, fontFamily: fonts.semibold, color: colors.ink },
  modalBody: { padding: 20 },
  configLabel: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink, marginBottom: 16 },
  horasSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  horaOption: {
    flex: 1,
    minWidth: 60,
    paddingVertical: 16,
    borderRadius: radii.md,
    backgroundColor: colors.chip,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  horaOptionActiva: { backgroundColor: colors.primary, borderColor: colors.primary },
  horaOptionText: { fontSize: 18, fontFamily: fonts.bold, color: colors.inkMuted },
  horaOptionTextActiva: { color: colors.surface },
  configInfo: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.glowSky,
    padding: 12,
    borderRadius: radii.sm,
    marginTop: 20,
  },
  configInfoText: { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: colors.inkMuted, lineHeight: 18 },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontFamily: fonts.semibold, color: colors.inkMuted, marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkSubtle, marginTop: 8, textAlign: 'center' },
});

