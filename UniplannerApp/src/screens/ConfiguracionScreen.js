import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import AppBackground from '../components/AppBackground';
import ModernDialog from './ModernDialog';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  ensureNotificationPermissions,
  ensureSuggestionNotification,
  clearNotificationGroup,
} from '../utils/notifications';
import { colors, fonts, radii, shadows } from '../theme/tokens';

export default function ConfiguracionScreen() {
  const { user, biometricEnabled, setBiometricPreference } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetVisible, setResetVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState(user?.email || '');
  const [resetLoading, setResetLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: '',
    message: '',
    type: 'info',
    closeText: 'Entendido',
  });

  useEffect(() => {
    const loadSettings = async () => {
      const current = await loadNotificationSettings();
      setSettings(current);
      setLoading(false);
    };

    loadSettings();
  }, []);

  const showDialog = ({ title, message, type = 'info', closeText = 'Entendido' }) => {
    setDialogConfig({ title, message, type, closeText });
    setDialogVisible(true);
  };

  const handleToggleNotifications = async (key, value) => {
    if (!value) {
      const next = { ...settings, [key]: value };
      setSettings(next);
      await saveNotificationSettings(next);
      await clearNotificationGroup(key);
      return;
    }

    const allowed = await ensureNotificationPermissions();
    if (!allowed) {
      showDialog({
        title: 'Permiso requerido',
        message: 'Activa las notificaciones del sistema para usar esta opcion.',
        type: 'warning',
      });
      return;
    }

    const next = { ...settings, [key]: value };
    setSettings(next);
    await saveNotificationSettings(next);

    if (key === 'sugerencias') {
      await ensureSuggestionNotification();
    }
  };

  const handleToggleBiometric = async (value) => {
    if (value) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) {
        showDialog({
          title: 'Huella no disponible',
          message: 'Tu dispositivo no tiene huella configurada.',
          type: 'warning',
        });
        return;
      }
    }

    await setBiometricPreference(value);
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      showDialog({
        title: 'Correo invalido',
        message: 'Ingresa un correo institucional valido.',
        type: 'warning',
      });
      return;
    }

    try {
      setResetLoading(true);
      await api.post('/auth/restablecer', { email: resetEmail });
      setResetVisible(false);
      showDialog({
        title: 'Solicitud enviada',
        message: 'Revisa tu correo para completar el proceso.',
        type: 'success',
        closeText: 'Listo',
      });
    } catch (error) {
      console.error('Error restableciendo contrasena:', error);
      showDialog({
        title: 'No se pudo enviar',
        message: 'Intenta nuevamente en unos minutos.',
        type: 'error',
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (loading || !settings) {
    return (
      <View style={styles.loadingContainer}>
        <AppBackground />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBackground />
      <ModernDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        closeText={dialogConfig.closeText}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="checkbox-outline" size={20} color={colors.primary} />
                <Text style={styles.settingText}>Recordatorios de tareas</Text>
              </View>
              <Switch
                value={settings.tareas}
                onValueChange={(value) => handleToggleNotifications('tareas', value)}
                trackColor={{ false: colors.borderStrong, true: colors.primaryBright }}
                thumbColor={colors.surface}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                <Text style={styles.settingText}>Sugerencias diarias</Text>
              </View>
              <Switch
                value={settings.sugerencias}
                onValueChange={(value) => handleToggleNotifications('sugerencias', value)}
                trackColor={{ false: colors.borderStrong, true: colors.primaryBright }}
                thumbColor={colors.surface}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={styles.settingText}>Calendario academico</Text>
              </View>
              <Switch
                value={settings.calendario}
                onValueChange={(value) => handleToggleNotifications('calendario', value)}
                trackColor={{ false: colors.borderStrong, true: colors.primaryBright }}
                thumbColor={colors.surface}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="finger-print" size={20} color={colors.primary} />
                <Text style={styles.settingText}>Ingresar con huella</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{ false: colors.borderStrong, true: colors.primaryBright }}
                thumbColor={colors.surface}
              />
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setResetVisible(true)}
            >
              <Ionicons name="key-outline" size={20} color={colors.primary} />
              <Text style={styles.resetButtonText}>Restablecer contrasena</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={resetVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Restablecer contrasena</Text>
            <Text style={styles.modalText}>
              Enviaremos un enlace al correo para cambiar tu contrasena.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="correo@unipamplona.edu.co"
              placeholderTextColor={colors.inkSubtle}
              autoCapitalize="none"
              keyboardType="email-address"
              value={resetEmail}
              onChangeText={setResetEmail}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setResetVisible(false)}
                disabled={resetLoading}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.modalConfirmText}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.ink,
    marginBottom: 12,
  },
  settingCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    ...shadows.float,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.ink,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.inkMuted,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    height: 44,
    fontFamily: fonts.regular,
    color: colors.ink,
    marginBottom: 16,
    backgroundColor: colors.surfaceAlt,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.sm,
    alignItems: 'center',
    backgroundColor: colors.chip,
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.inkMuted,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.sm,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },
});
