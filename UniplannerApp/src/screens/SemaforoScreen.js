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

export default function SemaforoScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pensum, setPensum] = useState({}); // Materias agrupadas por semestre
  const [materiasAprobadas, setMateriasAprobadas] = useState([]);
  const [materiasCursando, setMateriasCursando] = useState([]);
  const [estadoMaterias, setEstadoMaterias] = useState({}); // Estado de cada materia

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar todo el pensum
      const pensumResponse = await api.get('/cursos');
      const todasMaterias = pensumResponse.data.cursos || [];

      // Agrupar por semestre
      const agrupadasPorSemestre = todasMaterias.reduce((acc, materia) => {
        if (!acc[materia.semestre]) {
          acc[materia.semestre] = [];
        }
        acc[materia.semestre].push(materia);
        return acc;
      }, {});

      setPensum(agrupadasPorSemestre);

      // Cargar materias del usuario
      const aprobadasResponse = await api.get('/usuario/materias/aprobadas');
      const aprobadas = aprobadasResponse.data.materias || [];
      setMateriasAprobadas(aprobadas.map(m => m.codigo));

      const cursandoResponse = await api.get('/usuario/materias/actuales');
      const cursando = cursandoResponse.data.materias || [];
      setMateriasCursando(cursando.map(m => m.codigo));

      // Calcular estado de cada materia
      calcularEstadoMaterias(todasMaterias, aprobadas.map(m => m.codigo), cursando.map(m => m.codigo));

    } catch (error) {
      console.error('Error cargando datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del pensum');
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadoMaterias = (todasMaterias, aprobadas, cursando) => {
    const estados = {};

    todasMaterias.forEach(materia => {
      if (aprobadas.includes(materia.codigo)) {
        // Materia aprobada
        estados[materia.codigo] = {
          estado: 'aprobada',
          color: '#10B981',
          icon: 'checkmark-circle',
          puede_cursar: false,
          razon: 'Ya aprobada'
        };
      } else if (cursando.includes(materia.codigo)) {
        // Materia cursando
        estados[materia.codigo] = {
          estado: 'cursando',
          color: '#3B82F6',
          icon: 'sync-circle',
          puede_cursar: false,
          razon: 'Cursando actualmente'
        };
      } else {
        // Verificar si puede cursar (tiene todos los prerequisitos)
        const requisitos = materia.requisitos || [];
        const prerequisitosFaltantes = requisitos.filter(req => !aprobadas.includes(req));

        if (prerequisitosFaltantes.length === 0) {
          // Puede cursar
          estados[materia.codigo] = {
            estado: 'disponible',
            color: '#F59E0B',
            icon: 'alert-circle',
            puede_cursar: true,
            razon: 'Disponible para cursar'
          };
        } else {
          // Bloqueada por prerequisitos
          estados[materia.codigo] = {
            estado: 'bloqueada',
            color: '#EF4444',
            icon: 'lock-closed',
            puede_cursar: false,
            razon: 'Faltan prerequisitos',
            prerequisitosFaltantes
          };
        }
      }
    });

    setEstadoMaterias(estados);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const verDetallesMateria = (materia) => {
    const estado = estadoMaterias[materia.codigo];
    
    let mensaje = `📚 ${materia.nombre}\n\n`;
    mensaje += `🔢 Código: ${materia.codigo}\n`;
    mensaje += `⭐ Créditos: ${materia.creditos}\n`;
    mensaje += `📅 Semestre: ${materia.semestre}\n\n`;

    // Estado actual
    mensaje += `🚦 Estado: ${estado.razon}\n\n`;

    // Prerequisitos
    if (materia.requisitos && materia.requisitos.length > 0) {
      mensaje += `📋 Prerequisitos:\n`;
      materia.requisitos.forEach(req => {
        const reqMateria = Object.values(pensum).flat().find(m => m.codigo === req);
        const aprobado = materiasAprobadas.includes(req);
        const icono = aprobado ? '✅' : '❌';
        mensaje += `${icono} ${reqMateria?.nombre || req}\n`;
      });
    } else {
      mensaje += `✨ No tiene prerequisitos`;
    }

    Alert.alert('Detalles de la Materia', mensaje, [
      { text: 'Cerrar', style: 'cancel' },
    ]);
  };

  const renderMateria = (materia) => {
    const estado = estadoMaterias[materia.codigo] || { color: '#9CA3AF', icon: 'help-circle' };

    return (
      <TouchableOpacity
        key={materia.codigo}
        style={[styles.materiaCard, { borderLeftColor: estado.color, borderLeftWidth: 4 }]}
        onPress={() => verDetallesMateria(materia)}
      >
        <View style={styles.materiaHeader}>
          <View style={[styles.estadoIcon, { backgroundColor: estado.color + '20' }]}>
            <Ionicons name={estado.icon} size={20} color={estado.color} />
          </View>
          
          <View style={styles.materiaInfo}>
            <Text style={styles.materiaCodigo}>{materia.codigo}</Text>
            <Text style={styles.materiaNombre} numberOfLines={2}>
              {materia.nombre}
            </Text>
            
            <View style={styles.materiaFooter}>
              <View style={styles.creditosBadge}>
                <Ionicons name="school-outline" size={12} color="#6B7280" />
                <Text style={styles.creditosText}>{materia.creditos} créd.</Text>
              </View>

              {materia.requisitos && materia.requisitos.length > 0 && (
                <View style={styles.prerequisitosBadge}>
                  <Ionicons name="git-branch-outline" size={12} color="#6B7280" />
                  <Text style={styles.prerequisitosText}>
                    {materia.requisitos.length} req.
                  </Text>
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
    
    // Calcular estadísticas del semestre
    const aprobadas = materias.filter(m => materiasAprobadas.includes(m.codigo)).length;
    const cursando = materias.filter(m => materiasCursando.includes(m.codigo)).length;
    const disponibles = materias.filter(m => 
      estadoMaterias[m.codigo]?.estado === 'disponible'
    ).length;

    return (
      <View key={semestre} style={styles.semestreContainer}>
        <View style={styles.semestreHeader}>
          <View style={styles.semestreTitleContainer}>
            <Ionicons name="school" size={24} color="#4F46E5" />
            <Text style={styles.semestreTitulo}>Semestre {semestre}</Text>
          </View>

          <View style={styles.semestreStats}>
            <View style={styles.statChip}>
              <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statText}>{aprobadas}</Text>
            </View>
            <View style={styles.statChip}>
              <View style={[styles.statDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.statText}>{cursando}</Text>
            </View>
            <View style={styles.statChip}>
              <View style={[styles.statDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.statText}>{disponibles}</Text>
            </View>
          </View>
        </View>

        <View style={styles.materiasGrid}>
          {materias.map(renderMateria)}
        </View>
      </View>
    );
  };

  const calcularProgreso = () => {
    const totalMaterias = Object.values(pensum).flat().length;
    const aprobadasCount = materiasAprobadas.length;
    return totalMaterias > 0 ? ((aprobadasCount / totalMaterias) * 100).toFixed(1) : 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Cargando pensum...</Text>
      </View>
    );
  }

  const progreso = calcularProgreso();

  return (
    <View style={styles.container}>
      {/* Leyenda del Semáforo */}
      <View style={styles.leyendaContainer}>
        <Text style={styles.leyendaTitulo}>🚦 Semáforo Estudiante</Text>
        
        <View style={styles.leyendaGrid}>
          <View style={styles.leyendaItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.leyendaTexto}>Aprobada</Text>
          </View>
          
          <View style={styles.leyendaItem}>
            <Ionicons name="sync-circle" size={20} color="#3B82F6" />
            <Text style={styles.leyendaTexto}>Cursando</Text>
          </View>
          
          <View style={styles.leyendaItem}>
            <Ionicons name="alert-circle" size={20} color="#F59E0B" />
            <Text style={styles.leyendaTexto}>Disponible</Text>
          </View>
          
          <View style={styles.leyendaItem}>
            <Ionicons name="lock-closed" size={20} color="#EF4444" />
            <Text style={styles.leyendaTexto}>Bloqueada</Text>
          </View>
        </View>

        {/* Barra de Progreso Global */}
        <View style={styles.progresoGlobal}>
          <View style={styles.progresoHeader}>
            <Text style={styles.progresoLabel}>Progreso de Carrera</Text>
            <Text style={styles.progresoPorcentaje}>{progreso}%</Text>
          </View>
          <View style={styles.progresoBar}>
            <View style={[styles.progresoFill, { width: `${progreso}%` }]} />
          </View>
          <Text style={styles.progresoInfo}>
            {materiasAprobadas.length} de {Object.values(pensum).flat().length} materias
          </Text>
        </View>
      </View>

      {/* Lista de Semestres */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {Object.keys(pensum).sort((a, b) => parseInt(a) - parseInt(b)).map(renderSemestre)}
        <View style={{ height: 20 }} />
      </ScrollView>
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  leyendaContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  leyendaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  leyendaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  leyendaTexto: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  progresoGlobal: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  progresoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progresoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progresoPorcentaje: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  progresoBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progresoFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
  },
  progresoInfo: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  semestreContainer: {
    marginBottom: 16,
  },
  semestreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EEF2FF',
  },
  semestreTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  semestreTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  semestreStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  materiasGrid: {
    padding: 12,
    gap: 8,
  },
  materiaCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  materiaHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  estadoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materiaInfo: {
    flex: 1,
  },
  materiaCodigo: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  materiaNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  materiaFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  creditosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  creditosText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  prerequisitosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  prerequisitosText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
});