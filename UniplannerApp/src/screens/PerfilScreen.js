import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export function PerfilScreen() {
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="white" />
          </View>
          <Text style={styles.profileName}>{user?.nombre_completo}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información Académica</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Semestre:</Text>
            <Text style={styles.infoValue}>{user?.semestre_actual}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo de estudio:</Text>
            <Text style={styles.infoValue}>{user?.tipo_estudio}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Carrera:</Text>
            <Text style={styles.infoValue}>{user?.carrera}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
