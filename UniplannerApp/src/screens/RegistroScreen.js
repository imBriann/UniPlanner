import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RegistroScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  
  // Estado para el formulario
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    semestre_actual: '',
    tipo_estudio: 'moderado' // Valor por defecto
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleRegistro = () => {
    // 1. Validaciones básicas
    if (!form.nombre || !form.apellido || !form.email || !form.password || !form.semestre_actual) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!form.email.includes('@')) {
      Alert.alert('Error', 'Ingresa un correo válido (ej: usuario@unipamplona.edu.co)');
      return;
    }

    // 2. Ir a la pantalla de selección de materias (OBLIGATORIO)
    navigation.navigate('SeleccionMaterias', {
      userData: form
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="person-add-outline" size={60} color="#4F46E5" />
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete a UniPlanner</Text>
        </View>

        <View style={styles.form}>
          {/* Nombre y Apellido en una fila */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={form.nombre}
                onChangeText={(t) => handleChange('nombre', t)}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                value={form.apellido}
                onChangeText={(t) => handleChange('apellido', t)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email Institucional"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(t) => handleChange('email', t)}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              secureTextEntry
              value={form.password}
              onChangeText={(t) => handleChange('password', t)}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Semestre Actual (ej: 5)"
              keyboardType="numeric"
              value={form.semestre_actual}
              onChangeText={(t) => handleChange('semestre_actual', t)}
            />
          </View>

          <Text style={styles.label}>Intensidad de Estudio:</Text>
          <View style={styles.row}>
            {['leve', 'moderado', 'intensivo'].map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.optionButton,
                  form.tipo_estudio === tipo && styles.optionSelected
                ]}
                onPress={() => handleChange('tipo_estudio', tipo)}
              >
                <Text style={[
                  styles.optionText,
                  form.tipo_estudio === tipo && styles.optionTextSelected
                ]}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Aviso importante */}
          <View style={styles.avisoContainer}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <Text style={styles.avisoTexto}>
              En el siguiente paso deberás seleccionar las materias que has aprobado y las que estás cursando actualmente.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegistro}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkButton}>
            <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  form: { width: '100%' },
  row: { flexDirection: 'row', marginBottom: 16 },
  inputContainer: {
    backgroundColor: 'white', borderRadius: 12, marginBottom: 16,
    paddingHorizontal: 16, height: 50, justifyContent: 'center',
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  input: { fontSize: 16 },
  label: { marginBottom: 8, fontWeight: '600', color: '#374151' },
  optionButton: {
    flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, 
    borderColor: '#D1D5DB', alignItems: 'center', marginHorizontal: 4
  },
  optionSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  optionText: { color: '#6B7280' },
  optionTextSelected: { color: 'white', fontWeight: 'bold' },
  avisoContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  avisoTexto: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#4F46E5', borderRadius: 12, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 24, shadowColor: '#4F46E5', shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, gap: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#4F46E5', fontWeight: '500' }
});