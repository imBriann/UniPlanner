import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

export function RegistroScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="person-add" size={80} color="#4F46E5" />
        <Text style={styles.title}>Registro de Usuario</Text>
        <Text style={styles.subtitle}>
          Esta pantalla se implementará en el siguiente paso.
          Aquí podrás registrar tu cuenta con:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Nombre y apellido</Text>
          <Text style={styles.listItem}>• Email institucional</Text>
          <Text style={styles.listItem}>• Contraseña</Text>
          <Text style={styles.listItem}>• Semestre actual</Text>
          <Text style={styles.listItem}>• Tipo de estudio (intensivo/moderado/leve)</Text>
          <Text style={styles.listItem}>• Materias aprobadas</Text>
          <Text style={styles.listItem}>• Materias a cursar</Text>
        </View>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Volver al Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
