import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HistorialScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Alertas</Text>
      <Text style={styles.subtitle}>Registro de incidencias y alertas previas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF5F8' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5C2448', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#7A6B75', textAlign: 'center', paddingHorizontal: 20 },
});