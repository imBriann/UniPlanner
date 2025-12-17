/**
 * ModernDialog.js
 * Componente reutilizable de diálogo moderno
 * 
 * USO:
 * import ModernDialog from './ModernDialog';
 * 
 * <ModernDialog
 *   visible={dialogVisible}
 *   onClose={() => setDialogVisible(false)}
 *   title="Título del diálogo"
 *   message="Mensaje del diálogo"
 *   type="success" // 'info', 'success', 'warning', 'error'
 *   onConfirm={() => {
 *     // Acción al confirmar (opcional)
 *   }}
 * />
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, shadows } from '../theme/tokens';

const ModernDialog = ({ 
  visible, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  closeText = 'Entendido',
}) => {
  if (!visible) return null;

  // Configuración por tipo
  const config = {
    info: {
      icon: 'information-circle',
      color: colors.info,
      bg: colors.glowSky,
      iconBg: `${colors.info}22`,
    },
    success: {
      icon: 'checkmark-circle',
      color: colors.success,
      bg: colors.glowTeal,
      iconBg: `${colors.success}22`,
    },
    warning: {
      icon: 'alert-circle',
      color: colors.warning,
      bg: colors.accentSoft,
      iconBg: `${colors.warning}22`,
    },
    error: {
      icon: 'close-circle',
      color: colors.danger,
      bg: `${colors.danger}14`,
      iconBg: `${colors.danger}22`,
    },
  };

  const { icon, color, bg, iconBg } = config[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header con ícono */}
          <View style={[styles.header, { backgroundColor: bg }]}>
            <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
              <Ionicons name={icon} size={48} color={color} />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Cuerpo del mensaje */}
          <View style={styles.body}>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Footer con botones */}
          <View style={styles.footer}>
            {onConfirm ? (
              // Mostrar dos botones si hay confirmación
              <>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonTextSecondary}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, { backgroundColor: color }]}
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonTextPrimary}>{confirmText}</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Mostrar solo un botón si no hay confirmación
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, { backgroundColor: color }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonTextPrimary}>{closeText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...shadows.float,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.semibold,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    padding: 20,
    paddingTop: 0,
  },
  message: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: colors.surfaceAlt,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.chip,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.inkMuted,
  },
});

export default ModernDialog;
