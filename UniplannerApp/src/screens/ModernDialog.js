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

const ModernDialog = ({ 
  visible, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  onConfirm 
}) => {
  if (!visible) return null;

  // Configuración por tipo
  const config = {
    info: {
      icon: 'information-circle',
      color: '#3B82F6',
      bg: '#EFF6FF',
      iconBg: '#DBEAFE',
    },
    success: {
      icon: 'checkmark-circle',
      color: '#10B981',
      bg: '#D1FAE5',
      iconBg: '#A7F3D0',
    },
    warning: {
      icon: 'alert-circle',
      color: '#F59E0B',
      bg: '#FEF3C7',
      iconBg: '#FDE68A',
    },
    error: {
      icon: 'close-circle',
      color: '#EF4444',
      bg: '#FEE2E2',
      iconBg: '#FECACA',
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
                  <Text style={styles.buttonTextSecondary}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, { backgroundColor: color }]}
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buttonTextPrimary}>Confirmar</Text>
                </TouchableOpacity>
              </>
            ) : (
              // Mostrar solo un botón si no hay confirmación
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, { backgroundColor: color }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonTextPrimary}>Entendido</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  body: {
    padding: 20,
    paddingTop: 0,
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#F9FAFB',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#4F46E5',
  },
  buttonSecondary: {
    backgroundColor: '#E5E7EB',
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});

export default ModernDialog;