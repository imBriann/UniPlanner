import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export function CalendarioScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="calendar" size={80} color="#4F46E5" />
        <Text style={styles.title}>Calendario</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calendario Académico</Text>
          <Text style={styles.cardText}>
            Verás dos calendarios:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>📅 Calendario Institucional</Text>
            <Text style={styles.listItem}>   - Parciales y finales</Text>
            <Text style={styles.listItem}>   - Fechas de cancelación</Text>
            <Text style={styles.listItem}>   - Festivos</Text>
            <Text style={styles.listItem}>📝 Calendario Personal</Text>
            <Text style={styles.listItem}>   - Tus tareas por fecha</Text>
            <Text style={styles.listItem}>   - Vencimientos próximos</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
