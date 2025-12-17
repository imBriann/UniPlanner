/**
 * LogrosScreen.js - Sistema de Logros y Gamificación
 * Muestra logros desbloqueados y progreso del estudiante
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import AppBackground from '../components/AppBackground';
import ModernDialog from './ModernDialog';
import { colors, fonts, radii, shadows } from '../theme/tokens';

export default function LogrosScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logrosData, setLogrosData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('desbloqueados');
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
    cargarLogros();
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

  const cargarLogros = async () => {
    try {
      setLoading(true);
      const response = await api.get('/logros');
      setLogrosData(response.data);
    } catch (error) {
      console.error('Error cargando logros:', error);
      showDialog({
        title: 'No pudimos cargar los logros',
        message: resolveErrorMessage(
          error,
          'Verifica tu conexion y vuelve a intentar.'
        ),
        type: 'error',
        onConfirm: cargarLogros,
        confirmText: 'Reintentar',
        cancelText: 'Cerrar',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarLogros();
    setRefreshing(false);
  };

  const renderNivelProgress = () => {
    if (!logrosData) return null;

    const progresoNivel = logrosData?.progreso_nivel || {
      nivel_actual: 0,
      exp_actual: 0,
      exp_siguiente_nivel: 100,
      porcentaje: 0,
    };
    const estadisticasGenerales = logrosData?.estadisticas_generales || {
      tareas_completadas: 0,
      creditos_aprobados: 0,
      materias_cursando: 0,
    };

    const { nivel_actual, exp_actual, exp_siguiente_nivel, porcentaje } =
      progresoNivel;

    return (
      <View style={styles.nivelCard}>
        <View style={styles.nivelHeader}>
          <View style={styles.nivelIcono}>
            <Text style={styles.nivelNumero}>{nivel_actual}</Text>
          </View>
          <View style={styles.nivelInfo}>
            <Text style={styles.nivelTitulo}>Nivel {nivel_actual}</Text>
            <Text style={styles.nivelSubtitulo}>
              {exp_actual} / {exp_siguiente_nivel} XP
            </Text>
          </View>
          <View style={styles.nivelStats}>
            <Ionicons name="trending-up" size={24} color={colors.success} />
            <Text style={styles.nivelPorcentaje}>{porcentaje}%</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${porcentaje}%` }]} />
        </View>

        <View style={styles.nivelFooter}>
          <View style={styles.miniStat}>
            <Ionicons name="checkbox-outline" size={16} color={colors.inkMuted} />
            <Text style={styles.miniStatText}>
              {estadisticasGenerales.tareas_completadas} tareas
            </Text>
          </View>
          <View style={styles.miniStat}>
            <Ionicons name="school-outline" size={16} color={colors.inkMuted} />
            <Text style={styles.miniStatText}>
              {estadisticasGenerales.creditos_aprobados} créditos
            </Text>
          </View>
          <View style={styles.miniStat}>
            <Ionicons name="book-outline" size={16} color={colors.inkMuted} />
            <Text style={styles.miniStatText}>
              {estadisticasGenerales.materias_cursando} materias
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLogro = (logro, desbloqueado = true) => {
    return (
      <View 
        key={logro.id} 
        style={[
          styles.logroCard,
          !desbloqueado && styles.logroBloqueado
        ]}
      >
        <View style={styles.logroIcono}>
          <Text style={styles.logroEmoji}>{logro.emoji}</Text>
          {desbloqueado && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
          )}
        </View>

        <View style={styles.logroContent}>
          <Text style={[
            styles.logroNombre,
            !desbloqueado && styles.logroNombreBloqueado
          ]}>
            {logro.nombre}
          </Text>
          <Text style={[
            styles.logroDescripcion,
            !desbloqueado && styles.logroDescripcionBloqueada
          ]}>
            {logro.descripcion}
          </Text>

          {desbloqueado && logro.fecha_obtenido && (
            <Text style={styles.logroFecha}>
              Desbloqueado: {new Date(logro.fecha_obtenido).toLocaleDateString()}
            </Text>
          )}

          {!desbloqueado && (
            <View style={styles.logroBloqueadoBadge}>
              <Ionicons name="lock-closed" size={12} color={colors.inkSubtle} />
              <Text style={styles.logroBloqueadoText}>Bloqueado</Text>
            </View>
          )}
        </View>
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

  if (!logrosData) {
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

  const logrosDesbloqueados = logrosData?.logros_desbloqueados || [];
  const totalLogros = logrosData?.total_logros || 10;
  const porcentajeLogros = logrosData?.porcentaje_logros || 0;
  const logrosBloqueados = Math.max(totalLogros - logrosDesbloqueados.length, 0);

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
      {/* Progreso de Nivel */}
      {renderNivelProgress()}

      {/* Resumen de Logros */}
      <View style={styles.resumenContainer}>
        <View style={styles.resumenCard}>
          <Text style={styles.resumenNumero}>{totalLogros}</Text>
          <Text style={styles.resumenLabel}>Desbloqueados</Text>
        </View>
        <View style={styles.resumenCard}>
          <Text style={styles.resumenNumero}>{porcentajeLogros}%</Text>
          <Text style={styles.resumenLabel}>Completado</Text>
        </View>
        <View style={styles.resumenCard}>
          <Text style={styles.resumenNumero}>{logrosBloqueados}</Text>
          <Text style={styles.resumenLabel}>Por desbloquear</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'desbloqueados' && styles.tabActivo]}
          onPress={() => setSelectedTab('desbloqueados')}
        >
          <Ionicons
            name={selectedTab === 'desbloqueados' ? 'trophy' : 'trophy-outline'}
            size={20}
            // CORRECCIÓN AQUÍ: Color blanco cuando está activo
            color={selectedTab === 'desbloqueados' ? colors.surface : colors.inkSubtle}
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'desbloqueados' && styles.tabTextoActivo
          ]}>
            Desbloqueados
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>
              {logrosDesbloqueados.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'todos' && styles.tabActivo]}
          onPress={() => setSelectedTab('todos')}
        >
          <Ionicons
            name={selectedTab === 'todos' ? 'grid' : 'grid-outline'}
            size={20}
            // CORRECCIÓN AQUÍ: Color blanco cuando está activo
            color={selectedTab === 'todos' ? colors.surface : colors.inkSubtle}
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'todos' && styles.tabTextoActivo
          ]}>
            Todos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Logros */}
      <View style={styles.logrosContainer}>
        {selectedTab === 'desbloqueados' ? (
          logrosDesbloqueados.length > 0 ? (
            logrosDesbloqueados.map(logro => renderLogro(logro, true))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color={colors.borderStrong} />
              <Text style={styles.emptyText}>Aún no has desbloqueado logros</Text>
              <Text style={styles.emptySubtext}>
                ¡Completa tareas y sigue estudiando para obtener logros!
              </Text>
            </View>
          )
        ) : (
          // Mostrar todos (desbloqueados + simulación de bloqueados)
          <>
            {logrosDesbloqueados.map(logro => renderLogro(logro, true))}
            {/* Logros bloqueados simulados */}
            {logrosBloqueados > 0 && Array.from({ length: logrosBloqueados }).map((_, i) => 
              renderLogro({
                id: `bloqueado_${i}`,
                nombre: '???',
                descripcion: 'Sigue progresando para descubrir este logro',
                emoji: '🔒'
              }, false)
            )}
          </>
        )}
      </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, position: 'relative' },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  
  nivelCard: { 
    backgroundColor: colors.surface, 
    margin: 20, 
    padding: 20, 
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  nivelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  nivelIcono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nivelNumero: { fontSize: 28, fontFamily: fonts.bold, color: colors.surface },
  nivelInfo: { flex: 1 },
  nivelTitulo: { fontSize: 20, fontFamily: fonts.semibold, color: colors.ink },
  nivelSubtitulo: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted, marginTop: 4 },
  nivelStats: { alignItems: 'center', gap: 4 },
  nivelPorcentaje: { fontSize: 16, fontFamily: fonts.bold, color: colors.success },
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: { 
    height: '100%', 
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  nivelFooter: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniStatText: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkMuted },

  resumenContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  resumenCard: { 
    flex: 1, 
    backgroundColor: colors.surface, 
    padding: 16, 
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  resumenNumero: { fontSize: 28, fontFamily: fonts.bold, color: colors.primary },
  resumenLabel: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkMuted, marginTop: 4 },

  tabsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    gap: 12,
    marginBottom: 20,
  },
  tab: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderRadius: radii.md,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  tabActivo: { 
    backgroundColor: colors.primary,
  },
  tabText: { fontSize: 14, fontFamily: fonts.semibold, color: colors.inkSubtle },
  tabTextoActivo: { color: colors.surface },
  tabBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: { fontSize: 11, fontFamily: fonts.bold, color: colors.ink },

  logrosContainer: { paddingHorizontal: 20, gap: 12 },
  logroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  logroBloqueado: { opacity: 0.6, backgroundColor: colors.surfaceAlt },
  logroIcono: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.chip,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  logroEmoji: { fontSize: 32 },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  logroContent: { flex: 1 },
  logroNombre: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink, marginBottom: 4 },
  logroNombreBloqueado: { color: colors.inkSubtle },
  logroDescripcion: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted, marginBottom: 8 },
  logroDescripcionBloqueada: { color: colors.inkSubtle },
  logroFecha: { fontSize: 12, fontFamily: fonts.medium, color: colors.success },
  logroBloqueadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.chip,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logroBloqueadoText: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkSubtle },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontFamily: fonts.semibold, color: colors.inkMuted, marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkSubtle, marginTop: 8, textAlign: 'center' },
});
