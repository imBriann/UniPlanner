import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/tokens';

export default function AppBackground() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.diagonalTop} />
      <View style={styles.diagonalTopAccent} />
      <View style={styles.glowSide} />
      <View style={styles.diagonalBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  diagonalTop: {
    position: 'absolute',
    width: 260,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    top: -22,
    left: -80,
    opacity: 0.9,
    transform: [{ rotate: '-18deg' }],
  },
  diagonalTopAccent: {
    position: 'absolute',
    width: 200,
    height: 12,
    borderRadius: 8,
    backgroundColor: colors.primaryBright,
    top: 20,
    left: -60,
    opacity: 0.7,
    transform: [{ rotate: '-18deg' }],
  },
  glowSide: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.glowSky,
    top: 180,
    right: -110,
    opacity: 0.6,
  },
  diagonalBottom: {
    position: 'absolute',
    width: 280,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.glowPeach,
    bottom: -24,
    right: -90,
    opacity: 0.9,
    transform: [{ rotate: '-18deg' }],
  },
});
