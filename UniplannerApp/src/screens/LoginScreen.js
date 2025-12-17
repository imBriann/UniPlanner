import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AppBackground from '../components/AppBackground';
import ModernDialog from './ModernDialog';
import { colors, fonts, radii, shadows } from '../theme/tokens';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'error',
    closeText: 'Entendido',
  });

  const {
    login,
    loginWithBiometrics,
    biometricEnabled,
    hasStoredSession,
  } = useAuth();

  useEffect(() => {
    const checkBiometric = async () => {
      if (!biometricEnabled) {
        setBiometricReady(false);
        return;
      }
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricReady(hasHardware && enrolled);
    };

    checkBiometric();
  }, [biometricEnabled, hasStoredSession]);

  const showDialog = ({ title, message, type = 'error', closeText = 'Entendido' }) => {
    setDialogConfig({ title, message, type, closeText });
    setDialogVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showDialog({
        title: 'Datos incompletos',
        message: 'Ingresa tu correo y contrasena para continuar.',
        type: 'warning',
      });
      return;
    }

    if (!email.includes('@')) {
      showDialog({
        title: 'Correo invalido',
        message: 'Ingresa un correo institucional valido.',
        type: 'warning',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);
      if (!result?.success) {
        showDialog({
          title: 'No pudimos iniciar sesion',
          message: result?.error || 'Verifica tus credenciales e intenta de nuevo.',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error en login:', error);
      showDialog({
        title: 'Error de inicio de sesion',
        message: 'Ocurrio un problema inesperado. Intenta de nuevo.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!hasStoredSession) {
      showDialog({
        title: 'Sesion no disponible',
        message: 'Inicia sesion una vez para activar el acceso por huella.',
        type: 'warning',
      });
      return;
    }

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Ingresar con huella',
      fallbackLabel: 'Usar contrasena',
    });

    if (!auth.success) return;

    const result = await loginWithBiometrics();
    if (!result?.success) {
      showDialog({
        title: 'Sesion no disponible',
        message: result?.error || 'No hay una sesion guardada para usar huella.',
        type: 'warning',
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <AppBackground />
        <ModernDialog
          visible={dialogVisible}
          onClose={() => setDialogVisible(false)}
          title={dialogConfig.title}
          message={dialogConfig.message}
          type={dialogConfig.type}
          closeText={dialogConfig.closeText}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="school" size={72} color={colors.primary} />
            </View>
            <Text style={styles.title}>Iniciar sesion</Text>
            <Text style={styles.subtitle}>Universidad de Pamplona</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Acceso estudiantil</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario o correo</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.inkSubtle} />
                <TextInput
                  style={styles.input}
                  placeholder="usuario@unipamplona.edu.co"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  placeholderTextColor={colors.inkSubtle}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contrasena</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.inkSubtle} />
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  placeholderTextColor={colors.inkSubtle}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.inkSubtle}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Text style={styles.buttonText}>Iniciar sesion</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.surface} />
                </>
              )}
            </TouchableOpacity>

            {biometricReady && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.bioButton}
                  onPress={handleBiometricLogin}
                >
                  <Ionicons name="finger-print" size={26} color={colors.primary} />
                  <Text style={styles.bioText}>Ingresar con huella</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => navigation.navigate('RegistroScreen')}
              disabled={loading}
            >
              <Text style={styles.linkText}>
                No tienes cuenta? <Text style={styles.linkTextBold}>Registrate</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...shadows.soft,
  },
  title: {
    fontSize: 26,
    fontFamily: fonts.bold,
    color: colors.ink,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.inkMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.ink,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.inkMuted,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.ink,
  },
  eyeIcon: {
    padding: 6,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...shadows.soft,
  },
  buttonDisabled: {
    backgroundColor: colors.borderStrong,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 15,
    fontFamily: fonts.semibold,
    marginRight: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.inkSubtle,
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    backgroundColor: colors.surfaceAlt,
  },
  bioText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  linkContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  linkTextBold: {
    color: colors.primary,
    fontFamily: fonts.semibold,
  },
});
