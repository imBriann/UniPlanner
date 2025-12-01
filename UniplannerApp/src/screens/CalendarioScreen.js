import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';

export default function CalendarioScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('institucional'); // 'institucional', 'tareas'
  const [eventosInstitucionales, setEventosInstitucionales] = useState([]);
  const [tareasPorFecha, setTareasPorFecha] = useState({});
  const [semestreSeleccionado, setSemestreSeleccionado] = useState('2025-1');

  useEffect(() => {
    cargarDatos();
  }, [tab, semestreSeleccionado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      if (tab === 'institucional') {
        const response = await api.get(`/calendario/eventos?semestre=${semestreSeleccionado}`);
        setEventosInstitucionales(response.data.eventos || []);
      } else {
        const response = await api.get('/tareas?pendientes=true');
        const tareas = response.data.tareas || [];
        
        // Agrupar tareas por fecha
        const agrupadas = tareas.reduce((acc, tarea) => {
          const fecha = tarea.fecha_limite.split('T')[0];
          if (!acc[fecha]) {
            acc[fecha] = [];
          }
          acc[fecha].push(tarea);
          return acc;
        }, {});
        
        setTareasPorFecha(agrupadas);
      }
    } catch (error) {
      console.error('Error cargando calendario:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return `${fecha.getDate()} ${meses[fecha.getMonth()]}`;
  };

  const formatearFechaCompleta = (fechaStr) => {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]}`;
  };

  const getEventoColor = (tipo) => {
    const colores = {
      inicio_clases: '#10B981',
      fin_clases: '#8B5CF6',
      parcial: '#F59E0B',
      final: '#EF4444',
      cancelacion: '#F97316',
      inscripcion: '#3B82F6',
      festivo: '#EC4899',
    };
    return colores[tipo] || '#6B7280';
  };

  const esEventoProximo = (fechaStr) => {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const hoy = new Date();
    const diffDias = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
    return diffDias >= 0 && diffDias <= 7;
  };

  const renderEventoInstitucional = (evento) => {
    const color = getEventoColor(evento.tipo);
    const proximo = esEventoProximo(evento.fecha_inicio);

    return (
      <View
        key={evento.id}
        style={[
          styles.eventoCard,
          proximo && styles.eventoProximo,
          { borderLeftColor: color }
        ]}
      >
        <View style={styles.eventoHeader}>
          <View style={[styles.eventoIcono, { backgroundColor: color + '20' }]}>
            <Text style={styles.eventoEmoji}>{evento.icono}</Text>
          </View>
          
          <View style={styles.eventoInfo}>
            <Text style={styles.eventoNombre}>{evento.nombre_evento}</Text>
            {evento.descripcion && (
              <Text style={styles.eventoDescripcion}>{evento.descripcion}</Text>
            )}
            
            <View style={styles.eventoFecha}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.eventoFechaTexto}>
                {formatearFechaCompleta(evento.fecha_inicio)}
                {evento.fecha_fin && ` - ${formatearFechaCompleta(evento.fecha_fin)}`}
              </Text>
            </View>
          </View>
        </View>
        
        {proximo && (
          <View style={styles.proximoBadge}>
            <Ionicons name="time-outline" size={14} color="#F59E0B" />
            <Text style={styles.proximoTexto}>Próximamente</Text>
          </View>
        )}
      </View>
    );
  };

  const renderTareasPorFecha = () => {
    const fechas = Object.keys(tareasPorFecha).sort();
    
    if (fechas.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No hay tareas programadas</Text>
          <Text style={styles.emptySubtext}>¡Perfecto! Estás al día</Text>
        </View>
      );
    }

    return fechas.map((fecha) => {
      const tareas = tareasPorFecha[fecha];
      const esHoy = fecha === new Date().toISOString().split('T')[0];
      
      return (
        <View key={fecha} style={styles.fechaSection}>
          <View style={[styles.fechaHeader, esHoy && styles.fechaHeaderHoy]}>
            <Text style={[styles.fechaTitulo, esHoy && styles.fechaTituloHoy]}>
              {formatearFechaCompleta(fecha)}
            </Text>
            <View style={styles.fechaBadge}>
              <Text style={styles.fechaBadgeTexto}>{tareas.length}</Text>
            </View>
          </View>

          {tareas.map((tarea) => (
            <View key={tarea.id} style={styles.tareaCard}>
              <View style={styles.tareaHeader}>
                <View style={styles.tareaIndicador} />
                <View style={styles.tareaContent}>
                  <Text style={styles.tareaTitulo}>{tarea.titulo}</Text>
                  <Text style={styles.tareaCurso}>{tarea.curso.nombre}</Text>
                  
                  <View style={styles.tareaFooter}>
                    <View style={styles.tareaTag}>
                      <Ionicons name="time-outline" size={12} color="#6B7280" />
                      <Text style={styles.tareaTagTexto}>{tarea.horas_estimadas}h</Text>
                    </View>
                    
                    <View style={styles.tareaTag}>
                      <Ionicons name="flame-outline" size={12} color="#F59E0B" />
                      <Text style={styles.tareaTagTexto}>Dif. {tarea.dificultad}/5</Text>
                    </View>
                    
                    {tarea.hora_limite && (
                      <View style={styles.tareaTag}>
                        <Ionicons name="alarm-outline" size={12} color="#6B7280" />
                        <Text style={styles.tareaTagTexto}>{tarea.hora_limite}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      );
    });
  };

  const renderContenido = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      );
    }

    if (tab === 'institucional') {
      return (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Selector de Semestre */}
          <View style={styles.semestreSelector}>
            <TouchableOpacity
              style={[
                styles.semestreButton,
                semestreSeleccionado === '2025-1' && styles.semestreButtonActivo
              ]}
              onPress={() => setSemestreSeleccionado('2025-1')}
            >
              <Text style={[
                styles.semestreButtonTexto,
                semestreSeleccionado === '2025-1' && styles.semestreButtonTextoActivo
              ]}>
                2025-1
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.semestreButton,
                semestreSeleccionado === '2025-2' && styles.semestreButtonActivo
              ]}
              onPress={() => setSemestreSeleccionado('2025-2')}
            >
              <Text style={[
                styles.semestreButtonTexto,
                semestreSeleccionado === '2025-2' && styles.semestreButtonTextoActivo
              ]}>
                2025-2
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.eventosContainer}>
            {eventosInstitucionales.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No hay eventos programados</Text>
              </View>
            ) : (
              eventosInstitucionales.map(renderEventoInstitucional)
            )}
          </View>
        </ScrollView>
      );
    }

    if (tab === 'tareas') {
      return (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.tareasContainer}>
            {renderTareasPorFecha()}
          </View>
        </ScrollView>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'institucional' && styles.tabActivo]}
          onPress={() => setTab('institucional')}
        >
          <Ionicons
            name={tab === 'institucional' ? 'school' : 'school-outline'}
            size={20}
            color={tab === 'institucional' ? '#4F46E5' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, tab === 'institucional' && styles.tabTextoActivo]}>
            Institucional
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'tareas' && styles.tabActivo]}
          onPress={() => setTab('tareas')}
        >
          <Ionicons
            name={tab === 'tareas' ? 'checkbox' : 'checkbox-outline'}
            size={20}
            color={tab === 'tareas' ? '#4F46E5' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, tab === 'tareas' && styles.tabTextoActivo]}>
            Mis Tareas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      {renderContenido()}
    </View>
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
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabActivo: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabTextoActivo: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  semestreSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  semestreButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  semestreButtonActivo: {
    backgroundColor: '#4F46E5',
  },
  semestreButtonTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  semestreButtonTextoActivo: {
    color: 'white',
  },
  eventosContainer: {
    padding: 16,
    paddingTop: 0,
  },
  eventoCard: {
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
  eventoProximo: {
    backgroundColor: '#FFFBEB',
  },
  eventoHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  eventoIcono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventoEmoji: {
    fontSize: 24,
  },
  eventoInfo: {
    flex: 1,
  },
  eventoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventoDescripcion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  eventoFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventoFechaTexto: {
    fontSize: 13,
    color: '#6B7280',
  },
  proximoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginTop: 12,
  },
  proximoTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  tareasContainer: {
    padding: 16,
  },
  fechaSection: {
    marginBottom: 24,
  },
  fechaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  fechaHeaderHoy: {
    borderBottomColor: '#4F46E5',
  },
  fechaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  fechaTituloHoy: {
    color: '#4F46E5',
  },
  fechaBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fechaBadgeTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  tareaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  tareaHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  tareaIndicador: {
    width: 4,
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  tareaContent: {
    flex: 1,
  },
  tareaTitulo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  tareaCurso: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  tareaFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tareaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tareaTagTexto: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});