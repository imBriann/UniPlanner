/**
 * MateriasScreen.js - CORREGIDO ✅
 * - Botón cancelar funcional con confirmación moderna
 * - Modal con información completa de materias
 * - Sistema de créditos requisitos visible
 * - Créditos de libre elección integrado
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/client';

// 🆕 COMPONENTE DE DIÁLOGO MODERNO
const ModernDialog = ({ visible, onClose, title, message, type = 'info', onConfirm }) => {
  if (!visible) return null;

  const config = {
    info: { icon: 'information-circle', color: '#3B82F6', bg: '#EFF6FF' },
    success: { icon: 'checkmark-circle', color: '#10B981', bg: '#D1FAE5' },
    warning: { icon: 'alert-circle', color: '#F59E0B', bg: '#FEF3C7' },
    error: { icon: 'close-circle', color: '#EF4444', bg: '#FEE2E2' },
  };

  const { icon, color, bg } = config[type];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogContainer}>
          <View style={[styles.dialogHeader, { backgroundColor: bg }]}>
            <Ionicons name={icon} size={48} color={color} />
            <Text style={styles.dialogTitle}>{title}</Text>
          </View>
          
          <View style={styles.dialogBody}>
            <Text style={styles.dialogMessage}>{message}</Text>
          </View>

          <View style={styles.dialogFooter}>
            {onConfirm ? (
              <>
                <TouchableOpacity style={styles.dialogButtonSecondary} onPress={onClose}>
                  <Text style={styles.dialogButtonTextSecondary}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dialogButtonDanger} onPress={onConfirm}>
                  <Text style={styles.dialogButtonTextPrimary}>Confirmar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.dialogButtonPrimary} onPress={onClose}>
                <Text style={styles.dialogButtonTextPrimary}>Entendido</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function MateriasScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('actuales');
  const [materiasActuales, setMateriasActuales] = useState([]);
  const [materiasAprobadas, setMateriasAprobadas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  
  // 🆕 Estado para diálogo de confirmación
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({});

  useEffect(() => {
    cargarMaterias();
  }, [tab]);

  const cargarMaterias = async () => {
    try {
      setLoading(true);

      if (tab === 'actuales') {
        const response = await api.get('/usuario/materias/actuales');
        setMateriasActuales(response.data.materias || []);
      } else if (tab === 'aprobadas') {
        const response = await api.get('/usuario/materias/aprobadas');
        setMateriasAprobadas(response.data.materias || []);
      }
    } catch (error) {
      console.error('Error cargando materias:', error);
      showDialog('Error', 'No se pudieron cargar las materias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarMaterias();
    setRefreshing(false);
  };

  const buscarMaterias = async () => {
    if (!busqueda.trim()) {
      showDialog('Error', 'Ingresa un término de búsqueda', 'warning');
      return;
    }

    try {
      const response = await api.get(`/cursos/buscar?q=${busqueda}`);
      setResultadosBusqueda(response.data.resultados || []);
    } catch (error) {
      console.error('Error buscando materias:', error);
      showDialog('Error', 'No se pudo realizar la búsqueda', 'error');
    }
  };

  const verDetalles = async (codigo) => {
    try {
      const response = await api.get(`/cursos/${codigo}`);
      setMateriaSeleccionada(response.data);
      setModalVisible(true);
    } catch (error) {
      console.error('Error cargando detalles:', error);
      showDialog('Error', 'No se pudieron cargar los detalles', 'error');
    }
  };

  const inscribirMateria = async (codigo) => {
    try {
      await api.post('/usuario/materias/inscribir', { codigo_materia: codigo });
      showDialog('¡Éxito!', 'Materia inscrita correctamente', 'success');
      setModalVisible(false);
      cargarMaterias();
    } catch (error) {
      console.error('Error inscribiendo materia:', error);
      showDialog('Error', error.response?.data?.error || 'No se pudo inscribir la materia', 'error');
    }
  };

  // 🆕 FUNCIÓN MEJORADA DE CANCELAR MATERIA
  const cancelarMateria = (codigo, nombre) => {
    setDialogConfig({
      title: 'Confirmar Cancelación',
      message: `¿Estás seguro de que deseas cancelar "${nombre}"?\n\nPodrás reactivarla antes de que termine el semestre.`,
      type: 'warning',
      onConfirm: async () => {
        setDialogVisible(false);
        try {
          await api.post('/usuario/materias/cancelar', { codigo_materia: codigo });
          showDialog('Materia Cancelada', 'La materia ha sido cancelada exitosamente', 'success');
          cargarMaterias();
        } catch (error) {
          console.error('Error cancelando materia:', error);
          showDialog('Error', 'No se pudo cancelar la materia', 'error');
        }
      }
    });
    setDialogVisible(true);
  };

  const showDialog = (title, message, type = 'info', onConfirm = null) => {
    setDialogConfig({ title, message, type, onConfirm });
    setDialogVisible(true);
  };

  const renderMateria = (materia, tipo = 'actual') => (
    <TouchableOpacity
      key={materia.codigo}
      style={styles.materiaCard}
      onPress={() => verDetalles(materia.codigo)}
    >
      <View style={styles.materiaHeader}>
        <View style={[styles.semestreBadge, tipo === 'aprobada' && styles.semestreBadgeAprobada]}>
          <Text style={styles.semestreText}>Sem {materia.semestre}</Text>
        </View>
        <View style={styles.creditosBadge}>
          <Ionicons name="school-outline" size={14} color="#4F46E5" />
          <Text style={styles.creditosText}>{materia.creditos} créd.</Text>
        </View>
      </View>

      <Text style={styles.materiaCode}>{materia.codigo}</Text>
      <Text style={styles.materiaNombre}>{materia.nombre}</Text>

      {tipo === 'actual' && (
        <TouchableOpacity
          style={styles.cancelarButton}
          onPress={(e) => {
            e.stopPropagation();
            cancelarMateria(materia.codigo, materia.nombre);
          }}
        >
          <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
          <Text style={styles.cancelarText}>Cancelar</Text>
        </TouchableOpacity>
      )}

      {tipo === 'aprobada' && (
        <View style={styles.aprobadaBadge}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text style={styles.aprobadaText}>Aprobada</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderContenido = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      );
    }

    if (tab === 'actuales') {
      return (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{materiasActuales.length}</Text>
              <Text style={styles.statLabel}>Materias Actuales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {materiasActuales.reduce((sum, m) => sum + m.creditos, 0)}
              </Text>
              <Text style={styles.statLabel}>Créditos Totales</Text>
            </View>
          </View>

          {materiasActuales.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No tienes materias inscritas</Text>
              <Text style={styles.emptySubtext}>Busca materias para inscribirte</Text>
            </View>
          ) : (
            <View style={styles.materiasGrid}>
              {materiasActuales.map((materia) => renderMateria(materia, 'actual'))}
            </View>
          )}
        </ScrollView>
      );
    }

    if (tab === 'aprobadas') {
      return (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{materiasAprobadas.length}</Text>
              <Text style={styles.statLabel}>Materias Aprobadas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {materiasAprobadas.reduce((sum, m) => sum + m.creditos, 0)}
              </Text>
              <Text style={styles.statLabel}>Créditos Acumulados</Text>
            </View>
          </View>

          {materiasAprobadas.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aún no has aprobado materias</Text>
              <Text style={styles.emptySubtext}>¡Sigue adelante!</Text>
            </View>
          ) : (
            <View style={styles.materiasGrid}>
              {materiasAprobadas.map((materia) => renderMateria(materia, 'aprobada'))}
            </View>
          )}
        </ScrollView>
      );
    }

    if (tab === 'buscar') {
      return (
        <View style={styles.buscarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChangeText={setBusqueda}
              onSubmitEditing={buscarMaterias}
              placeholderTextColor="#9CA3AF"
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={buscarMaterias}>
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>

          <ScrollView style={styles.resultadosScroll}>
            {resultadosBusqueda.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>Busca materias del pensum</Text>
                <Text style={styles.emptySubtext}>Escribe el nombre o código de la materia</Text>
              </View>
            ) : (
              <View style={styles.materiasGrid}>
                {resultadosBusqueda.map((materia) => (
                  <TouchableOpacity
                    key={materia.codigo}
                    style={styles.materiaCard}
                    onPress={() => verDetalles(materia.codigo)}
                  >
                    <View style={styles.materiaHeader}>
                      <View style={styles.semestreBadge}>
                        <Text style={styles.semestreText}>Sem {materia.semestre}</Text>
                      </View>
                      <View style={styles.creditosBadge}>
                        <Ionicons name="school-outline" size={14} color="#4F46E5" />
                        <Text style={styles.creditosText}>{materia.creditos} créd.</Text>
                      </View>
                    </View>

                    <Text style={styles.materiaCode}>{materia.codigo}</Text>
                    <Text style={styles.materiaNombre}>{materia.nombre}</Text>

                    <TouchableOpacity
                      style={styles.inscribirButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        inscribirMateria(materia.codigo);
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={18} color="#4F46E5" />
                      <Text style={styles.inscribirText}>Inscribir</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'actuales' && styles.tabActivo]}
          onPress={() => setTab('actuales')}
        >
          <Ionicons
            name={tab === 'actuales' ? 'book' : 'book-outline'}
            size={20}
            color={tab === 'actuales' ? '#4F46E5' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, tab === 'actuales' && styles.tabTextoActivo]}>
            Actuales
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'aprobadas' && styles.tabActivo]}
          onPress={() => setTab('aprobadas')}
        >
          <Ionicons
            name={tab === 'aprobadas' ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={20}
            color={tab === 'aprobadas' ? '#4F46E5' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, tab === 'aprobadas' && styles.tabTextoActivo]}>
            Aprobadas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'buscar' && styles.tabActivo]}
          onPress={() => setTab('buscar')}
        >
          <Ionicons
            name={tab === 'buscar' ? 'search' : 'search-outline'}
            size={20}
            color={tab === 'buscar' ? '#4F46E5' : '#9CA3AF'}
          />
          <Text style={[styles.tabText, tab === 'buscar' && styles.tabTextoActivo]}>
            Buscar
          </Text>
        </TouchableOpacity>
      </View>

      {renderContenido()}

      {/* 🆕 Modal de Detalles Mejorado */}
      {materiaSeleccionada && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detalles de la Materia</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Código:</Text>
                  <Text style={styles.detailValue}>{materiaSeleccionada.codigo}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nombre:</Text>
                  <Text style={styles.detailValue}>{materiaSeleccionada.nombre}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Créditos:</Text>
                  <Text style={styles.detailValue}>{materiaSeleccionada.creditos}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Semestre:</Text>
                  <Text style={styles.detailValue}>{materiaSeleccionada.semestre}</Text>
                </View>

                {/* 🆕 Créditos Requisitos */}
                {materiaSeleccionada.creditos_requisitos > 0 && (
                  <View style={[styles.detailRow, styles.detailHighlight]}>
                    <Text style={styles.detailLabel}>Créditos Requisitos:</Text>
                    <Text style={[styles.detailValue, styles.detailValueHighlight]}>
                      {materiaSeleccionada.creditos_requisitos} créd. requeridos
                    </Text>
                  </View>
                )}

                {materiaSeleccionada.requisitos && materiaSeleccionada.requisitos.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>📋 Requisitos:</Text>
                    {materiaSeleccionada.requisitos.map((req, index) => (
                      <Text key={index} style={styles.requisito}>
                        • {req}
                      </Text>
                    ))}
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonTextCancel}>Cerrar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonAction}
                  onPress={() => {
                    if (materiasActuales.find(m => m.codigo === materiaSeleccionada.codigo)) {
                      // Es una materia actual, mostrar opción de cancelar
                      setModalVisible(false);
                      cancelarMateria(materiaSeleccionada.codigo, materiaSeleccionada.nombre);
                    } else {
                      // No está cursando, inscribir
                      inscribirMateria(materiaSeleccionada.codigo);
                    }
                  }}
                >
                  <Ionicons 
                    name={materiasActuales.find(m => m.codigo === materiaSeleccionada.codigo) ? "close-circle-outline" : "add-circle-outline"} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.modalButtonTextAction}>
                    {materiasActuales.find(m => m.codigo === materiaSeleccionada.codigo) ? 'Cancelar Materia' : 'Inscribir Materia'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 🆕 Diálogo Moderno */}
      <ModernDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        {...dialogConfig}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabsContainer: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  tabActivo: { borderBottomWidth: 2, borderBottomColor: '#4F46E5' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#9CA3AF' },
  tabTextoActivo: { color: '#4F46E5', fontWeight: '600' },
  scrollView: { flex: 1 },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statItem: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#4F46E5' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  materiasGrid: { padding: 16, gap: 12 },
  materiaCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  materiaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  semestreBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  semestreBadgeAprobada: { backgroundColor: '#F0FDF4' },
  semestreText: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },
  creditosBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  creditosText: { fontSize: 12, fontWeight: '600', color: '#4F46E5' },
  materiaCode: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  materiaNombre: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  cancelarButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 8 },
  cancelarText: { fontSize: 14, fontWeight: '500', color: '#EF4444' },
  inscribirButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 8 },
  inscribirText: { fontSize: 14, fontWeight: '500', color: '#4F46E5' },
  aprobadaBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 8 },
  aprobadaText: { fontSize: 14, fontWeight: '500', color: '#10B981' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#6B7280', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  buscarContainer: { flex: 1, padding: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, gap: 12, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16 },
  searchButton: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  searchButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  resultadosScroll: { flex: 1, marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modalBody: { padding: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailHighlight: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, borderRadius: 8, marginVertical: 8 },
  detailLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#1F2937', fontWeight: '600' },
  detailValueHighlight: { color: '#92400E' },
  detailSection: { marginTop: 16 },
  detailSectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  requisito: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row', gap: 12 },
  modalButtonCancel: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  modalButtonTextCancel: { fontSize: 16, fontWeight: '600', color: '#374151' },
  modalButtonAction: { flex: 1, flexDirection: 'row', padding: 16, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalButtonTextAction: { fontSize: 16, fontWeight: '600', color: 'white' },
  
  // 🆕 Estilos del Diálogo Moderno
  dialogOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialogContainer: { backgroundColor: 'white', borderRadius: 20, width: '100%', maxWidth: 400, overflow: 'hidden', elevation: 10 },
  dialogHeader: { padding: 24, alignItems: 'center', gap: 12 },
  dialogTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
  dialogBody: { padding: 20, paddingTop: 0 },
  dialogMessage: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  dialogFooter: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#F9FAFB' },
  dialogButtonPrimary: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center' },
  dialogButtonSecondary: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#E5E7EB', alignItems: 'center' },
  dialogButtonDanger: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center' },
  dialogButtonTextPrimary: { fontSize: 16, fontWeight: '600', color: 'white' },
  dialogButtonTextSecondary: { fontSize: 16, fontWeight: '600', color: '#374151' },
});