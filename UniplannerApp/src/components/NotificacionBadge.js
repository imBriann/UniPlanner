/**
 * NotificacionBadge.js - Badge de notificaciones no leídas
 * Componente reutilizable para mostrar contador de notificaciones
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import api from '../api/client';
import { colors, fonts } from '../theme/tokens';

export default function NotificacionBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    cargarContador();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarContador, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const cargarContador = async () => {
    try {
      const response = await api.get('/notificaciones/no-leidas/contar');
      setCount(response.data.no_leidas || 0);
    } catch (error) {
      setCount(0);
      if (error?.response) {
        console.warn('Error cargando contador:', error.userMessage || error.message);
      }
    }
  };

  if (count === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 11,
    fontFamily: fonts.semibold,
  },
});
