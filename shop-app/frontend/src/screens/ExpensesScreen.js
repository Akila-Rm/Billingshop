import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { globalStyles } from '../theme/styles';

export default function ExpensesScreen() {
  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.headerTitle}>Expenses</Text>
      </View>
      <Text style={styles.placeholderText}>Expenses functionality coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholderText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
