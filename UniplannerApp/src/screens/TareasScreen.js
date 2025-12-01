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
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function TareasScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tareas, setTareas] = useState([]);
  const [filtro, setFiltro] = useState('pendientes'); // 'todas', 'pendientes', 'completadas'
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  
  // Form state
  const [materias, setMaterias] = useState([]);
  const [formData, setFormData] = useState({
    curso_codigo: '',
    titulo: '',
    descripcion: '',
    tipo: 'taller',
    fecha_limite: '',
    hora_limite: '',
    horas_estimadas: '',
    dificultad: 3,
  });

  useEffect(() => {
    cargarDatos();
  }, [filtro]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar materias actuales
      const materiasResponse = await api.get('/usuario/materias/actuales');
      setMaterias(materiasResponse.data.materias || []);
      
      // Cargar tareas
      const tareasResponse = await api.get(`/tareas?pendientes=${filtro === 'pendientes'}`);
      let tareasData = tareasResponse.data.tareas || [];
      
      // Aplicar filtro adicional
      if (filtro === 'completadas') {
        tareasData = tareasData.filter(t => t.completada);
      }
      
      setTareas(tareasData);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const abrirModalNueva = () => {
    setFormData({
      curso_codigo: materias[0]?.codigo || '',
      titulo: '',
      descripcion: '',
      tipo: 'taller',
      fecha_limite: '',
      hora_limite: '23:59',
      horas_estimadas: '',
      dificultad: 3,
    });
    setModalVisible(true);
  };

  const crearTarea = async () => {
    if (!formData.curso_codigo || !formData.titulo || !formData.fecha_limite || !formData.horas_estimadas) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      await api.post('/tareas', formData);
      Alert.alert('Éxito', 'Tarea creada correctamente');
      setModalVisible(false);
      cargarDatos();
    } catch (error) {
      console.error('Error creando tarea:', error);
      Alert.alert('Error', 'No se pudo crear la tarea');
    }
  };

  const completarTarea = async (tareaId) => {
    try {
      await api.post(`/tareas/${tareaId}/completar`);
      cargarDatos();
    } catch (error) {
      console.error('Error completando tarea:', error);
      Alert.alert('Error', 'No se pudo completar la tarea');
    }
  };

  const eliminarTarea = async (tareaId) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que deseas eliminar esta tarea?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/tareas/${tareaId}`);
              cargarDatos();
            } catch (error) {
              console.error('Error eliminando tarea:', error);
              Alert.alert('Error', 'No se pudo eliminar la tarea');
            }
          },
        },
      ]
    );
  };

  const actualizarProgreso = async (tareaId, porcentaje) => {
    setModalEditVisible(false);
    try {
      await api.post(`/tareas/${tareaId}/progreso`, { porcentaje });
      cargarDatos();
    } catch (error) {
      console.error('Error actualizando progreso:', error);
      Alert.alert('Error', 'No se pudo actualizar el progreso');
    }
  };

  const getDificultadColor = (dificultad) => {
    if (dificultad >= 4) return '#EF4444';
    if (dificultad >= 3) return '#F59E0B';
    return '#10B981';
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      taller: 'document-text',
      parcial: 'school',
      proyecto: 'briefcase',
      lectura: 'book',
      exposicion: 'mic',
      quiz: 'help-circle',
      final: 'trophy',
    };
    return icons[tipo.toLowerCase()] || 'checkbox';
  };

  const renderTarea = (tarea) => {
    const diasRestantes = tarea.dias_restantes;
    const urgente = diasRestantes <= 3;
    
    return (
      <View
        key={tarea.id}
        style={[
          styles.tareaCard,
          tarea.completada && styles.tareaCompletada,
          urgente && !tarea.completada && styles.tareaUrgente,
        ]}
      >
        <TouchableOpacity
          onPress={() => !tarea.completada && completarTarea(tarea.id)}
          style={styles.checkbox}
        >
          {tarea.completada ? (
            <Ionicons name="checkmark-circle" size={28} color="#10B981" />
          ) : (
            <Ionicons name="ellipse-outline" size={28} color="#9CA3AF" />
          )}
        </TouchableOpacity>

        <View style={styles.tareaContent}>
          <View style={styles.tareaHeader}>
            <Text style={[styles.tareaTitle, tarea.completada && styles.tareaCompletadaText]}>
              {tarea.titulo}
            </Text>
            <TouchableOpacity onPress={() => eliminarTarea(tarea.id)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <Text style={styles.tareaCurso}>{tarea.curso.nombre}</Text>

          <View style={styles.tareaInfo}>
            <View style={styles.tareaTag}>
              <Ionicons name={getTipoIcon(tarea.tipo)} size={14} color="#6B7280" />
              <Text style={styles.tareaTagText}>{tarea.tipo}</Text>
            </View>

            <View style={styles.tareaTag}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.tareaTagText}>{tarea.horas_estimadas}h</Text>
            </View>

            <View style={[styles.tareaTag, { backgroundColor: getDificultadColor(tarea.dificultad) + '20' }]}>
              <Ionicons name="flame-outline" size={14} color={getDificultadColor(tarea.dificultad)} />
              <Text style={[styles.tareaTagText, { color: getDificultadColor(tarea.dificultad) }]}>
                {tarea.dificultad}/5
              </Text>
            </View>

            {!tarea.completada && (
              <View style={[styles.tareaTag, urgente && { backgroundColor: '#FEE2E2' }]}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={urgente ? '#EF4444' : '#6B7280'}
                />
                <Text style={[styles.tareaTagText, urgente && { color: '#EF4444' }]}>
                  {diasRestantes === 0 ? '¡Hoy!' : `${diasRestantes}d`}
                </Text>
              </View>
            )}
          </View>

          {!tarea.completada && tarea.porcentaje_completado > 0 && (
            <View style={styles.progresoContainer}>
              <View style={styles.progresoBar}>
                <View
                  style={[
                    styles.progresoFill,
                    { width: `${tarea.porcentaje_completado}%` },
                  ]}
                />
              </View>
              <Text style={styles.progresoText}>{tarea.porcentaje_completado}%</Text>
            </View>
          )}

          {!tarea.completada && (
            <TouchableOpacity
              style={styles.actualizarButton}
              onPress={() => {
                setTareaSeleccionada(tarea);
                setModalEditVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={16} color="#4F46E5" />
              <Text style={styles.actualizarButtonText}>Actualizar progreso</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'pendientes' && styles.filtroActivo]}
          onPress={() => setFiltro('pendientes')}
        >
          <Text style={[styles.filtroText, filtro === 'pendientes' && styles.filtroTextoActivo]}>
            Pendientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'todas' && styles.filtroActivo]}
          onPress={() => setFiltro('todas')}
        >
          <Text style={[styles.filtroText, filtro === 'todas' && styles.filtroTextoActivo]}>
            Todas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filtroButton, filtro === 'completadas' && styles.filtroActivo]}
          onPress={() => setFiltro('completadas')}
        >
          <Text style={[styles.filtroText, filtro === 'completadas' && styles.filtroTextoActivo]}>
            Completadas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de tareas */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tareas.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkbox-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay tareas aquí</Text>
            <Text style={styles.emptySubtext}>
              {filtro === 'pendientes'
                ? 'Crea tu primera tarea'
                : 'Cambia el filtro para ver otras tareas'}
            </Text>
          </View>
        ) : (
          tareas.map(renderTarea)
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Botón flotante */}
      <TouchableOpacity style={styles.fab} onPress={abrirModalNueva}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* Modal Nueva Tarea */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Tarea</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Materia */}
              <Text style={styles.label}>Materia *</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    Alert.alert(
                      'Selecciona Materia',
                      '',
                      materias.map(m => ({
                        text: m.nombre,
                        onPress: () => setFormData({ ...formData, curso_codigo: m.codigo }),
                      }))
                    );
                  }}
                >
                  <Text style={styles.pickerText}>
                    {materias.find(m => m.codigo === formData.curso_codigo)?.nombre || 'Selecciona'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Título */}
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Taller de algoritmos"
                value={formData.titulo}
                onChangeText={(text) => setFormData({ ...formData, titulo: text })}
              />

              {/* Tipo */}
              <Text style={styles.label}>Tipo *</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => {
                    const tipos = ['taller', 'parcial', 'proyecto', 'lectura', 'exposicion', 'quiz', 'final'];
                    Alert.alert(
                      'Selecciona Tipo',
                      '',
                      tipos.map(t => ({
                        text: t.charAt(0).toUpperCase() + t.slice(1),
                        onPress: () => setFormData({ ...formData, tipo: t }),
                      }))
                    );
                  }}
                >
                  <Text style={styles.pickerText}>
                    {formData.tipo.charAt(0).toUpperCase() + formData.tipo.slice(1)}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Fecha límite */}
              <Text style={styles.label}>Fecha Límite * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2025-12-31"
                value={formData.fecha_limite}
                onChangeText={(text) => setFormData({ ...formData, fecha_limite: text })}
              />

              {/* Horas estimadas */}
              <Text style={styles.label}>Horas Estimadas *</Text>
              <TextInput
                style={styles.input}
                placeholder="4"
                keyboardType="numeric"
                value={formData.horas_estimadas}
                onChangeText={(text) => setFormData({ ...formData, horas_estimadas: text })}
              />

              {/* Dificultad */}
              <Text style={styles.label}>Dificultad (1-5)</Text>
              <View style={styles.dificultadContainer}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.dificultadButton,
                      formData.dificultad === num && styles.dificultadActivo,
                    ]}
                    onPress={() => setFormData({ ...formData, dificultad: num })}
                  >
                    <Text
                      style={[
                        styles.dificultadText,
                        formData.dificultad === num && styles.dificultadTextoActivo,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Descripción */}
              <Text style={styles.label}>Descripción (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Detalles adicionales..."
                multiline
                numberOfLines={3}
                value={formData.descripcion}
                onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={crearTarea}
              >
                <Text style={styles.modalButtonTextPrimary}>Crear Tarea</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Actualizar Progreso */}
      <Modal visible={modalEditVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Actualizar Progreso</Text>
              <TouchableOpacity onPress={() => setModalEditVisible(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Selecciona el progreso:</Text>

              {[0, 25, 50, 75, 100].map((porcentaje) => (
                <TouchableOpacity
                  key={porcentaje}
                  style={styles.progresoOption}
                  onPress={() => actualizarProgreso(tareaSeleccionada?.id, porcentaje)}
                >
                  <View style={styles.progresoBar}>
                    <View
                      style={[
                        styles.progresoFill,
                        { width: `${porcentaje}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progresoOptionText}>{porcentaje}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
  filtrosContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filtroActivo: {
    backgroundColor: '#4F46E5',
  },
  filtroText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filtroTextoActivo: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  tareaCard: {
    flexDirection: 'row',
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
  tareaCompletada: {
    opacity: 0.6,
  },
  tareaUrgente: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  checkbox: {
    marginRight: 12,
  },
  tareaContent: {
    flex: 1,
  },
  tareaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  tareaTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  tareaCompletadaText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  tareaCurso: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  tareaInfo: {
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
  tareaTagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progresoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progresoBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progresoFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
  },
  progresoText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  actualizarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  actualizarButtonText: {
    fontSize: 14,
    color: '#4F46E5',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  pickerText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dificultadContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dificultadButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  dificultadActivo: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  dificultadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  dificultadTextoActivo: {
    color: 'white',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonPrimary: {
    backgroundColor: '#4F46E5',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  progresoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  progresoOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    width: 50,
  },
});