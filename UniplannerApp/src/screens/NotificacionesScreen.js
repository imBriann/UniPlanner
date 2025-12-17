/**
 * NotificacionesScreen.js - Pantalla de Notificaciones
 * Muestra notificaciones en tiempo real del usuario
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import AppBackground from '../components/AppBackground';
import { colors, fonts, radii, shadows } from '../theme/tokens';

export default function NotificacionesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'no_leidas'

  useEffect(() => {
    cargarNotificaciones();
  }, [filtro]);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      const soloNoLeidas = filtro === 'no_leidas';
      const response = await api.get(`/notificaciones?solo_no_leidas=${soloNoLeidas}`);
      setNotificaciones(response.data.notificaciones || []);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarNotificaciones();
    setRefreshing(false);
  };

  const marcarLeida = async (notifId) => {
    try {
      await api.post(`/notificaciones/${notifId}/marcar-leida`);
      cargarNotificaciones();
    } catch (error) {
      console.error('Error marcando notificación:', error);
    }
  };

  const getIconoPrioridad = (prioridad) => {
    const iconos = {
      critica: { name: 'alert-circle', color: colors.danger },
      alta: { name: 'alert', color: colors.warning },
      media: { name: 'information-circle', color: colors.info },
      baja: { name: 'checkmark-circle', color: colors.success },
    };
    return iconos[prioridad] || iconos.media;
  };

  const getIconoTipo = (tipo) => {
    const iconos = {
      tarea_urgente: 'alarm',
      tarea_proxima: 'time',
      evento_academico: 'calendar',
      recordatorio_estudio: 'book',
      logro_desbloqueado: 'trophy',
      sugerencia_inscripcion: 'school',
    };
    return iconos[tipo] || 'notifications';
  };

  const renderNotificacion = (notif) => {
    const iconoPrioridad = getIconoPrioridad(notif.prioridad);
    const iconoTipo = getIconoTipo(notif.tipo);
    const tiempoTranscurrido = calcularTiempoTranscurrido(notif.fecha_creacion);

    return (
      <TouchableOpacity
        key={notif.id}
        style={[
          styles.notifCard,
          !notif.leida && styles.notifNoLeida,
          notif.prioridad === 'critica' && styles.notifCritica,
        ]}
        onPress={() => {
          if (!notif.leida) {
            marcarLeida(notif.id);
          }
          // Navegar a la pantalla correspondiente si hay datos extra
          if (notif.datos_extra?.tarea_id) {
            navigation.navigate('Main', { screen: 'Tareas' });
          }
        }}
      >
        <View style={styles.notifHeader}>
          <View style={[styles.notifIcono, { backgroundColor: iconoPrioridad.color + '20' }]}>
            <Ionicons name={iconoTipo} size={24} color={iconoPrioridad.color} />
          </View>
          
          <View style={styles.notifContent}>
            <View style={styles.notifTitleRow}>
              <Text style={styles.notifTitulo} numberOfLines={2}>
                {notif.titulo}
              </Text>
              {!notif.leida && <View style={styles.puntito} />}
            </View>
            
            <Text style={styles.notifMensaje} numberOfLines={3}>
              {notif.mensaje}
            </Text>
            
            <View style={styles.notifFooter}>
              <Ionicons name="time-outline" size={12} color={colors.inkSubtle} />
              <Text style={styles.notifTiempo}>{tiempoTranscurrido}</Text>
              
              <View style={[styles.prioridadBadge, { backgroundColor: iconoPrioridad.color + '20' }]}>
                <Ionicons name={iconoPrioridad.name} size={12} color={iconoPrioridad.color} />
                <Text style={[styles.prioridadTexto, { color: iconoPrioridad.color }]}>
                  {notif.prioridad}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const calcularTiempoTranscurrido = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMins / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return fecha.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AppBackground />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBackground />
      {/* Header con contador */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="notifications" size={28} color={colors.primary} />
          <View>
            <Text style={styles.headerTitulo}>Notificaciones</Text>
            <Text style={styles.headerSubtitulo}>
              {notificaciones.filter(n => !n.leida).length} sin leer
            </Text>
          </View>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'todas' && styles.filtroActivo]}
          onPress={() => setFiltro('todas')}
        >
          <Text style={[styles.filtroText, filtro === 'todas' && styles.filtroTextoActivo]}>
            Todas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'no_leidas' && styles.filtroActivo]}
          onPress={() => setFiltro('no_leidas')}
        >
          <Text style={[styles.filtroText, filtro === 'no_leidas' && styles.filtroTextoActivo]}>
            No leídas
          </Text>
          {notificaciones.filter(n => !n.leida).length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificaciones.filter(n => !n.leida).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Lista de notificaciones */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notificaciones.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.borderStrong} />
            <Text style={styles.emptyText}>No hay notificaciones</Text>
            <Text style={styles.emptySubtext}>
              {filtro === 'no_leidas' 
                ? 'Todas tus notificaciones están leídas'
                : 'Te notificaremos sobre eventos importantes'}
            </Text>
          </View>
        ) : (
          notificaciones.map(renderNotificacion)
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, position: 'relative' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { 
    backgroundColor: colors.surface, 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitulo: { fontSize: 20, fontFamily: fonts.semibold, color: colors.ink },
  headerSubtitulo: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted, marginTop: 2 },
  filtrosContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    gap: 8, 
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtroButton: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: radii.sm, 
    backgroundColor: colors.chip,
    gap: 6,
  },
  filtroActivo: { backgroundColor: colors.primary },
  filtroText: { fontSize: 14, fontFamily: fonts.medium, color: colors.inkMuted },
  filtroTextoActivo: { color: colors.surface },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { fontSize: 11, fontFamily: fonts.semibold, color: colors.primary },
  scrollView: { flex: 1 },
  notifCard: { 
    backgroundColor: colors.surface, 
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: radii.md, 
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  notifNoLeida: { 
    backgroundColor: colors.glowSky,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notifCritica: {
    backgroundColor: `${colors.danger}14`,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  notifHeader: { flexDirection: 'row', gap: 12 },
  notifIcono: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  notifContent: { flex: 1 },
  notifTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitulo: { 
    flex: 1,
    fontSize: 15, 
    fontFamily: fonts.semibold, 
    color: colors.ink,
  },
  puntito: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  notifMensaje: { 
    fontSize: 14, 
    fontFamily: fonts.regular, 
    color: colors.inkMuted, 
    marginBottom: 8,
    lineHeight: 20,
  },
  notifFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
  },
  notifTiempo: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkSubtle, marginRight: 8 },
  prioridadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    marginLeft: 'auto',
  },
  prioridadTexto: { 
    fontSize: 11, 
    fontFamily: fonts.semibold,
    textTransform: 'capitalize',
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: { 
    fontSize: 18, 
    fontFamily: fonts.semibold, 
    color: colors.inkMuted, 
    marginTop: 16,
  },
  emptySubtext: { 
    fontSize: 14, 
    fontFamily: fonts.regular, 
    color: colors.inkSubtle, 
    marginTop: 8,
    textAlign: 'center',
  },
});
