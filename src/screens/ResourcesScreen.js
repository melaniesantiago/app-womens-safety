import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Linking, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function ResourcesScreen({ navigation }) {
  
  const handleCallPhone = (number, label) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert('Error', `No se pudo realizar la llamada a ${label}.`);
    });
  };

  const handleOpenWhatsApp = () => {
    Linking.openURL('https://wa.me/5215555555555').catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ENCABEZADO DE RECURSOS */}
        <Text style={styles.title}>Recursos</Text>
        <Text style={styles.subtitle}>Información y apoyo, también sin conexión.</Text>

        {/* BOTÓN EMERGENCIA 911 */}
        <TouchableOpacity 
          style={styles.btn911} 
          activeOpacity={0.8}
          onPress={() => handleCallPhone('911', 'Emergencias 911')}
        >
          <View style={styles.leftRow}>
            <Ionicons name="call" size={22} color="#FFFFFF" style={{ marginRight: 12 }} />
            <Text style={styles.btn911Text}>Emergencias 911</Text>
          </View>
          <Text style={styles.badge24h}>24 h</Text>
        </TouchableOpacity>

        {/* INSTANCIA DE LA MUJER */}
        <TouchableOpacity 
          style={styles.contactCard}
          activeOpacity={0.8}
          onPress={() => handleCallPhone('8000000000', 'Instancia de la Mujer')}
        >
          <Ionicons name="call-outline" size={22} color="#521841" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.contactTitle}>Instancia de la Mujer</Text>
            <Text style={styles.contactSub}>[TELÉFONO DE LA INSTANCIA]</Text>
          </View>
        </TouchableOpacity>

        {/* LÍNEA DE APOYO */}
        <TouchableOpacity 
          style={styles.contactCard}
          activeOpacity={0.8}
          onPress={() => handleCallPhone('8001112233', 'Línea de Apoyo')}
        >
          <Ionicons name="call-outline" size={22} color="#521841" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.contactTitle}>Línea de apoyo</Text>
            <Text style={styles.contactSub}>[TELÉFONO DE LA LÍNEA]</Text>
          </View>
        </TouchableOpacity>

        {/* CUADRÍCULA DE HERRAMIENTAS Y RECURSOS */}
        <View style={styles.gridContainer}>
          
          {/* Mapa de centros */}
          <TouchableOpacity 
            style={styles.gridCard} 
            activeOpacity={0.8}
            onPress={() => Alert.alert('Mapa de Centros', 'Cargando directorio de centros de apoyo sin conexión.')}
          >
            <View style={styles.iconBox}>
              <Ionicons name="map-outline" size={24} color="#521841" />
            </View>
            <Text style={styles.gridTitle}>Mapa de centros</Text>
            <Text style={styles.gridSub}>Disponible sin conexión</Text>
          </TouchableOpacity>

          {/* Violentómetro */}
          <TouchableOpacity 
            style={styles.gridCard} 
            activeOpacity={0.8}
            onPress={() => Alert.alert('Violentómetro', 'Iniciando test interactivo de 17 preguntas.')}
          >
            <View style={styles.iconBox}>
              <Ionicons name="stats-chart-outline" size={24} color="#521841" />
            </View>
            <Text style={styles.gridTitle}>Violentómetro</Text>
            <Text style={styles.gridSub}>Test de 17 preguntas</Text>
          </TouchableOpacity>

          {/* Cartilla de derechos */}
          <TouchableOpacity 
            style={styles.gridCard} 
            activeOpacity={0.8}
            onPress={() => Alert.alert('Cartilla de Derechos', 'Descargando documento PDF de derechos de la mujer.')}
          >
            <View style={styles.iconBox}>
              <Ionicons name="document-text-outline" size={24} color="#521841" />
            </View>
            <Text style={styles.gridTitle}>Cartilla de derechos</Text>
            <Text style={styles.gridSub}>PDF descargable</Text>
          </TouchableOpacity>

          {/* Chat de orientación */}
          <TouchableOpacity 
            style={styles.gridCard} 
            activeOpacity={0.8}
            onPress={handleOpenWhatsApp}
          >
            <View style={styles.iconBox}>
              <Ionicons name="chatbox-ellipses-outline" size={24} color="#521841" />
            </View>
            <Text style={styles.gridTitle}>Chat de orientación</Text>
            <Text style={styles.gridSub}>Por WhatsApp</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

      {/* BARRA NATIVA DE RECURSOS SELECCIONADA */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('MainTabs', { screen: 'InicioTab' })}>
          <Ionicons name="home-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('MainTabs', { screen: 'ContactosTab' })}>
          <Ionicons name="people-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Contactos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('MainTabs', { screen: 'AccompaniTab' })}>
          <Ionicons name="location-outline" size={24} color="#9E8697" />
          <Text style={styles.navText}>Acompáñame</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bookmark" size={24} color="#521841" />
          <Text style={[styles.navText, styles.navTextActive]}>Recursos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  title: { fontSize: 30, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 20, fontWeight: '500' },
  
  btn911: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    backgroundColor: '#B91C1C',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
  },
  leftRow: { flexDirection: 'row', alignItems: 'center' },
  btn911Text: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  badge24h: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', opacity: 0.9 },

  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  contactSub: { fontSize: 12, color: '#94A3B8', marginTop: 2, fontWeight: '600' },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justify: 'space-between',
    marginTop: 8,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3E8F0',
    justify: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  gridSub: { fontSize: 12, color: '#64748B', fontWeight: '500' },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justify: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 4,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
  navText: { fontSize: 11, color: '#9E8697', marginTop: 4, fontWeight: '500', textAlign: 'center' },
  navTextActive: { color: '#521841', fontWeight: '700' },
});