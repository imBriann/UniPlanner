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
import AppBackground from '../components/AppBackground';
import { colors, fonts, radii, shadows } from '../theme/tokens';

// 🆕 COMPONENTE DE DIÁLOGO MODERNO
const ModernDialog = ({ visible, onClose, title, message, type = 'info', onConfirm }) => {
  if (!visible) return null;

  const config = {
    info: { icon: 'information-circle', color: colors.info, bg: colors.glowSky },
    success: { icon: 'checkmark-circle', color: colors.success, bg: colors.glowTeal },
    warning: { icon: 'alert-circle', color: colors.warning, bg: colors.accentSoft },
    error: { icon: 'close-circle', color: colors.danger, bg: `${colors.danger}14` },
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
          <Ionicons name="school-outline" size={14} color={colors.primary} />
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
          <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
          <Text style={styles.cancelarText}>Cancelar</Text>
        </TouchableOpacity>
      )}

      {tipo === 'aprobada' && (
        <View style={styles.aprobadaBadge}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.aprobadaText}>Aprobada</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderContenido = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
              <Ionicons name="book-outline" size={64} color={colors.borderStrong} />
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
              <Ionicons name="trophy-outline" size={64} color={colors.borderStrong} />
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
            <Ionicons name="search" size={20} color={colors.inkSubtle} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChangeText={setBusqueda}
              onSubmitEditing={buscarMaterias}
              placeholderTextColor={colors.inkSubtle}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Ionicons name="close-circle" size={20} color={colors.inkSubtle} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={buscarMaterias}>
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>

          <ScrollView style={styles.resultadosScroll}>
            {resultadosBusqueda.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={64} color={colors.borderStrong} />
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
                        <Ionicons name="school-outline" size={14} color={colors.primary} />
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
                      <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
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
      <AppBackground />
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'actuales' && styles.tabActivo]}
          onPress={() => setTab('actuales')}
        >
          <Ionicons
            name={tab === 'actuales' ? 'book' : 'book-outline'}
            size={20}
            color={tab === 'actuales' ? colors.primary : colors.inkSubtle}
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
            color={tab === 'aprobadas' ? colors.primary : colors.inkSubtle}
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
            color={tab === 'buscar' ? colors.primary : colors.inkSubtle}
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
                  <Ionicons name="close" size={28} color={colors.inkMuted} />
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
  container: { flex: 1, backgroundColor: colors.background, position: 'relative' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  tabsContainer: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  tabActivo: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontFamily: fonts.medium, color: colors.inkSubtle },
  tabTextoActivo: { color: colors.primary, fontFamily: fonts.semibold },
  scrollView: { flex: 1 },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statItem: { flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: radii.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadows.card },
  statNumber: { fontSize: 32, fontFamily: fonts.bold, color: colors.primary },
  statLabel: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkMuted, marginTop: 4, textAlign: 'center' },
  materiasGrid: { padding: 16, gap: 12 },
  materiaCard: { backgroundColor: colors.surface, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  materiaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  semestreBadge: { backgroundColor: colors.glowSky, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  semestreBadgeAprobada: { backgroundColor: colors.glowTeal },
  semestreText: { fontSize: 12, fontFamily: fonts.semibold, color: colors.primary },
  creditosBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.chip, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  creditosText: { fontSize: 12, fontFamily: fonts.semibold, color: colors.primary },
  materiaCode: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkSubtle, marginBottom: 4 },
  materiaNombre: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink, marginBottom: 12 },
  cancelarButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 8 },
  cancelarText: { fontSize: 14, fontFamily: fonts.medium, color: colors.danger },
  inscribirButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 8 },
  inscribirText: { fontSize: 14, fontFamily: fonts.medium, color: colors.primary },
  aprobadaBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 8 },
  aprobadaText: { fontSize: 14, fontFamily: fonts.medium, color: colors.success },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontFamily: fonts.semibold, color: colors.inkMuted, marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkSubtle, marginTop: 8 },
  buscarContainer: { flex: 1, padding: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  searchInput: { flex: 1, fontSize: 16, fontFamily: fonts.regular, color: colors.ink },
  searchButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, alignItems: 'center', marginTop: 12, ...shadows.soft },
  searchButtonText: { color: colors.surface, fontSize: 16, fontFamily: fonts.semibold },
  resultadosScroll: { flex: 1, marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 20, fontFamily: fonts.semibold, color: colors.ink },
  modalBody: { padding: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailHighlight: { backgroundColor: colors.accentSoft, paddingHorizontal: 12, borderRadius: radii.sm, marginVertical: 8 },
  detailLabel: { fontSize: 14, fontFamily: fonts.medium, color: colors.inkMuted },
  detailValue: { fontSize: 14, fontFamily: fonts.semibold, color: colors.ink },
  detailValueHighlight: { color: colors.warning },
  detailSection: { marginTop: 16 },
  detailSectionTitle: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink, marginBottom: 8 },
  requisito: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted, marginBottom: 4 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: 12 },
  modalButtonCancel: { flex: 1, padding: 16, borderRadius: radii.md, backgroundColor: colors.chip, alignItems: 'center' },
  modalButtonTextCancel: { fontSize: 16, fontFamily: fonts.medium, color: colors.inkMuted },
  modalButtonAction: { flex: 1, flexDirection: 'row', padding: 16, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalButtonTextAction: { fontSize: 16, fontFamily: fonts.semibold, color: colors.surface },

  dialogOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialogContainer: { backgroundColor: colors.surface, borderRadius: radii.lg, width: '100%', maxWidth: 400, overflow: 'hidden', ...shadows.float },
  dialogHeader: { padding: 24, alignItems: 'center', gap: 12 },
  dialogTitle: { fontSize: 20, fontFamily: fonts.semibold, color: colors.ink, textAlign: 'center' },
  dialogBody: { padding: 20, paddingTop: 0 },
  dialogMessage: { fontSize: 15, fontFamily: fonts.regular, color: colors.inkMuted, textAlign: 'center', lineHeight: 22 },
  dialogFooter: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: colors.surfaceAlt },
  dialogButtonPrimary: { flex: 1, padding: 14, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center' },
  dialogButtonSecondary: { flex: 1, padding: 14, borderRadius: radii.md, backgroundColor: colors.chip, alignItems: 'center' },
  dialogButtonDanger: { flex: 1, padding: 14, borderRadius: radii.md, backgroundColor: colors.danger, alignItems: 'center' },
  dialogButtonTextPrimary: { fontSize: 16, fontFamily: fonts.semibold, color: colors.surface },
  dialogButtonTextSecondary: { fontSize: 16, fontFamily: fonts.medium, color: colors.inkMuted },
});

