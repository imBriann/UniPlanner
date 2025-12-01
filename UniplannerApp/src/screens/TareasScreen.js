import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export function TareasScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="checkbox" size={80} color="#4F46E5" />
        <Text style={styles.title}>Mis Tareas</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gestión de Tareas</Text>
          <Text style={styles.cardText}>
            En esta sección podrás:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>✅ Ver todas tus tareas</Text>
            <Text style={styles.listItem}>➕ Crear nuevas tareas</Text>
            <Text style={styles.listItem}>✏️ Editar tareas existentes</Text>
            <Text style={styles.listItem}>🗑️ Eliminar tareas</Text>
            <Text style={styles.listItem}>📊 Actualizar progreso</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
