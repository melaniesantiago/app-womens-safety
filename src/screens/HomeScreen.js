import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>Jueves 5 de noviembre</Text>
            <Text style={styles.welcomeText}>Hola, Lucía</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Botón Rojo Pedir Ayuda */}
        <TouchableOpacity 
          style={styles.panicButton}
          activeOpacity={0.88}
          onLongPress={() => navigation?.navigate('AlertActive')}
          delayLongPress={3000}
        >
          <View style={styles.alertIconCircle}>
            <Ionicons name="warning-outline" size={28} color="#C5221F" />
          </View>
          <View style={styles.panicTextContainer}>
            <Text style={styles.panicTitle}>Pedir ayuda</Text>
            <Text style={styles.panicSubtitle}>Mantén presionado 3 segundos</Text>
          </View>
        </TouchableOpacity>

        {/* Card Mi Pulsera */}
        <TouchableOpacity 
          style={styles.myBraceletCard}
          onPress={() => navigation?.navigate('MyDevice')}
        >
          <View style={styles.starIconBox}>
            <Ionicons name="star" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.braceletInfo}>
            <Text style={styles.braceletTitle}>Mi pulsera</Text>
            <Text style={styles.braceletSub}>Batería 82 % • LoRa • GPS fijo</Text>
            <Text style={styles.view3dText}>Ver en 3D</Text>
          </View>
          <View style={styles.connectedChip}>
            <View style={styles.greenDot} />
            <Text style={styles.connectedText}>Conectada</Text>
          </View>
        </TouchableOpacity>

        {/* Grid 2x2 */}
        <View style={styles.grid}>
          
          {/* Card Sensores */}
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => navigation?.navigate('Sensors')}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="heart-outline" size={18} color="#C5221F" />
              <Text style={styles.cardCategoryTitleRed}>Sensores</Text>
            </View>
            <View style={styles.bpmRow}>
              <Text style={styles.bpmNumber}>76</Text>
              <Text style={styles.bpmUnit}>lpm</Text>
            </View>

            {/* Simulación Gráfica ECG */}
            <View style={styles.ecgContainer}>
              <View style={styles.ecgLine} />
              <View style={styles.ecgPeak} />
              <View style={styles.ecgLineShort} />
            </View>

            <Text style={styles.cardFooterText}>GPS, LoRa, voz y más</Text>
          </TouchableOpacity>

          {/* Card Última Alerta */}
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => navigation?.navigate('LastAlert')}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons name="time-outline" size={18} color="#4C1D95" />
              <Text style={styles.cardCategoryTitlePurple}>Última alerta</Text>
            </View>
            <Text style={styles.alertDateText}>3 nov • 18:32</Text>
            <View style={styles.attendedChip}>
              <Text style={styles.attendedChipText}>Atendida</Text>
            </View>
            <Text style={styles.cardFooterText}>Hora, lugar y pulso</Text>
          </TouchableOpacity>

          {/* Card Acompáñame */}
          <TouchableOpacity 
            style={styles.gridCard}
            onPress={() => navigation?.navigate('Escort')}
          >
            <Ionicons name="location-outline" size={22} color="#4C1D95" style={{ marginBottom: 8 }} />
            <Text style={styles.cardMainTitle}>Acompáñame</Text>
            <Text style={styles.cardFooterText}>Comparte tu trayecto</Text>
          </TouchableOpacity>

          {/* Card Probar Alerta */}
          <TouchableOpacity style={styles.gridCard}>
            <MaterialCommunityIcons name="pulse" size={22} color="#4C1D95" style={{ marginBottom: 8 }} />
            <Text style={styles.cardMainTitle}>Probar alerta</Text>
            <Text style={styles.cardFooterText}>Modo práctica</Text>
          </TouchableOpacity>

        </View>

        {/* Contactos de Confianza */}
        <TouchableOpacity 
          style={styles.contactsCard}
          onPress={() => navigation?.navigate('Contacts')}
        >
          <View style={styles.avatarGroup}>
            <View style={[styles.avatarCircle, { backgroundColor: '#4C1D95' }]}>
              <Text style={styles.avatarLetter}>M</Text>
            </View>
            <View style={[styles.avatarCircle, { backgroundColor: '#0D9488', marginLeft: -10 }]}>
              <Text style={styles.avatarLetter}>V</Text>
            </View>
            <View style={[styles.avatarCircle, { backgroundColor: '#9A3412', marginLeft: -10 }]}>
              <Text style={styles.avatarLetter}>D</Text>
            </View>
          </View>
          
          <View style={styles.contactsTextContainer}>
            <Text style={styles.contactsTitle}>3 contactos de confianza</Text>
            <Text style={styles.contactsSub}>2 activos • 1 pendiente</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

      </ScrollView>

      {/* Navegación Inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home-outline" size={22} color="#4C1D95" />
          <Text style={[styles.navText, styles.navActive]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Contacts')}>
          <Ionicons name="people-outline" size={22} color="#64748B" />
          <Text style={styles.navText}>Contactos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Escort')}>
          <Ionicons name="location-outline" size={22} color="#64748B" />
          <Text style={styles.navText}>Acompáñame</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Resources')}>
          <Ionicons name="bookmark-outline" size={22} color="#64748B" />
          <Text style={styles.navText}>Recursos</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F8F6' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 85 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  welcomeText: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  filterButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },

  // Botón Rojo
  panicButton: {
    backgroundColor: '#C5221F',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3
  },
  alertIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  panicTextContainer: { flex: 1 },
  panicTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  panicSubtitle: { fontSize: 13, color: '#FEE2E2', marginTop: 2 },

  // Card Mi Pulsera
  myBraceletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  starIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#C026D3', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  braceletInfo: { flex: 1 },
  braceletTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  braceletSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  view3dText: { fontSize: 13, color: '#4C1D95', fontWeight: '700', marginTop: 4 },
  connectedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F4EA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#137333', marginRight: 6 },
  connectedText: { fontSize: 12, color: '#137333', fontWeight: '700' },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 125,
    justifyContent: 'center'
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardCategoryTitleRed: { fontSize: 13, fontWeight: '700', color: '#C5221F', marginLeft: 6 },
  cardCategoryTitlePurple: { fontSize: 13, fontWeight: '700', color: '#4C1D95', marginLeft: 6 },
  bpmRow: { flexDirection: 'row', alignItems: 'baseline' },
  bpmNumber: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  bpmUnit: { fontSize: 13, fontWeight: '600', color: '#0F172A', marginLeft: 4 },
  
  // ECG
  ecgContainer: { height: 16, justifyContent: 'center', marginVertical: 4 },
  ecgLine: { height: 2, backgroundColor: '#C5221F', width: '100%' },

  alertDateText: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginVertical: 2 },
  attendedChip: { backgroundColor: '#E6F4EA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 4 },
  attendedChipText: { fontSize: 11, color: '#137333', fontWeight: '700' },

  cardMainTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  cardFooterText: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Contactos
  contactsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  avatarGroup: { flexDirection: 'row', marginRight: 12 },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarLetter: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  contactsTextContainer: { flex: 1 },
  contactsTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  contactsSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Bottom Nav
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  navActive: { color: '#4C1D95', fontWeight: '700' }
});