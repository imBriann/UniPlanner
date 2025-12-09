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

  useEffect(() => {
    cargarPensum();
  }, []);

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
          
          Alert.alert(
            '🎉 ¡Registro Exitoso!',
            'Tu cuenta ha sido creada. Serás redirigido a la app.',
            [
              {
                text: 'Continuar',
                onPress: () => {
                  // El AuthContext detectará el token y redirigirá automáticamente
                  navigation.navigate('Login');
                }
              }
            ]
          );
        } else {
          Alert.alert(
            '✅ Registro Exitoso',
            'Ahora puedes iniciar sesión',
            [{ text: 'Iniciar Sesión', onPress: () => navigation.navigate('Login') }]
          );
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
    const seleccionada = paso === 1 
      ? materiasAprobadas.includes(materia.codigo)
      : materiasCursando.includes(materia.codigo);

    let puedeSeleccionar = true;
    let razonBloqueo = '';

    if (paso === 2) {
      // Validar créditos requisitos
      const creditosAcumulados = calcularCreditosAprobados();
      if (materia.creditos_requisitos > creditosAcumulados) {
        puedeSeleccionar = false;
        razonBloqueo = `Necesitas ${materia.creditos_requisitos} créditos`;
      }

      // Validar prerequisitos
      const prerequisitosFaltantes = (materia.requisitos || []).filter(
        req => !materiasAprobadas.includes(req)
      );
      if (prerequisitosFaltantes.length > 0 && puedeSeleccionar) {
        puedeSeleccionar = false;
        razonBloqueo = `Faltan ${prerequisitosFaltantes.length} prerequisitos`;
      }

      // 🆕 Validar créditos de libre elección
      if (materia.codigo === '1673961' && creditosLibreSeleccionados >= 19 && !seleccionada) {
        puedeSeleccionar = false;
        razonBloqueo = 'Límite de 19 créditos alcanzado';
      }
    }

    return (
      <TouchableOpacity
        key={materia.codigo}
        style={[
          styles.materiaCard,
          seleccionada && styles.materiaSeleccionada,
          !puedeSeleccionar && paso === 2 && styles.materiaBloqueada,
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
            {seleccionada ? (
              <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
            ) : (
              <Ionicons 
                name={puedeSeleccionar || paso === 1 ? "ellipse-outline" : "lock-closed"} 
                size={24} 
                color={puedeSeleccionar || paso === 1 ? "#D1D5DB" : "#EF4444"} 
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
                <Ionicons name="school-outline" size={12} color="#6B7280" />
                <Text style={styles.badgeText}>{materia.creditos} créd.</Text>
              </View>
              
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Sem. {materia.semestre}</Text>
              </View>

              {materia.requisitos && materia.requisitos.length > 0 && (
                <View style={[styles.badge, !puedeSeleccionar && paso === 2 && styles.badgeBloqueado]}>
                  <Ionicons name="git-branch-outline" size={12} color={!puedeSeleccionar && paso === 2 ? "#EF4444" : "#6B7280"} />
                  <Text style={[styles.badgeText, !puedeSeleccionar && paso === 2 && styles.badgeTextBloqueado]}>
                    {materia.requisitos.length} req.
                  </Text>
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
          <Ionicons name="school" size={20} color="#4F46E5" />
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
        <ActivityIndicator size="large" color="#4F46E5" />
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
          <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
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
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar materia..."
            value={busqueda}
            onChangeText={setBusqueda}
            placeholderTextColor="#9CA3AF"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  header: { backgroundColor: 'white', padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  pasoIndicador: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  pasoDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  pasoDotActivo: { backgroundColor: '#4F46E5' },
  pasoDotText: { fontSize: 14, fontWeight: 'bold', color: '#9CA3AF' },
  pasoDotTextoActivo: { color: 'white' },
  pasoLinea: { width: 60, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 8 },
  pasoLineaActiva: { backgroundColor: '#4F46E5' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  contadorContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignSelf: 'center', marginBottom: 16, gap: 6 },
  contadorTexto: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  creditosTexto: { fontSize: 12, color: '#6B7280' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  scrollView: { flex: 1 },
  semestreContainer: { marginTop: 16, marginHorizontal: 16 },
  semestreHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#E5E7EB' },
  semestreTitulo: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  materiasLista: { gap: 8 },
  materiaCard: { backgroundColor: 'white', borderRadius: 12, padding: 12, borderWidth: 2, borderColor: '#E5E7EB', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  materiaSeleccionada: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  materiaBloqueada: { opacity: 0.5, backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  materiaHeader: { flexDirection: 'row', gap: 12 },
  checkboxContainer: { justifyContent: 'center' },
  materiaInfo: { flex: 1 },
  materiaCodigo: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  materiaNombre: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  materiaFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, gap: 4 },
  badgeBloqueado: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  badgeTextBloqueado: { color: '#EF4444' },
  footer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  saltarButton: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  saltarButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  continuarButton: { flex: 2, flexDirection: 'row', paddingVertical: 16, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', gap: 8 },
  continuarButtonText: { fontSize: 16, fontWeight: '600', color: 'white' },
});