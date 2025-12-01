import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [tareasUrgentes, setTareasUrgentes] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar recomendaciones
      const recResponse = await api.get('/recomendaciones?limite=5');
      setRecomendaciones(recResponse.data.recomendaciones || []);

      // Cargar estadísticas
      const statsResponse = await api.get('/estadisticas');
      setEstadisticas(statsResponse.data.estadisticas);

      // Cargar tareas urgentes
      const urgentesResponse = await api.get('/recomendaciones/tareas-urgentes?dias=3');
      setTareasUrgentes(urgentesResponse.data.tareas_urgentes || []);

    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del inicio');
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
    if (dificultad >= 4) return '#EF4444';
    if (dificultad >= 3) return '#F59E0B';
    return '#10B981';
  };

  const getDiasColor = (dias) => {
    if (dias <= 1) return '#EF4444';
    if (dias <= 3) return '#F59E0B';
    return '#10B981';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Cargando recomendaciones...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>¡Hola, {user?.nombre}! 👋</Text>
          <Text style={styles.subtitle}>Aquí está tu resumen académico</Text>
        </View>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={32} color="white" />
        </View>
      </View>

      {/* Estadísticas */}
      {estadisticas && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="checkbox-outline" size={24} color="#4F46E5" />
            <Text style={styles.statNumber}>{estadisticas.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="checkmark-done" size={24} color="#10B981" />
            <Text style={styles.statNumber}>{estadisticas.completadas}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time-outline" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{estadisticas.horas_pendientes}h</Text>
            <Text style={styles.statLabel}>Por hacer</Text>
          </View>
        </View>
      )}

      {/* Tareas Urgentes */}
      {tareasUrgentes.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.sectionTitle}>Tareas Urgentes</Text>
          </View>
          
          {tareasUrgentes.map((tarea) => (
            <TouchableOpacity
              key={tarea.id}
              style={[styles.tareaCard, { borderLeftColor: '#EF4444' }]}
              onPress={() => navigation.navigate('Tareas')}
            >
              <View style={styles.tareaContent}>
                <Text style={styles.tareaTitle}>{tarea.titulo}</Text>
                <Text style={styles.tareaCurso}>{tarea.curso}</Text>
                <View style={styles.tareaFooter}>
                  <View style={styles.tareaTag}>
                    <Ionicons name="calendar" size={14} color="#EF4444" />
                    <Text style={[styles.tareaTagText, { color: '#EF4444' }]}>
                      {tarea.dias_restantes === 0 ? '¡Hoy!' : `${tarea.dias_restantes} días`}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recomendaciones del día */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb" size={24} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Recomendaciones para hoy</Text>
        </View>
        
        {recomendaciones.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#10B981" />
            <Text style={styles.emptyText}>¡Todo al día!</Text>
            <Text style={styles.emptySubtext}>No tienes tareas pendientes por ahora</Text>
          </View>
        ) : (
          recomendaciones.map((tarea, index) => (
            <TouchableOpacity
              key={tarea.id}
              style={styles.recomendacionCard}
              onPress={() => navigation.navigate('Tareas')}
            >
              <View style={styles.recomendacionHeader}>
                <View style={styles.recomendacionNumber}>
                  <Text style={styles.recomendacionNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.recomendacionContent}>
                  <Text style={styles.recomendacionTitle}>{tarea.titulo}</Text>
                  <Text style={styles.recomendacionCurso}>{tarea.curso}</Text>
                </View>
              </View>
              
              <View style={styles.recomendacionFooter}>
                <View style={styles.recomendacionTag}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
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

      {/* Accesos rápidos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Tareas')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="add-circle" size={32} color="#4F46E5" />
            </View>
            <Text style={styles.quickActionText}>Nueva Tarea</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Calendario')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="calendar" size={32} color="#10B981" />
            </View>
            <Text style={styles.quickActionText}>Calendario</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Materias')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="book" size={32} color="#F59E0B" />
            </View>
            <Text style={styles.quickActionText}>Materias</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  tareaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tareaContent: {
    flex: 1,
  },
  tareaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  tareaCurso: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  tareaFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  tareaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tareaTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recomendacionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recomendacionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recomendacionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recomendacionNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recomendacionContent: {
    flex: 1,
  },
  recomendacionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  recomendacionCurso: {
    fontSize: 14,
    color: '#6B7280',
  },
  recomendacionFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  recomendacionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  recomendacionTagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});