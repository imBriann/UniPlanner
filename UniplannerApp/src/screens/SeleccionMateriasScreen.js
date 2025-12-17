/**
 * SeleccionMateriasScreen.js - CORREGIDO ✅
 * - Pre-selección automática basada en semestre
 * - Validación de créditos requisitos
 * - Sistema de créditos de libre elección (19 créditos)
 * - Auto-login después del registro exitoso
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { saveToken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import AppBackground from '../components/AppBackground';
import ModernDialog from './ModernDialog';
import { colors, fonts, radii, shadows } from '../theme/tokens';

export default function SeleccionMateriasScreen({ route, navigation }) {
  const { userData } = route.params;
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [pensum, setPensum] = useState({});
  const [busqueda, setBusqueda] = useState('');
  
  const [materiasAprobadas, setMateriasAprobadas] = useState([]);
  const [materiasCursando, setMateriasCursando] = useState([]);
  const [creditosLibreSeleccionados, setCreditosLibreSeleccionados] = useState(0);
  
  const [paso, setPaso] = useState(1);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'success',
    closeText: 'Entendido',
    onClose: null,
  });

  useEffect(() => {
    cargarPensum();
  }, []);

  const showDialog = ({
    title,
    message,
    type = 'info',
    closeText = 'Entendido',
    onClose = null,
  }) => {
    setDialogConfig({
      title,
      message,
      type,
      closeText,
      onClose,
    });
    setDialogVisible(true);
  };

  const cargarPensum = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cursos');
      const materias = response.data.cursos || [];
      
      // Agrupar por semestre
      const agrupadasPorSemestre = materias.reduce((acc, materia) => {
        if (!acc[materia.semestre]) {
          acc[materia.semestre] = [];
        }
        acc[materia.semestre].push(materia);
        return acc;
      }, {});
      
      setPensum(agrupadasPorSemestre);
      
      // 🆕 PRE-SELECCIÓN AUTOMÁTICA basada en el semestre del usuario
      preseleccionarMaterias(agrupadasPorSemestre, parseInt(userData.semestre_actual));
      
    } catch (error) {
      console.error('Error cargando pensum:', error);
      Alert.alert('Error', 'No se pudo cargar el pensum');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 FUNCIÓN DE PRE-SELECCIÓN INTELIGENTE
  const preseleccionarMaterias = (pensumData, semestreActual) => {
    const materiasAPreseleccionar = [];
    
    // Si el semestre actual es > 10, preseleccionar hasta el 9
    const semestreLimite = semestreActual > 10 ? 9 : semestreActual - 1;
    
    // Preseleccionar todas las materias hasta el semestre anterior al actual
    for (let sem = 1; sem <= semestreLimite; sem++) {
      const materiasSemestre = pensumData[sem] || [];
      materiasSemestre.forEach(materia => {
        // No preseleccionar créditos de libre elección
        if (!materia.codigo.includes('1673961')) {
          materiasAPreseleccionar.push(materia.codigo);
        }
      });
    }
    
    setMateriasAprobadas(materiasAPreseleccionar);
  };

  const toggleMateriaAprobada = (codigo) => {
    if (materiasAprobadas.includes(codigo)) {
      setMateriasAprobadas(materiasAprobadas.filter(c => c !== codigo));
    } else {
      setMateriasAprobadas([...materiasAprobadas, codigo]);
    }
  };

  const toggleMateriaCursando = (codigo, materia) => {
    if (materiasAprobadas.includes(codigo)) {
      return;
    }
    // 🆕 VALIDACIÓN DE CRÉDITOS REQUISITOS
    const creditosAcumulados = calcularCreditosAprobados();
    
    if (materia.creditos_requisitos > creditosAcumulados) {
      Alert.alert(
        '⚠️ Créditos Insuficientes',
        `Necesitas ${materia.creditos_requisitos} créditos aprobados para cursar esta materia.\n\nActualmente tienes: ${creditosAcumulados} créditos.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Verificar prerequisitos
    const prerequisitosFaltantes = (materia.requisitos || []).filter(
      req => !materiasAprobadas.includes(req)
    );

    if (prerequisitosFaltantes.length > 0) {
      const nombresFaltantes = prerequisitosFaltantes.map(req => {
        const materiaReq = Object.values(pensum).flat().find(m => m.codigo === req);
        return materiaReq?.nombre || req;
      }).join('\n• ');

      Alert.alert(
        '⚠️ Prerequisitos Faltantes',
        `Te faltan los siguientes prerequisitos:\n\n• ${nombresFaltantes}`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    // 🆕 VALIDACIÓN DE CRÉDITOS DE LIBRE ELECCIÓN
    if (materia.codigo === '1673961') {
      if (materiasCursando.includes(codigo)) {
        // Deseleccionar
        setMateriasCursando(materiasCursando.filter(c => c !== codigo));
        setCreditosLibreSeleccionados(prev => prev - 3);
      } else {
        // Verificar si ya completó los 19 créditos
        const totalCreditos = creditosLibreSeleccionados + 3;
        if (totalCreditos > 19) {
          Alert.alert(
            '⚠️ Límite de Créditos de Libre Elección',
            `Solo puedes cursar hasta 19 créditos de libre elección.\n\nActualmente tienes: ${creditosLibreSeleccionados} créditos seleccionados.`,
            [{ text: 'Entendido' }]
          );
          return;
        }
        setMateriasCursando([...materiasCursando, codigo]);
        setCreditosLibreSeleccionados(totalCreditos);
      }
    } else {
      // Materia normal
      if (materiasCursando.includes(codigo)) {
        setMateriasCursando(materiasCursando.filter(c => c !== codigo));
      } else {
        setMateriasCursando([...materiasCursando, codigo]);
      }
    }
  };

  const calcularCreditosAprobados = () => {
    return materiasAprobadas.reduce((total, codigo) => {
      const materia = Object.values(pensum).flat().find(m => m.codigo === codigo);
      return total + (materia?.creditos || 0);
    }, 0);
  };

  const validarYContinuar = () => {
    if (paso === 1) {
      setPaso(2);
    } else {
      finalizarRegistro();
    }
  };

  const finalizarRegistro = async () => {
    try {
      setLoading(true);

      const datosCompletos = {
        ...userData,
        materias_aprobadas: materiasAprobadas,
        materias_cursando: materiasCursando,
      };

      const response = await api.post('/auth/registro', datosCompletos);

      if (response.status === 201 && response.data.success) {
        // 🆕 AUTO-LOGIN después del registro exitoso
        const token = response.data.token;
        
        if (token) {
          await saveToken(token);
          await SecureStore.setItemAsync('user_data', JSON.stringify(response.data.usuario));
          
          showDialog({
            title: 'Registro exitoso',
            message: 'Tu cuenta ha sido creada. Seras redirigido a la app.',
            type: 'success',
            closeText: 'Continuar',
            onClose: () => {
              // El AuthContext detectara el token y redirigira automaticamente
              navigation.navigate('Login');
            },
          });
        } else {
          showDialog({
            title: 'Registro exitoso',
            message: 'Ahora puedes iniciar sesion.',
            type: 'success',
            closeText: 'Iniciar sesion',
            onClose: () => navigation.navigate('Login'),
          });
        }
      }
    } catch (error) {
      console.error('Error en registro:', error);
      Alert.alert('Error', error.response?.data?.error || 'Ocurrió un error al crear tu cuenta');
    } finally {
      setLoading(false);
    }
  };

  const saltarPaso = () => {
    if (paso === 1) {
      Alert.alert(
        'Saltar paso',
        '¿No has aprobado ninguna materia todavía?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sí, continuar', onPress: () => setPaso(2) }
        ]
      );
    } else {
      Alert.alert(
        'Saltar paso',
        '¿No estás cursando ninguna materia este semestre?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sí, finalizar', onPress: finalizarRegistro }
        ]
      );
    }
  };

  const renderMateria = (materia) => {
    const yaAprobada = materiasAprobadas.includes(materia.codigo);
    const seleccionada = paso === 1
      ? yaAprobada
      : materiasCursando.includes(materia.codigo);

    let puedeSeleccionar = true;
    let razonBloqueo = '';
    const esAprobada = paso === 2 && yaAprobada;

    if (esAprobada) {
      puedeSeleccionar = false;
    } else if (paso === 2) {
      // Validar cr?ditos requisitos
      const creditosAcumulados = calcularCreditosAprobados();
      if (materia.creditos_requisitos > creditosAcumulados) {
        puedeSeleccionar = false;
        razonBloqueo = `Necesitas ${materia.creditos_requisitos} cr?ditos`;
      }

      // Validar prerequisitos
      const prerequisitosFaltantes = (materia.requisitos || []).filter(
        req => !materiasAprobadas.includes(req)
      );
      if (prerequisitosFaltantes.length > 0 && puedeSeleccionar) {
        puedeSeleccionar = false;
        razonBloqueo = `Faltan ${prerequisitosFaltantes.length} prerequisitos`;
      }

      // Validar creditos de libre eleccion
      if (materia.codigo === '1673961' && creditosLibreSeleccionados >= 19 && !seleccionada) {
        puedeSeleccionar = false;
        razonBloqueo = 'Limite de 19 creditos alcanzado';
      }
    }

    return (
      <TouchableOpacity
        key={materia.codigo}
        style={[
          styles.materiaCard,
          seleccionada && styles.materiaSeleccionada,
          esAprobada && styles.materiaAprobada,
          !puedeSeleccionar && paso === 2 && !esAprobada && styles.materiaBloqueada,
        ]}
        onPress={() => {
          if (paso === 1) {
            toggleMateriaAprobada(materia.codigo);
          } else {
            toggleMateriaCursando(materia.codigo, materia);
          }
        }}
        disabled={!puedeSeleccionar && paso === 2}
      >
        <View style={styles.materiaHeader}>
          <View style={styles.checkboxContainer}>
            {seleccionada || esAprobada ? (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={esAprobada ? colors.success : colors.primary}
              />
            ) : (
              <Ionicons 
                name={puedeSeleccionar || paso === 1 ? "ellipse-outline" : "lock-closed"} 
                size={24} 
                color={puedeSeleccionar || paso === 1 ? colors.borderStrong : colors.danger} 
              />
            )}
          </View>

          <View style={styles.materiaInfo}>
            <Text style={styles.materiaCodigo}>{materia.codigo}</Text>
            <Text style={styles.materiaNombre} numberOfLines={2}>
              {materia.nombre}
            </Text>
            
            <View style={styles.materiaFooter}>
              <View style={styles.badge}>
                <Ionicons name="school-outline" size={12} color={colors.inkMuted} />
                <Text style={styles.badgeText}>{materia.creditos} cr?ditos</Text>
              </View>
              
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Sem. {materia.semestre}</Text>
              </View>

              {materia.requisitos && materia.requisitos.length > 0 && (
                <View style={styles.badge}>
                  <Ionicons
                    name="git-branch-outline"
                    size={12}
                    color={!puedeSeleccionar && paso === 2 ? colors.danger : colors.inkMuted}
                  />
                  <Text style={styles.badgeText}>{materia.requisitos.length} req.</Text>
                </View>
              )}

              {esAprobada && (
                <View style={[styles.badge, styles.badgeAprobada]}>
                  <Ionicons name="checkmark" size={12} color={colors.success} />
                  <Text style={styles.badgeTextAprobada}>Aprobada</Text>
                </View>
              )}

              {!puedeSeleccionar && paso === 2 && (
                <View style={[styles.badge, styles.badgeBloqueado]}>
                  <Text style={styles.badgeTextBloqueado}>{razonBloqueo}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSemestre = (semestre) => {
    const materias = pensum[semestre] || [];
    
    const materiasFiltradas = busqueda.trim() === ''
      ? materias
      : materias.filter(m => 
          m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          m.codigo.toLowerCase().includes(busqueda.toLowerCase())
        );

    if (materiasFiltradas.length === 0) return null;

    return (
      <View key={semestre} style={styles.semestreContainer}>
        <View style={styles.semestreHeader}>
          <Ionicons name="school" size={20} color={colors.primary} />
          <Text style={styles.semestreTitulo}>Semestre {semestre}</Text>
        </View>
        
        <View style={styles.materiasLista}>
          {materiasFiltradas.map(renderMateria)}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {paso === 1 ? 'Cargando pensum...' : 'Finalizando registro...'}
        </Text>
      </View>
    );
  }

  const seleccionadas = paso === 1 ? materiasAprobadas.length : materiasCursando.length;
  const creditosAprobados = calcularCreditosAprobados();

  return (
    <View style={styles.container}>
      <AppBackground />
      <ModernDialog
        visible={dialogVisible}
        onClose={() => {
          setDialogVisible(false);
          if (dialogConfig.onClose) {
            dialogConfig.onClose();
          }
        }}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        closeText={dialogConfig.closeText}
      />
      <View style={styles.header}>
        <View style={styles.pasoIndicador}>
          <View style={[styles.pasoDot, paso >= 1 && styles.pasoDotActivo]}>
            <Text style={[styles.pasoDotText, paso >= 1 && styles.pasoDotTextoActivo]}>1</Text>
          </View>
          <View style={[styles.pasoLinea, paso >= 2 && styles.pasoLineaActiva]} />
          <View style={[styles.pasoDot, paso >= 2 && styles.pasoDotActivo]}>
            <Text style={[styles.pasoDotText, paso >= 2 && styles.pasoDotTextoActivo]}>2</Text>
          </View>
        </View>

        <Text style={styles.titulo}>
          {paso === 1 ? '📚 Materias Aprobadas' : '📖 Materias Cursando'}
        </Text>
        <Text style={styles.subtitulo}>
          {paso === 1 
            ? 'Selecciona las materias que ya has aprobado'
            : 'Selecciona las materias que estás cursando este semestre'
          }
        </Text>

        <View style={styles.contadorContainer}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          <Text style={styles.contadorTexto}>
            {seleccionadas} {paso === 1 ? 'aprobadas' : 'cursando'}
          </Text>
          {paso === 1 && (
            <Text style={styles.creditosTexto}>• {creditosAprobados} créditos</Text>
          )}
          {paso === 2 && creditosLibreSeleccionados > 0 && (
            <Text style={styles.creditosTexto}>• {creditosLibreSeleccionados}/19 créd. libre</Text>
          )}
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.inkSubtle} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar materia..."
            value={busqueda}
            onChangeText={setBusqueda}
            placeholderTextColor={colors.inkSubtle}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={20} color={colors.inkSubtle} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {Object.keys(pensum)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(renderSemestre)}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saltarButton} onPress={saltarPaso}>
          <Text style={styles.saltarButtonText}>Saltar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continuarButton} onPress={validarYContinuar}>
          <Text style={styles.continuarButtonText}>
            {paso === 1 ? 'Continuar' : 'Finalizar Registro'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, position: 'relative' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 12, color: colors.inkMuted, fontSize: 14, fontFamily: fonts.medium },
  header: { backgroundColor: colors.surface, padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  pasoIndicador: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  pasoDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  pasoDotActivo: { backgroundColor: colors.primary },
  pasoDotText: { fontSize: 14, fontFamily: fonts.semibold, color: colors.inkSubtle },
  pasoDotTextoActivo: { color: colors.surface },
  pasoLinea: { width: 60, height: 2, backgroundColor: colors.border, marginHorizontal: 8 },
  pasoLineaActiva: { backgroundColor: colors.primary },
  titulo: { fontSize: 24, fontFamily: fonts.bold, color: colors.ink, marginBottom: 8, textAlign: 'center' },
  subtitulo: { fontSize: 14, fontFamily: fonts.regular, color: colors.inkMuted, textAlign: 'center', marginBottom: 16 },
  contadorContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.glowSky, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignSelf: 'center', marginBottom: 16, gap: 6, borderWidth: 1, borderColor: colors.border },
  contadorTexto: { fontSize: 14, fontFamily: fonts.semibold, color: colors.primary },
  creditosTexto: { fontSize: 12, fontFamily: fonts.medium, color: colors.inkMuted },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 16, fontFamily: fonts.regular, color: colors.ink },
  scrollView: { flex: 1 },
  semestreContainer: { marginTop: 16, marginHorizontal: 16 },
  semestreHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: colors.borderStrong },
  semestreTitulo: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink },
  materiasLista: { gap: 8 },
  materiaCard: { backgroundColor: colors.surface, borderRadius: radii.md, padding: 12, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  materiaSeleccionada: { borderColor: colors.primary, backgroundColor: colors.glowSky },
  materiaAprobada: { borderColor: colors.success, backgroundColor: colors.glowTeal },
  materiaBloqueada: { opacity: 0.7, backgroundColor: `${colors.danger}14`, borderColor: colors.danger },
  materiaHeader: { flexDirection: 'row', gap: 12 },
  checkboxContainer: { justifyContent: 'center' },
  materiaInfo: { flex: 1 },
  materiaCodigo: { fontSize: 11, fontFamily: fonts.medium, color: colors.inkSubtle, marginBottom: 2 },
  materiaNombre: { fontSize: 14, fontFamily: fonts.semibold, color: colors.ink, marginBottom: 8 },
  materiaFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.chip, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  badgeAprobada: { backgroundColor: `${colors.success}14` },
  badgeBloqueado: { backgroundColor: `${colors.danger}14` },
  badgeText: { fontSize: 11, fontFamily: fonts.medium, color: colors.inkMuted },
  badgeTextAprobada: { fontSize: 11, fontFamily: fonts.medium, color: colors.success },
  badgeTextBloqueado: { color: colors.danger, fontFamily: fonts.medium },
  footer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  saltarButton: { flex: 1, paddingVertical: 16, borderRadius: radii.md, backgroundColor: colors.chip, alignItems: 'center' },
  saltarButtonText: { fontSize: 16, fontFamily: fonts.medium, color: colors.inkMuted },
  continuarButton: { flex: 2, flexDirection: 'row', paddingVertical: 16, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 8, ...shadows.soft },
  continuarButtonText: { fontSize: 16, fontFamily: fonts.semibold, color: colors.surface },
});
