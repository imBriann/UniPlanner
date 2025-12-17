/**
 * RegistroScreen.js - CORREGIDO ✅
 * - Labels visibles
 * - Contraseña con asteriscos y ojo visible
 * - Auto-login después del registro exitoso
 */

import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../components/AppBackground';
import { colors, fonts, radii, shadows } from '../theme/tokens';

export default function RegistroScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para el formulario
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    semestre_actual: '',
    tipo_estudio: 'moderado'
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleRegistro = () => {
    // Validaciones básicas
    if (!form.nombre || !form.apellido || !form.email || !form.password || !form.semestre_actual) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!form.email.includes('@')) {
      Alert.alert('Error', 'Ingresa un correo válido (ej: usuario@unipamplona.edu.co)');
      return;
    }

    if (form.password.length < 4) {
      Alert.alert('Error', 'La contraseña debe tener al menos 4 caracteres');
      return;
    }

    const semestre = parseInt(form.semestre_actual);
    if (isNaN(semestre) || semestre < 1 || semestre > 10) {
      Alert.alert('Error', 'El semestre debe estar entre 1 y 10');
      return;
    }

    // Ir a la pantalla de selección de materias (OBLIGATORIO)
    navigation.navigate('SeleccionMaterias', {
      userData: form
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AppBackground />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="person-add-outline" size={60} color={colors.primary} />
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete a UniPlanner</Text>
        </View>

        <View style={styles.form}>
          {/* Nombre y Apellido en una fila */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan"
                value={form.nombre}
                onChangeText={(t) => handleChange('nombre', t)}
                placeholderTextColor={colors.inkSubtle}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput
                style={styles.input}
                placeholder="Pérez"
                value={form.apellido}
                onChangeText={(t) => handleChange('apellido', t)}
                placeholderTextColor={colors.inkSubtle}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Institucional</Text>
            <TextInput
              style={styles.input}
              placeholder="usuario@unipamplona.edu.co"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(t) => handleChange('email', t)}
              placeholderTextColor={colors.inkSubtle}
            />
          </View>

          {/* Contraseña con ojo visible */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mínimo 4 caracteres"
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(t) => handleChange('password', t)}
                placeholderTextColor={colors.inkSubtle}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.inkSubtle}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Semestre */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Semestre Actual</Text>
            <TextInput
              style={styles.input}
              placeholder="Ejemplo: 5"
              keyboardType="numeric"
              value={form.semestre_actual}
              onChangeText={(t) => handleChange('semestre_actual', t)}
              placeholderTextColor={colors.inkSubtle}
            />
          </View>

          {/* Intensidad de Estudio */}
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
            <Ionicons name="information-circle" size={24} color={colors.info} />
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
  container: { flex: 1, backgroundColor: colors.background, position: 'relative' },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontFamily: fonts.bold, color: colors.ink, marginTop: 10 },
  subtitle: { fontSize: 16, fontFamily: fonts.medium, color: colors.inkMuted },
  form: { width: '100%' },
  row: { flexDirection: 'row', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { 
    fontSize: 14, 
    fontFamily: fonts.medium, 
    color: colors.inkMuted, 
    marginBottom: 8 
  },
  input: {
    backgroundColor: colors.surface, 
    borderRadius: radii.md, 
    paddingHorizontal: 16, 
    height: 50, 
    borderWidth: 1, 
    borderColor: colors.border,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.ink
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 50,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.ink,
  },
  eyeButton: {
    padding: 4,
  },
  optionButton: {
    flex: 1, 
    padding: 10, 
    borderRadius: radii.sm, 
    borderWidth: 1, 
    borderColor: colors.borderStrong, 
    alignItems: 'center', 
    marginHorizontal: 4,
    backgroundColor: colors.surface,
  },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.inkMuted, fontFamily: fonts.medium },
  optionTextSelected: { color: colors.surface, fontFamily: fonts.semibold },
  avisoContainer: {
    flexDirection: 'row',
    backgroundColor: colors.glowSky,
    padding: 12,
    borderRadius: radii.sm,
    marginBottom: 16,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  button: {
    backgroundColor: colors.primary, 
    borderRadius: radii.md, 
    height: 56,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 24, 
    ...shadows.soft,
    gap: 8,
  },
  buttonText: { color: colors.surface, fontSize: 16, fontFamily: fonts.semibold },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: colors.primary, fontFamily: fonts.medium }
});
