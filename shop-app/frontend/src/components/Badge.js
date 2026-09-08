import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, Radius } from '../theme';

export default function Badge({ label, variant = 'primary', size = 'sm' }) {
  const bg = {
    primary: Colors.primaryLight,
    success: Colors.successLight,
    warning: Colors.warningLight,
    danger: Colors.dangerLight,
    info: Colors.infoLight,
    perfumes: '#FCE4EC',
  }[variant] || Colors.primaryLight;

  const color = {
    primary: Colors.primary,
    success: Colors.success,
    warning: Colors.warning,
    danger: Colors.danger,
    info: Colors.info,
    perfumes: Colors.perfumes,
  }[variant] || Colors.primary;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color, fontSize: size === 'sm' ? FontSize.xs : FontSize.sm }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});
