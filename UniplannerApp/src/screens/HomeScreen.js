import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user, logout } = useAuth(); // Usamos logout del contexto

  return (
    <View style={styles.container}>
      <Ionicons name="school-outline" size={80} color="#4F46E5" />
      <Text style={styles.title}>¡Hola, {user?.nombre}!</Text>
      <Text style={styles.subtitle}>Bienvenido a tu UniPlanner</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardText}>Aquí verás tus recomendaciones inteligentes pronto.</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, color: '#1F2937' },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 30 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 30, elevation: 2 },
  cardText: { color: '#4B5563' },
  button: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: 'bold' }
});