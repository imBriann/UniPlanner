/**
 * TareasScreen.js - CORREGIDO ✅
 * - Formulario de creación de tareas arreglado
 * - Campos de horas estimadas y fecha funcionando correctamente
 * - Validaciones mejoradas
 * - Interfaz más intuitiva
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import AppBackground from '../components/AppBackground';
import ModernDialog from './ModernDialog';
import { scheduleTaskReminder } from '../utils/notifications';
import { colors, fonts, radii, shadows } from '../theme/tokens';

export default function TareasScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tareas, setTareas] = useState([]);
  const [filtro, setFiltro] = useState('pendientes');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalEditVisible, setModalEditVisible] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  
  const [materias, setMaterias] = useState([]);
  const [formData, setFormData] = useState({
    curso_codigo: '',
    titulo: '',
    descripcion: '',
    tipo: 'taller',
    fecha_limite: '',
    hora_limite: '23:59',
    horas_estimadas: '4',
    dificultad: 3,
  });
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorConfig, setSelectorConfig] = useState({
    title: '',
    options: [],
    selectedValue: null,
    onSelect: null,
  });
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    closeText: 'Entendido',
  });
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    cargarDatos();
  }, [filtro]);

  const showDialog = ({
    title,
    message,
    type = 'info',
    closeText = 'Entendido',
  }) => {
    setDialogConfig({
      title,
      message,
      type,
      closeText,
    });
    setDialogVisible(true);
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (value) => {
    if (!value) return new Date();
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return new Date();
    return new Date(year, month - 1, day);
  };

  const openSelector = ({ title, options, selectedValue, onSelect }) => {
    setSelectorConfig({ title, options, selectedValue, onSelect });
    setSelectorVisible(true);
  };

  const openDatePicker = () => {
    const baseDate = parseDate(formData.fecha_limite);
    setCalendarMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    setDatePickerVisible(true);
  };

  const buildCalendarDays = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < startOffset; i += 1) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(day);
    }
    return days;
  };

  const changeMonth = (offset) => {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1)
    );
  };

  const handleSelectDay = (day) => {
    const selected = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day
    );
    setFormData({ ...formData, fecha_limite: formatDate(selected) });
    setDatePickerVisible(false);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const materiasResponse = await api.get('/usuario/materias/actuales');
      setMaterias(materiasResponse.data.materias || []);
      
      const tareasResponse = await api.get(`/tareas?pendientes=${filtro === 'pendientes'}`);
      let tareasData = tareasResponse.data.tareas || [];
      
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
    // 🆕 Resetear formulario con valores por defecto
    const fechaHoy = formatDate(new Date());

    setFormData({
      curso_codigo: materias[0]?.codigo || '',
      titulo: '',
      descripcion: '',
      tipo: 'taller',
      fecha_limite: fechaHoy,
      hora_limite: '23:59',
      horas_estimadas: '4',
      dificultad: 3,
    });
    setModalVisible(true);
  };

  // 🆕 FUNCIÓN MEJORADA DE CREACIÓN DE TAREAS
  const crearTarea = async () => {
    // Validaciones
    if (!formData.curso_codigo) {
      showDialog({
        title: 'Falta materia',
        message: 'Debes seleccionar una materia.',
        type: 'warning',
      });
      return;
    }

    if (!formData.titulo.trim()) {
      showDialog({
        title: 'Falta titulo',
        message: 'Debes ingresar un titulo.',
        type: 'warning',
      });
      return;
    }

    if (!formData.fecha_limite) {
      showDialog({
        title: 'Falta fecha',
        message: 'Debes ingresar una fecha limite.',
        type: 'warning',
      });
      return;
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!formatoFecha.test(formData.fecha_limite)) {
      showDialog({
        title: 'Fecha invalida',
        message: 'La fecha debe estar en formato YYYY-MM-DD. Ejemplo: 2025-12-25.',
        type: 'warning',
      });
      return;
    }

    // Validar que las horas sean un número válido
    const horas = parseFloat(formData.horas_estimadas);
    if (isNaN(horas) || horas < 0.5 || horas > 24) {
      showDialog({
        title: 'Horas invalidas',
        message: 'Las horas estimadas deben estar entre 0.5 y 24.',
        type: 'warning',
      });
      return;
    }

    try {
      // Construir el objeto de datos a enviar
      const datosEnviar = {
        curso_codigo: formData.curso_codigo,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        tipo: formData.tipo,
        fecha_limite: formData.fecha_limite,
        horas_estimadas: horas,
        dificultad: formData.dificultad,
      };

      const response = await api.post('/tareas', datosEnviar);
      const tareaCreada = response.data?.tarea;

      if (tareaCreada?.id) {
        try {
          await scheduleTaskReminder({
            id: tareaCreada.id,
            titulo: datosEnviar.titulo,
            curso: tareaCreada.curso,
            fecha_limite: datosEnviar.fecha_limite,
          });
        } catch (error) {
          console.warn('No se pudo programar el recordatorio', error);
        }
      }
      
      showDialog({
        title: 'Tarea creada',
        message: 'La tarea se creo correctamente.',
        type: 'success',
        closeText: 'Listo',
      });
      setModalVisible(false);
      cargarDatos();
    } catch (error) {
      console.error('Error creando tarea:', error);
      const mensajeError = error.response?.data?.error || 'No se pudo crear la tarea';
      showDialog({
        title: 'No se pudo crear',
        message: mensajeError,
        type: 'error',
      });
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
    if (dificultad >= 4) return colors.danger;
    if (dificultad >= 3) return colors.warning;
    return colors.success;
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
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          ) : (
            <Ionicons name="ellipse-outline" size={28} color={colors.borderStrong} />
          )}
        </TouchableOpacity>

        <View style={styles.tareaContent}>
          <View style={styles.tareaHeader}>
            <Text style={[styles.tareaTitle, tarea.completada && styles.tareaCompletadaText]}>
              {tarea.titulo}
            </Text>
            <TouchableOpacity onPress={() => eliminarTarea(tarea.id)}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>

          <Text style={styles.tareaCurso}>{tarea.curso.nombre}</Text>

          <View style={styles.tareaInfo}>
            <View style={styles.tareaTag}>
              <Ionicons name={getTipoIcon(tarea.tipo)} size={14} color={colors.inkMuted} />
              <Text style={styles.tareaTagText}>{tarea.tipo}</Text>
            </View>

            <View style={styles.tareaTag}>
              <Ionicons name="time-outline" size={14} color={colors.inkMuted} />
              <Text style={styles.tareaTagText}>{tarea.horas_estimadas}h</Text>
            </View>

            <View style={[styles.tareaTag, { backgroundColor: getDificultadColor(tarea.dificultad) + '20' }]}>
              <Ionicons name="flame-outline" size={14} color={getDificultadColor(tarea.dificultad)} />
              <Text style={[styles.tareaTagText, { color: getDificultadColor(tarea.dificultad) }]}>
                {tarea.dificultad}/5
              </Text>
            </View>

            {!tarea.completada && (
              <View style={[styles.tareaTag, urgente && { backgroundColor: `${colors.danger}14` }]}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={urgente ? colors.danger : colors.inkMuted}
                />
                <Text style={[styles.tareaTagText, urgente && { color: colors.danger }]}>
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
              <Ionicons name="create-outline" size={16} color={colors.primary} />
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
        <AppBackground />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const selectedDate = parseDate(formData.fecha_limite);
  const calendarDays = buildCalendarDays(calendarMonth);
  const monthLabel = calendarMonth.toLocaleDateString('es', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <AppBackground />
      <ModernDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        closeText={dialogConfig.closeText}
      />
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
            <Ionicons name="checkbox-outline" size={64} color={colors.borderStrong} />
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

      {/* 🆕 MODAL MEJORADO DE NUEVA TAREA */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Nueva Tarea</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={colors.inkMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Materia */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Materia *</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => {
                      if (materias.length === 0) {
                        showDialog({
                          title: 'Sin materias',
                          message: 'No tienes materias inscritas.',
                          type: 'warning',
                          closeText: 'Entendido',
                        });
                        return;
                      }
                      openSelector({
                        title: 'Selecciona materia',
                        selectedValue: formData.curso_codigo,
                        options: materias.map((m) => ({
                          value: m.codigo,
                          label: m.nombre,
                          subtitle: m.codigo,
                        })),
                        onSelect: (value) => {
                          setFormData({ ...formData, curso_codigo: value });
                        },
                      });
                    }}
                  >
                    <Text style={styles.pickerText}>
                      {materias.find(m => m.codigo === formData.curso_codigo)?.nombre || 'Selecciona una materia'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.inkMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Título */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Título *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Taller de algoritmos"
                  value={formData.titulo}
                  onChangeText={(text) => setFormData({ ...formData, titulo: text })}
                  placeholderTextColor={colors.inkSubtle}
                />
              </View>

              {/* Tipo */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tipo de Tarea *</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => {
                      const tipos = ['taller', 'parcial', 'proyecto', 'lectura', 'exposicion', 'quiz', 'final'];
                      openSelector({
                        title: 'Selecciona tipo',
                        selectedValue: formData.tipo,
                        options: tipos.map((t) => ({
                          value: t,
                          label: t.charAt(0).toUpperCase() + t.slice(1),
                          icon: getTipoIcon(t),
                        })),
                        onSelect: (value) => {
                          setFormData({ ...formData, tipo: value });
                        },
                      });
                    }}
                  >
                    <Text style={styles.pickerText}>
                      {formData.tipo.charAt(0).toUpperCase() + formData.tipo.slice(1)}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.inkMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fecha limite */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fecha limite *</Text>
                <TouchableOpacity
                  style={styles.inputWithIcon}
                  onPress={openDatePicker}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.inkSubtle} />
                  <Text
                    style={[
                      styles.inputText,
                      !formData.fecha_limite && styles.placeholderText,
                    ]}
                  >
                    {formData.fecha_limite || 'Selecciona una fecha'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>Toca para abrir el calendario</Text>
              </View>

              {/* Horas estimadas */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Horas Estimadas (opcional)</Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons name="time-outline" size={20} color={colors.inkSubtle} />
                  <TextInput
                    style={styles.inputFlex}
                    placeholder="4"
                    keyboardType="decimal-pad"
                    value={formData.horas_estimadas}
                    onChangeText={(text) => setFormData({ ...formData, horas_estimadas: text })}
                    placeholderTextColor={colors.inkSubtle}
                  />
                </View>
                <Text style={styles.helperText}>Entre 0.5 y 24 horas</Text>
              </View>

              {/* Dificultad */}
              <View style={styles.inputGroup}>
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
              </View>

              {/* Descripción */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción (Opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Detalles adicionales de la tarea..."
                  multiline
                  numberOfLines={3}
                  value={formData.descripcion}
                  onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                  placeholderTextColor={colors.inkSubtle}
                  textAlignVertical="top"
                />
              </View>

              {/* Resumen */}
              <View style={styles.resumenContainer}>
                <Text style={styles.resumenTitulo}>📋 Resumen</Text>
                <Text style={styles.resumenTexto}>
                  • Materia: {materias.find(m => m.codigo === formData.curso_codigo)?.nombre || 'No seleccionada'}
                </Text>
                <Text style={styles.resumenTexto}>
                  • Fecha límite: {formData.fecha_limite || 'No especificada'}
                </Text>
                <Text style={styles.resumenTexto}>
                  • Horas estimadas: {formData.horas_estimadas || '4'} horas
                </Text>
                <Text style={styles.resumenTexto}>
                  • Dificultad: {formData.dificultad}/5
                </Text>
              </View>
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
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                <Text style={styles.modalButtonTextPrimary}>Crear Tarea</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Selector personalizado */}
      <Modal visible={selectorVisible} animationType="fade" transparent={true}>
        <View style={styles.selectorOverlay}>
          <View style={styles.selectorContainer}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>{selectorConfig.title}</Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <Ionicons name="close" size={22} color={colors.inkMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.selectorList}>
              {selectorConfig.options.length === 0 ? (
                <Text style={styles.selectorEmpty}>Sin opciones disponibles</Text>
              ) : (
                selectorConfig.options.map((option) => {
                  const isSelected = option.value === selectorConfig.selectedValue;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.selectorItem,
                        isSelected && styles.selectorItemActive,
                      ]}
                      onPress={() => {
                        if (selectorConfig.onSelect) {
                          selectorConfig.onSelect(option.value);
                        }
                        setSelectorVisible(false);
                      }}
                    >
                      {option.icon && (
                        <Ionicons
                          name={option.icon}
                          size={18}
                          color={isSelected ? colors.primary : colors.inkMuted}
                          style={styles.selectorIcon}
                        />
                      )}
                      <View style={styles.selectorTextWrap}>
                        <Text
                          style={[
                            styles.selectorItemText,
                            isSelected && styles.selectorItemTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.subtitle && (
                          <Text style={styles.selectorItemSubtext}>{option.subtitle}</Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendario de fecha */}
      <Modal visible={datePickerVisible} animationType="fade" transparent={true}>
        <View style={styles.dateOverlay}>
          <View style={styles.dateContainer}>
            <View style={styles.dateHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Ionicons name="chevron-back" size={22} color={colors.ink} />
              </TouchableOpacity>
              <Text style={styles.dateTitle}>{monthLabel}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Ionicons name="chevron-forward" size={22} color={colors.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const isSelected =
                  day === selectedDate.getDate() &&
                  calendarMonth.getMonth() === selectedDate.getMonth() &&
                  calendarMonth.getFullYear() === selectedDate.getFullYear();

                return (
                  <TouchableOpacity
                    key={`day-${day}-${index}`}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellActive,
                    ]}
                    onPress={() => handleSelectDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.dateFooter}>
              <TouchableOpacity
                style={styles.dateCancel}
                onPress={() => setDatePickerVisible(false)}
              >
                <Text style={styles.dateCancelText}>Cancelar</Text>
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
              <Ionicons name="close" size={28} color={colors.inkMuted} />
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
                    <View style={[styles.progresoFill, { width: `${porcentaje}%` }]} />
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
  container: { flex: 1, backgroundColor: colors.background, position: 'relative' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, position: 'relative' },
  filtrosContainer: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  filtroButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radii.sm, backgroundColor: colors.chip, alignItems: 'center' },
  filtroActivo: { backgroundColor: colors.primary },
  filtroText: { fontSize: 14, fontFamily: fonts.medium, color: colors.inkMuted },
  filtroTextoActivo: { color: colors.surface, fontFamily: fonts.semibold },
  scrollView: { flex: 1, padding: 16 },
  tareaCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.md, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  tareaCompletada: { opacity: 0.6 },
  tareaUrgente: { borderLeftWidth: 4, borderLeftColor: colors.danger },
  checkbox: { marginRight: 12 },
  tareaContent: { flex: 1 },
  tareaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  tareaTitle: { flex: 1, fontSize: 16, fontFamily: fonts.semibold, color: colors.ink },
  tareaCompletadaText: { textDecorationLine: 'line-through', color: colors.inkSubtle },
  tareaCurso: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted, marginBottom: 8 },
  tareaInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tareaTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.chip, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  tareaTagText: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkMuted },
  progresoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  progresoBar: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progresoFill: { height: '100%', backgroundColor: colors.primary },
  progresoText: { fontSize: 12, fontFamily: fonts.semibold, color: colors.inkMuted },
  actualizarButton: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  actualizarButtonText: { fontSize: 14, fontFamily: fonts.medium, color: colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontFamily: fonts.semibold, color: colors.inkMuted, marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkSubtle, marginTop: 8 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadows.float },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 20, fontFamily: fonts.semibold, color: colors.ink },
  modalBody: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontFamily: fonts.medium, color: colors.inkMuted, marginBottom: 8 },
  input: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, padding: 12, fontSize: 16, fontFamily: fonts.regular, color: colors.ink },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, paddingHorizontal: 12, gap: 8 },
  inputFlex: { flex: 1, paddingVertical: 12, fontSize: 16, fontFamily: fonts.regular, color: colors.ink },
  inputText: { flex: 1, paddingVertical: 12, fontSize: 16, fontFamily: fonts.regular, color: colors.ink },
  placeholderText: { color: colors.inkSubtle },
  textArea: { height: 80, textAlignVertical: 'top' },
  helperText: { fontSize: 12, fontFamily: fonts.regular, color: colors.inkMuted, marginTop: 4 },
  pickerContainer: { marginBottom: 0 },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, padding: 12 },
  pickerText: { fontSize: 16, fontFamily: fonts.regular, color: colors.ink },
  dificultadContainer: { flexDirection: 'row', gap: 8 },
  dificultadButton: { flex: 1, padding: 12, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface },
  dificultadActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  dificultadText: { fontSize: 16, fontFamily: fonts.semibold, color: colors.inkMuted },
  dificultadTextoActivo: { color: colors.surface },
  resumenContainer: { backgroundColor: colors.glowSky, borderRadius: radii.sm, padding: 12, marginTop: 8 },
  resumenTitulo: { fontSize: 14, fontFamily: fonts.semibold, color: colors.info, marginBottom: 8 },
  resumenTexto: { fontSize: 13, fontFamily: fonts.regular, color: colors.inkMuted, marginBottom: 4 },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: colors.border },
  modalButton: { flex: 1, flexDirection: 'row', padding: 16, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalButtonSecondary: { backgroundColor: colors.chip },
  modalButtonPrimary: { backgroundColor: colors.primary },
  modalButtonTextSecondary: { fontSize: 16, fontFamily: fonts.medium, color: colors.inkMuted },
  modalButtonTextPrimary: { fontSize: 16, fontFamily: fonts.semibold, color: colors.surface },
  progresoOption: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surfaceAlt, borderRadius: radii.sm, marginBottom: 12, gap: 12 },
  progresoOptionText: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink, width: 50 },
  selectorOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', padding: 20 },
  selectorContainer: { backgroundColor: colors.surface, borderRadius: radii.lg, maxHeight: '70%', overflow: 'hidden', ...shadows.float },
  selectorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  selectorTitle: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink },
  selectorList: { padding: 8 },
  selectorItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radii.sm, gap: 8 },
  selectorItemActive: { backgroundColor: colors.glowSky },
  selectorItemText: { fontSize: 14, fontFamily: fonts.medium, color: colors.ink },
  selectorItemTextActive: { color: colors.primary },
  selectorItemSubtext: { fontSize: 12, fontFamily: fonts.regular, color: colors.inkSubtle, marginTop: 2 },
  selectorTextWrap: { flex: 1 },
  selectorIcon: { marginRight: 4 },
  selectorEmpty: { textAlign: 'center', paddingVertical: 20, color: colors.inkMuted, fontFamily: fonts.medium },
  dateOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', padding: 20 },
  dateContainer: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, ...shadows.float },
  dateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dateTitle: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink, textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weekDay: { width: '14.2%', textAlign: 'center', fontSize: 12, fontFamily: fonts.semibold, color: colors.inkSubtle },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  dayCellActive: { backgroundColor: colors.primary, borderRadius: 20 },
  dayText: { fontSize: 14, fontFamily: fonts.medium, color: colors.ink },
  dayTextActive: { color: colors.surface },
  dateFooter: { marginTop: 12, alignItems: 'flex-end' },
  dateCancel: { paddingVertical: 8, paddingHorizontal: 12 },
  dateCancelText: { fontSize: 14, fontFamily: fonts.semibold, color: colors.inkMuted },
});   
