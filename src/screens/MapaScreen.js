import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MapaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa de Apoyo</Text>
      <Text style={styles.subtitle}>Ubicación de Puntos Violeta y Centros de Apoyo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF5F8' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5C2448', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#7A6B75', textAlign: 'center', paddingHorizontal: 20 },
});