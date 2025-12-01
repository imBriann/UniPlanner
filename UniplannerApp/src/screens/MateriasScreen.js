import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export function MateriasScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="book" size={80} color="#4F46E5" />
        <Text style={styles.title}>Mis Materias</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gestión de Materias</Text>
          <Text style={styles.cardText}>
            Administra tus materias:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>📚 Ver materias actuales</Text>
            <Text style={styles.listItem}>✅ Ver materias aprobadas</Text>
            <Text style={styles.listItem}>➕ Inscribir nuevas materias</Text>
            <Text style={styles.listItem}>❌ Cancelar materias</Text>
            <Text style={styles.listItem}>🔍 Buscar materias del pensum</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
