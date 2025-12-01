import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export function HomeScreen() {
  const { user } = useAuth();
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="home" size={80} color="#4F46E5" />
        <Text style={styles.title}>¡Bienvenido/a!</Text>
        <Text style={styles.subtitle}>
          {user?.nombre_completo || 'Usuario'}
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Panel Principal</Text>
          <Text style={styles.cardText}>
            Aquí verás:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>📊 Resumen de estadísticas</Text>
            <Text style={styles.listItem}>🎯 Tareas prioritarias</Text>
            <Text style={styles.listItem}>⚠️ Tareas urgentes</Text>
            <Text style={styles.listItem}>📅 Próximos eventos</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
